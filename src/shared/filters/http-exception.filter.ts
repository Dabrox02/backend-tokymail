import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'INTERNAL_SERVER_ERROR';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      status = exception.getStatus();

      if (typeof res === 'string') {
        message = res;
        error = res;
      } else if (typeof res === 'object' && res !== null) {
        if ('message' in res) {
          const msg = (res as { message?: unknown }).message;
          if (Array.isArray(msg)) {
            message = msg.join(', ');
          } else if (typeof msg === 'string') {
            message = msg;
          }
        }

        if (
          'error' in res &&
          typeof (res as { error?: unknown }).error === 'string'
        ) {
          error = (res as { error: string }).error;
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
