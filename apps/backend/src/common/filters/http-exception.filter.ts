import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { messages } from '@ahansk/shared';

interface ErrorResponse {
  success: false;
  message: string;
  error?: Record<string, string[]>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message = exception.message;
      let error: Record<string, string[]> | undefined;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        if (typeof res['message'] === 'string') message = res['message'];
        if (Array.isArray(res['message'])) {
          error = { _errors: res['message'] as string[] };
        }
        if (res['error'] && typeof res['error'] === 'object') {
          error = res['error'] as Record<string, string[]>;
        }
      }

      const body: ErrorResponse = { success: false, message };
      if (error) body.error = error;

      response.status(status).json(body);
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: messages.common.serverError,
    } satisfies ErrorResponse);
  }
}
