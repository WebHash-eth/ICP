import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigVariablesType } from 'src/config';
import { DiscordService } from 'src/services/discord.service';
import { cyclesToTC, isInsufficientFundsError, sleep } from 'src/utils';
import { Repository } from 'typeorm';
import { IcService } from '../ic/ic.service';
import { TopUpService } from '../topup/topup.service';
import { DeploymentStatus, IcDeployment } from './deployment.schema';
import { DeploymentCreateDto } from './dto/deployment.create.dto';

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(IcService.name);

  constructor(
    @InjectRepository(IcDeployment)
    private readonly repository: Repository<IcDeployment>,
    private readonly discordService: DiscordService,
    private readonly icService: IcService,
    private readonly topUpService: TopUpService,
    private readonly configService: ConfigService<ConfigVariablesType, true>,
  ) {}

  async createDeployment({
    deploymentId: id,
    userId,
    folderPath,
  }: DeploymentCreateDto) {
    try {
      const deployment = await this.repository.findOneBy({ id });
      let canisterId: string;
      let blockId: string;

      if (deployment) {
        canisterId = deployment.canisterId;
        await this.repository.update(
          { id },
          {
            folderPath,
            status: DeploymentStatus.IN_PROGRESS,
          },
        );
      } else {
        const result = await this.icService.createCanister();
        canisterId = result.canisterId.toText();
        blockId = result.blockId.toString();
        this.logger.log({
          message: `Canister created: ${canisterId}`,
          canisterId,
          id,
        });
        await this.repository.insert({
          id,
          userId,
          folderPath,
          canisterId,
          status: DeploymentStatus.IN_PROGRESS,
          canisterBlockId: blockId,
        });
      }
      await this.icService.installCode(canisterId, !!deployment);
      await sleep(5000);
      await this.icService.addAssets(canisterId, folderPath);
      await this.repository.update(
        { id },
        { status: DeploymentStatus.COMPLETED, deployedAt: new Date() },
      );

      return { canisterId };
    } catch (err: unknown) {
      if (isInsufficientFundsError(err)) {
        const balance = cyclesToTC(err.err.InsufficientFunds.balance);
        await this.discordService.sendError(
          `InsufficientFunds\nCurrent balance: ${balance} TC(trillion cycles)`,
        );
      }
      const errorMessage =
        typeof err === 'object' && err && 'message' in err
          ? String(err.message)
          : String(err);

      this.logger.error({
        msg: `Deployment failed for ${id}`,
        err,
      });
      await this.repository.update(
        { id },
        {
          status: DeploymentStatus.FAILED,
          error: errorMessage,
        },
      );

      throw err;
    }
  }

  async getDeployment(
    id: number,
    filter?: {
      status?: DeploymentStatus;
    },
  ) {
    const deployment = await this.repository.findOne({
      where: { id, ...filter },
    });
    if (!deployment) {
      throw new BadRequestException(`Deployment not found: ${id}`);
    }
    return deployment;
  }

  async isCompleted(id: number) {
    const deployment = await this.repository.countBy({
      id,
      status: DeploymentStatus.COMPLETED,
    });
    return deployment > 0;
  }

  async checkAndTopUpCanisters() {
    const config = this.configService.get('ic', { infer: true });

    const threeDaysAgo = new Date();
    threeDaysAgo.setUTCDate(
      threeDaysAgo.getUTCDate() - config.canisterStatusCheckIntervalDays,
    );

    const deployments = await this.repository
      .createQueryBuilder()
      .where('status = :status', {
        status: DeploymentStatus.COMPLETED,
      })
      .andWhere('lastStatusCheckAt <= :date', { date: threeDaysAgo })
      .getMany();

    if (deployments.length === 0) {
      this.logger.log('No deployments to check');
      return;
    }

    for (const deployment of deployments) {
      try {
        const status = await this.icService.getCanisterStatus(
          deployment.canisterId,
        );
        let remainingCycles: string | bigint = status.cycles;

        if (status.cycles < config.minCyclesThreshold) {
          this.logger.log(
            `Canister ${deployment.canisterId} needs top up. Current cycles: ${status.cycles}`,
          );
          const topup = await this.topUpService.topUpCanister({
            amount: config.topUpAmount,
            canisterId: deployment.canisterId,
            cyclesBefore: status.cycles,
            deploymentId: deployment.id,
          });
          remainingCycles = topup.cyclesAfter;
        }

        await this.repository.update(
          { id: deployment.id },
          {
            remainingCycles: remainingCycles.toString(),
            lastStatusCheckAt: new Date(),
          },
        );
      } catch (error) {
        if (isInsufficientFundsError(error)) {
          const balance = cyclesToTC(error.err.InsufficientFunds.balance);
          await this.discordService.sendError(
            `InsufficientFunds\nCurrent balance: ${balance} TC(trillion cycles)`,
          );
          this.logger.error(
            `InsufficientFunds (${balance} TC): stopping the topup loop`,
          );
          // break as we don't have funds to top up
          break;
        }

        this.logger.error({
          msg: `Failed to check/top up canister ${deployment.canisterId}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          err: error,
        });
      }
    }
  }
}
