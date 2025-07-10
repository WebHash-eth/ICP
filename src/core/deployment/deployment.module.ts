import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from 'src/services/discord.service';
import { IcModule } from '../ic/ic.module';
import { TopUpModule } from '../topup/topup.module';
import { IcDeployment } from './deployment.schema';
import { DeploymentService } from './deployment.service';
import { DeploymentController } from './deployment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IcDeployment]), IcModule, TopUpModule],
  controllers: [DeploymentController],
  providers: [DeploymentService, DiscordService],
  exports: [DeploymentService],
})
export class DeploymentModule {}
