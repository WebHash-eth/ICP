import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { DomainRegistrationStatus } from './domain.schema';
import { DomainService, SerializedDomainType } from './domain.service';

export const domainNameSchema = z.string().min(1).max(253);

@Controller()
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Post('deployments/:deploymentId/domains')
  async addDomain(
    @Param('deploymentId', ParseIntPipe) deploymentId: number,
    @Body('name', new ZodValidationPipe(domainNameSchema)) domainName: string,
  ): Promise<SerializedDomainType> {
    return this.domainService.addDomain({
      deploymentId,
      domainName,
    });
  }

  @Get('deployments/:deploymentId/domains')
  async getDomains(
    @Param('deploymentId', ParseIntPipe) deploymentId: number,
  ): Promise<SerializedDomainType[]> {
    return this.domainService.getDomains(deploymentId);
  }

  @Delete('domains/:domainId')
  async removeDomain(
    @Param('domainId', ParseIntPipe)
    domainId: number,
  ): Promise<void> {
    return this.domainService.removeDomain(domainId);
  }

  @Get('domains/:domainId/status')
  async getStatus(
    @Param('domainId', ParseIntPipe)
    domainId: number,
  ): Promise<{ status: DomainRegistrationStatus }> {
    return this.domainService.getRegistrationStatus(domainId);
  }
}
