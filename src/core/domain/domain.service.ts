import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { isAxiosError } from 'axios';
import { In, Not, Repository } from 'typeorm';
import { DeploymentStatus } from '../deployment/deployment.schema';
import { DeploymentService } from '../deployment/deployment.service';
import { IcService } from '../ic/ic.service';
import { DomainRegistrationStatus, IcDomain } from './domain.schema';

export type SerializedDomainType = Omit<
  IcDomain,
  'updatedAt' | 'deployment' | 'deletedAt'
>;

@Injectable()
export class DomainService {
  private logger = new Logger(DomainService.name);

  constructor(
    @InjectRepository(IcDomain)
    private readonly repository: Repository<IcDomain>,
    private readonly deploymentService: DeploymentService,
    private readonly icService: IcService,
  ) {}

  private _serializeDomain(domain: IcDomain): SerializedDomainType {
    return {
      id: domain.id,
      name: domain.name,
      deploymentId: domain.deploymentId,
      registrationId: domain.registrationId,
      registrationStatus: domain.registrationStatus,
      registrationErrorMessage: domain.registrationErrorMessage,
      createdAt: domain.createdAt,
    };
  }

  private async _checkAndUpdateRegistrationStatus(domain: IcDomain) {
    const { data } = await axios.get<{
      name: string;
      canister: string; // Assuming canister might be useful later
      state:
        | Exclude<DomainRegistrationStatus, 'Failed'>
        | {
            Failed: string; // Structure for failed state
          };
    }>(`https://icp0.io/registrations/${domain.registrationId}`);

    this.logger.log({
      msg: `Checked domain registration status from IC`,
      domain: domain.name,
      registrationId: domain.registrationId,
      icResponse: data,
    });

    let currentStatus: DomainRegistrationStatus;
    let errorMessage: string | null = null;

    // Determine the status and potential error message
    if (typeof data.state === 'object' && 'Failed' in data.state) {
      currentStatus = 'Failed';
      errorMessage = data.state.Failed; // Store the error message
    } else {
      currentStatus = data.state;
    }

    if (
      domain.registrationStatus !== currentStatus ||
      domain.registrationErrorMessage !== errorMessage
    ) {
      this.logger.log(
        `Updating status for domain ${domain.name} (ID: ${domain.id}) from ${domain.registrationStatus} to ${currentStatus}`,
      );
      await this.repository.update(
        { id: domain.id },
        {
          registrationStatus: currentStatus,
          registrationErrorMessage: errorMessage,
        },
      );
    }

    return {
      name: data.name,
      status: currentStatus,
      errorMessage: errorMessage,
    };
  }

  private async _registerOnIc(domainName: string) {
    try {
      // this registration request verifies these DNS conditions
      // 1. _acme-challenge CNAME
      // 2. _canister-id TXT
      // It does not verify the root cname
      // - @ CNAME webhash.aman.run.icp1.io.
      const { data } = await axios.post<{ id: string }>(
        'https://icp0.io/registrations',
        {
          name: domainName,
        },
      );
      this.logger.log({
        msg: `Registering domain`,
        domainName,
        response: data,
      });
      return data.id;
    } catch (error) {
      if (isAxiosError(error) && typeof error.response?.data === 'string') {
        throw new BadRequestException(error.response.data);
      }
      throw error;
    }
  }

  private async _deleteFromIc(registrationId: string) {
    const { data } = await axios.delete<unknown>(
      `https://icp0.io/registrations/${registrationId}`,
    );
    this.logger.log({
      msg: `Deleting domain from IC`,
      registrationId,
      response: data,
    });
  }

  async getDomains(deploymentId: number): Promise<SerializedDomainType[]> {
    const domains = await this.repository.find({
      where: { deploymentId },
      order: { createdAt: 'DESC' },
    });

    return domains.map((d) => this._serializeDomain(d));
  }

  async addDomain({
    deploymentId,
    domainName,
  }: {
    deploymentId: number;
    domainName: string;
  }): Promise<SerializedDomainType> {
    const deployment = await this.deploymentService.getDeployment(
      deploymentId,
      {
        status: DeploymentStatus.COMPLETED,
      },
    );
    const domainCount = await this.repository.count({
      where: { deploymentId, name: domainName },
    });
    if (domainCount) {
      throw new BadRequestException(`Domain already exists: ${domainName}`);
    }
    await this.icService.addDomainToCanister(deployment.canisterId, domainName);
    const registrationId = await this._registerOnIc(domainName);
    const createdDomain = await this.repository.save({
      deploymentId,
      name: domainName,
      registrationId,
      registrationStatus: 'PendingOrder',
    });
    return this._serializeDomain(createdDomain);
  }

  async removeDomain(domainId: number): Promise<void> {
    const domain = await this.repository
      .createQueryBuilder('domain')
      .leftJoinAndSelect('domain.deployment', 'deployment')
      .where('domain.id = :domainId', { domainId })
      .getOneOrFail();

    await this.icService.removeDomainFromCanister(
      domain.deployment!.canisterId,
      domain.name,
    );
    await this.repository.softRemove(domain);
    await this._deleteFromIc(domain.registrationId);
  }

  async getRegistrationStatus(domainId: number) {
    const domain = await this.repository.findOneByOrFail({ id: domainId });
    return this._checkAndUpdateRegistrationStatus(domain);
  }

  async checkPendingRegistrations(): Promise<void> {
    this.logger.log('Starting check for pending domain registrations...');
    const pendingDomains = await this.repository.find({
      where: { registrationStatus: Not(In(['Available'])) },
    });

    if (pendingDomains.length === 0) {
      this.logger.log('No pending domain registrations found.');
      return;
    }

    this.logger.log(
      `Found ${pendingDomains.length} pending domain registrations to check.`,
    );

    for (const domain of pendingDomains) {
      await this._checkAndUpdateRegistrationStatus(domain).catch(
        (error: unknown) => {
          this.logger.error({
            err: error,
            msg: `Error processing pending registration check for domain ${domain.name} (ID: ${domain.id})`,
          });
        },
      );
    }
  }
}
