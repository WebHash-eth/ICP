import { Actor, getManagementCanister, HttpAgent } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
import { Principal } from '@dfinity/principal';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigVariablesType } from 'src/config';
import {
  batchExecute,
  getContentType,
  getFilesRecursive,
  IcError,
  sleep,
} from 'src/utils';
import { createClcActor, createFrontendActor } from './candid';

const IC_DOMAINS_KEY = '/.well-known/ic-domains';

@Injectable()
export class IcService {
  private readonly logger = new Logger(IcService.name);

  private identity: Secp256k1KeyIdentity;
  private agent?: HttpAgent;

  constructor(
    private readonly configService: ConfigService<ConfigVariablesType, true>,
  ) {
    const key = this.configService.get('ic.identityPem', { infer: true });
    this.identity = Secp256k1KeyIdentity.fromPem(key);
  }

  private async getAgent() {
    if (!this.agent) {
      const config = this.configService.get('ic', { infer: true });
      this.agent = await HttpAgent.create({
        host: config.host,
        identity: this.identity,
        // fetch: createFetchWithTimeout(30000), // 30 seconds
      });
      if (config.hostName === 'local') {
        this.logger.debug('Fetching root key');
        await this.agent.fetchRootKey();
      }
    }
    return this.agent;
  }

  async createCanister() {
    const config = this.configService.get('ic', {
      infer: true,
    });
    const agent = await this.getAgent();
    if (config.hostName === 'local') {
      const canisterId = await Actor.createCanister({ agent });
      return { canisterId, blockId: 0 };
    }
    const clc = createClcActor({
      agent,
      canisterId: config.clcId,
    });
    const result = await clc.create_canister({
      amount: config.initialCanisterCycles,
      from_subaccount: [], // Optional field, empty array means no subaccount
      created_at_time: [], // Optional field, empty array means use current time
      creation_args: [
        {
          settings: [], // Optional CanisterSettings
          subnet_selection: [], // Optional subnet selection
        },
      ],
    });

    if ('Ok' in result) {
      const canisterId = result.Ok.canister_id;
      const blockId = result.Ok.block_id;
      this.logger.log(
        `Successfully created canister with ID: ${canisterId.toText()} (block: ${blockId})`,
      );
      return { canisterId, blockId };
    } else if ('Err' in result) {
      this.logger.error({
        msg: 'Got error when creating mainnet canister',
        err: result.Err,
      });
      throw new IcError(result.Err);
    }
    this.logger.error({
      msg: 'Unexpected result when creating canister',
      result,
    });
    throw new Error('Unexpected result when creating canister');
  }

  async installCode(canisterId: string, reInstall?: boolean) {
    const agent = await this.getAgent();
    const { frontendWasmPath, frontendWashHash } = this.configService.get(
      'ic',
      {
        infer: true,
      },
    );
    if (reInstall) {
      const canisterStatus = await this.getRawCanisterStatus(canisterId);
      const hashBuf = canisterStatus.module_hash[0];
      if (hashBuf) {
        const hash = Buffer.from(hashBuf).toString('base64');
        if (hash === frontendWashHash) {
          this.logger.log(
            `Canister ${canisterId} already has same code. Skipping installation!`,
          );
          return;
        }
      }
    }
    const wasmBuffer = await fs.readFile(frontendWasmPath);
    await Actor.install(
      {
        module: wasmBuffer,
        mode: reInstall ? { reinstall: null } : { install: null },
        arg: IDL.encode([], []), // Empty arguments array
      },
      {
        agent,
        canisterId,
      },
    );
    this.logger.log(`Code installed successfully for canister: ${canisterId}`);
  }

  async addAssets(canisterId: string, folderPath: string) {
    folderPath = path.normalize(folderPath);
    const stats = await fs.stat(folderPath).catch(() => {
      throw new BadRequestException(`Cannot access path: ${folderPath}`);
    });
    if (!stats.isDirectory()) {
      throw new BadRequestException(`Path ${folderPath} is not a directory`);
    }

    const agent = await this.getAgent();
    const actor = createFrontendActor({
      agent,
      canisterId,
    });

    // Recursively get all files
    const files = await getFilesRecursive(folderPath);
    this.logger.log({
      msg: `Uploading files in canister: ${canisterId}`,
      totalFiles: files.length,
      files,
    });
    await batchExecute(files, 5, async (file) => {
      const content = await fs.readFile(file);
      const relativePath = path.relative(folderPath, file);
      const contentType = getContentType(file);
      this.logger.log({
        msg: `Storing asset: ${relativePath}`,
        args: {
          key: `/${relativePath}`,
          content_type: contentType,
        },
      });
      await actor.store({
        key: `/${relativePath}`,
        content,
        content_type: contentType,
        content_encoding: '',
        sha256: [],
      });
      this.logger.log(`Asset ${relativePath} uploaded`);
    });
    const icAssetContentsBuffer = Buffer.from(
      JSON.stringify(
        [
          {
            match: '.well-known',
            ignore: false,
          },
          {
            match: '**/*',
            security_policy: 'standard',
          },
        ],
        null,
        2,
      ),
    );
    await actor.store({
      key: `/.ic-assets.json5`,
      content: icAssetContentsBuffer,
      content_type: 'application/json',
      content_encoding: '',
      sha256: [],
    });
  }

  async getCanisterStatus(canisterId: string) {
    try {
      const status = await this.getRawCanisterStatus(canisterId);
      this.logger.log({
        msg: 'Fetched canister status',
        canisterId,
        status,
      });

      return {
        isRunning: 'running' in status.status,
        cycles: status.cycles,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'reject_message' in error) {
        const cyclesMatch = (error.reject_message as string).match(
          /out of cycles: please top up the canister with at least ([0-9_]+) additional cycles/,
        );
        if (cyclesMatch) {
          return {
            isRunning: false,
            cycles: 0n,
          };
        }
      }
      this.logger.error('Error getting canister status', error);
      throw error;
    }
  }

  async getRawCanisterStatus(canisterId: string) {
    const agent = await this.getAgent();
    const managementCanister = getManagementCanister({
      agent,
    });
    const status = await managementCanister.canister_status({
      canister_id: Principal.fromText(canisterId),
    });
    return status;
  }

  // async addDomain(deploymentId: number, domain: string) {
  //   const deployment = await this.repository.findOne({
  //     where: { id: deploymentId, status: DeploymentStatus.COMPLETED },
  //   });
  //   if (!deployment) {
  //     throw new BadRequestException(
  //       `Completed Deployment not found: ${deploymentId}`,
  //     );
  //   }
  //   const agent = await this.getAgent();
  //   const actor = createFrontendActor({
  //     agent,
  //     canisterId: deployment.canisterId,
  //   });
  //   // await actor.delete_asset({ key: '/.well-known/ic-domains' });
  //   return this.domainServer.addDomain({
  //     actor,
  //     deploymentId,
  //     domain,
  //   });
  // }
  //
  // async removeDomain(deploymentId: number, domain: string) {
  //   const deployment = await this.repository.findOne({
  //     where: { id: deploymentId, status: DeploymentStatus.COMPLETED },
  //   });
  //   if (!deployment) {
  //     throw new BadRequestException(
  //       `Completed Deployment not found: ${deploymentId}`,
  //     );
  //   }
  //   const agent = await this.getAgent();
  //   const actor = createFrontendActor({
  //     agent,
  //     canisterId: deployment.canisterId,
  //   });
  //   return this.domainServer.removeDomain({
  //     actor,
  //     deploymentId,
  //     domain,
  //   });
  // }
  //
  // async getDomains(deploymentId: number) {
  //   const deployment = await this.repository.findOne({
  //     where: { id: deploymentId, status: DeploymentStatus.COMPLETED },
  //     relations: ['domains'],
  //   });
  //   if (!deployment) {
  //     throw new BadRequestException(
  //       `Completed Deployment not found: ${deploymentId}`,
  //     );
  //   }
  //   return deployment.domains!;
  // }

  async addDomainToCanister(canisterId: string, domainName: string) {
    const agent = await this.getAgent();
    const actor = createFrontendActor({
      agent,
      canisterId,
    });

    let content: Buffer;
    const file = await actor
      .get({
        key: IC_DOMAINS_KEY,
        accept_encodings: ['identity'],
      })
      .catch((error: Error) => {
        if (error.message.includes('asset not found')) {
          return null;
        }
        if (error.message.includes('no such encoding')) {
          return null;
        }
        throw error;
      });
    if (!file) {
      content = Buffer.from(domainName);
    } else {
      const contentString = Buffer.from(file.content).toString('utf-8').trim();
      const existingDomains = contentString
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);

      if (existingDomains.includes(domainName)) {
        this.logger.log(
          `Domain ${domainName} already exists in ${IC_DOMAINS_KEY} for canister ${canisterId}. Skipping.`,
        );
        return;
      }
      content = Buffer.from(
        contentString + (contentString ? '\n' : '') + domainName,
      );
    }
    await actor.store({
      key: IC_DOMAINS_KEY,
      content,
      content_type: 'text/plain',
      content_encoding: 'identity',
      sha256: [],
    });
  }

  async removeDomainFromCanister(canisterId: string, domainName: string) {
    const agent = await this.getAgent();
    const actor = createFrontendActor({
      agent,
      canisterId,
    });
    // Get current domains file from IC
    const file = await actor.get({
      key: IC_DOMAINS_KEY,
      accept_encodings: ['identity'],
    });
    const content = Buffer.from(file.content).toString('utf-8');
    const existingDomains = content
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d && d !== domainName);

    const newContent = existingDomains.join('\n');

    if (newContent === content) {
      this.logger.debug(
        `Domain ${domainName} not found in ${IC_DOMAINS_KEY} for canister ${canisterId}. No update needed.`,
      );
      return;
    }
    await actor.store({
      key: IC_DOMAINS_KEY,
      content: Buffer.from(newContent),
      content_type: 'text/plain',
      content_encoding: 'identity',
      sha256: [],
    });
  }

  async topUpCanister({
    canisterId,
    amount,
    cyclesBefore,
  }: {
    canisterId: string;
    amount: bigint;
    cyclesBefore: bigint;
  }) {
    const clcId = this.configService.get('ic.clcId', { infer: true });
    const clc = createClcActor({
      agent: await this.getAgent(),
      canisterId: clcId,
    });

    const result = await clc.withdraw({
      to: Principal.from(canisterId),
      amount,
      created_at_time: [],
      from_subaccount: [],
    });

    const retryCanisterStatus = async () => {
      this.logger.log(`Retrying canister status for ${canisterId}`);
      const { cycles } = await this.getCanisterStatus(canisterId);
      // if cycles are the same as before, wait and fetch status again
      if (cycles === cyclesBefore) {
        await sleep(1000);
        return retryCanisterStatus();
      }
      return { cycles };
    };

    if ('Ok' in result) {
      this.logger.log(
        `Successfully topped up canister ${canisterId} with ${amount} cycles`,
      );
      const { cycles } = await retryCanisterStatus();
      return cycles;
    } else if ('Err' in result) {
      throw new IcError(result.Err);
    }
    throw new Error('Unexpected result');
  }
}
