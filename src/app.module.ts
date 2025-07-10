import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import { LoggerModule } from 'nestjs-pino';
import { ConfigVariablesType } from './config';
import { ConfigModule } from './config/config.module';
import { DeploymentModule } from './core/deployment/deployment.module';
import { DomainModule } from './core/domain/domain.module';
import { CronService } from './services/cron.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService<ConfigVariablesType, true>) {
        const { host, port, username, password, database } = configService.get(
          'db.mysql',
          { infer: true },
        );
        const env = configService.get('app.env', { infer: true });
        return {
          type: 'mysql',
          host,
          port,
          username,
          password,
          database,
          synchronize: env === 'local',
          autoLoadEntities: true,
          logger: 'file',
          logging: env === 'local',
        };
      },
      inject: [ConfigService],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigVariablesType, true>) => {
        const env = configService.get('app.env', { infer: true });
        const appName = configService.get('app.name', { infer: true });
        return {
          pinoHttp: {
            genReqId: () => nanoid(),
            level: env === 'local' ? 'debug' : 'info',
            transport:
              env === 'local'
                ? {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      messageFormat:
                        '[{appName}] {msg}{if context} ({context}){end}',
                      // Ignore these fields in the JSON output
                      ignore: 'time,hostname,appName,context',
                    },
                  }
                : undefined,
            serializers: {
              req(req) {
                // eslint-disable-next-line
                req.body = req.raw.body;
                // eslint-disable-next-line
                return req;
              },
            },
            formatters: {
              bindings: (bindings) => {
                return {
                  appName,
                  hostname: bindings.hostname as string,
                };
              },
            },
          },
        };
      },
    }),
    DeploymentModule,
    DomainModule,
  ],
  providers: [CronService],
})
export class AppModule {}
