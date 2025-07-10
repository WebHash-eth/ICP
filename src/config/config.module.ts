import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import config from './index';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: config,
    }),
  ],
})
export class ConfigModule {}
