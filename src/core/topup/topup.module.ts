import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IcModule } from '../ic/ic.module';
import { IcTopUp } from './topup.schema';
import { TopUpService } from './topup.service';

@Module({
  imports: [TypeOrmModule.forFeature([IcTopUp]), IcModule],
  providers: [TopUpService],
  exports: [TopUpService],
})
export class TopUpModule {}
