import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeploymentModule } from '../deployment/deployment.module';
import { IcModule } from '../ic/ic.module';
import { DomainController } from './domain.controller';
import { IcDomain } from './domain.schema';
import { DomainService } from './domain.service';

@Module({
  imports: [TypeOrmModule.forFeature([IcDomain]), IcModule, DeploymentModule],
  controllers: [DomainController],
  providers: [DomainService],
  exports: [DomainService],
})
export class DomainModule {}
