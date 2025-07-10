import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IcService } from '../ic/ic.service';
import { IcTopUp, TopUpStatus } from './topup.schema';

@Injectable()
export class TopUpService {
  private readonly logger = new Logger(TopUpService.name);

  constructor(
    @InjectRepository(IcTopUp)
    private readonly repository: Repository<IcTopUp>,
    private readonly icService: IcService,
  ) {}

  async topUpCanister({
    deploymentId,
    canisterId,
    amount,
    cyclesBefore,
  }: {
    deploymentId: number;
    canisterId: string;
    amount: bigint;
    cyclesBefore: bigint;
  }) {
    this.logger.log(`Topping up canister ${canisterId} with ${amount} cycles`);
    const topup = await this.repository.save(
      this.repository.create({
        deploymentId,
        canisterId,
        amount: amount.toString(),
        cyclesBefore: cyclesBefore.toString(),
        status: TopUpStatus.PENDING,
      }),
    );
    const cycles = await this.icService.topUpCanister({
      canisterId,
      amount,
      cyclesBefore,
    });
    topup.status = TopUpStatus.COMPLETED;
    topup.cyclesAfter = cycles.toString();
    await this.repository.save(topup);
    return topup;
    //TODO: do something with the error
  }
}
