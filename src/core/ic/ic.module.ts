import { Module } from '@nestjs/common';
import { IcController } from './ic.controller';
import { IcService } from './ic.service';

@Module({
  providers: [IcService],
  controllers: [IcController],
  exports: [IcService],
})
export class IcModule {}
