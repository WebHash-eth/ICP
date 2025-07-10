import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';
import { DeploymentService } from 'src/core/deployment/deployment.service';
import { DomainService } from 'src/core/domain/domain.service';
import { runInfinitely } from 'src/utils';

@Injectable()
export class CronService {
  private logger = new Logger(CronService.name);
  private enabled = this.configService.get('cron.enabled', { infer: true });

  constructor(
    private readonly configService: ConfigService<ConfigVariablesType, true>,
    private readonly deploymentService: DeploymentService,
    private readonly domainService: DomainService,
  ) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('Cron service is disabled');
      return;
    }
    runInfinitely({
      func: this.checkAndTopUpCanisters,
      logger: this.logger,
      sleepMs: 3_600_000, // 1 hour
      errorSleepMs: 600_000, // 10 minutes
    }).catch((e) => {
      this.logger.error('runInfinitely failed unexpectedly', e);
      process.exit(-1);
    });

    runInfinitely({
      func: this.domainStatusCheck,
      logger: this.logger,
      sleepMs: 60_000, // 1 minute
      errorSleepMs: 10_000, // 60 sec
    }).catch((e) => {
      this.logger.error('runInfinitely failed unexpectedly', e);
      process.exit(-1);
    });
  }

  checkAndTopUpCanisters = async () => {
    this.logger.log('Starting canister cycles check');
    await this.deploymentService.checkAndTopUpCanisters();
  };

  domainStatusCheck = async () => {
    this.logger.log('Starting domain status check');
    await this.domainService.checkPendingRegistrations();
  };
}
