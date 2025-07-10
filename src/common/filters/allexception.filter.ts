import {
  ArgumentsHost,
  Catch,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { Response } from 'express';
import { IcError } from 'src/utils';
import { EntityNotFoundError } from 'typeorm';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private logger = new Logger('ExceptionHandler');

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception);
    if (exception instanceof ZodError) {
      return this.catchZodError(exception, host);
    }
    if (exception instanceof IcError) {
      return this.catchIcError(exception, host);
    }
    if (exception instanceof EntityNotFoundError) {
      return super.catch(new NotFoundException('Entity not found'), host);
    }
    return super.catch(exception, host);
  }

  catchIcError(exception: IcError<unknown>, host: ArgumentsHost) {
    const errorResponse = {
      message: exception.message,
      statusCode: 500,
    };
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    return res.status(500).send(errorResponse);
  }

  catchZodError(exception: ZodError, host: ArgumentsHost) {
    const errorResponse = {
      message: 'Validation Failed',
      errors: exception.errors,
      statusCode: 400,
    };
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    return res.status(400).send(errorResponse);
  }
}
