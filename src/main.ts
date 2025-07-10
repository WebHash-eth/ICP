import { config } from 'dotenv-flow';
config({ silent: true });

import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/allexception.filter';
import { APP_NAME, ConfigVariablesType } from './config';

/* eslint-disable */
// @ts-expect-error
BigInt.prototype.toJSON = function () {
  return this.toString();
};
/* eslint-enable */

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost).httpAdapter),
  );
  const configService = app.get(ConfigService<ConfigVariablesType, true>);
  const port = configService.get('app.port', { infer: true });

  await app.listen(port);
  logger.log(`${APP_NAME} listening on port : ${await app.getUrl()}`);
}
void bootstrap();
