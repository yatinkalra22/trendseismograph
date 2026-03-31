import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { mapAppError } from '../errors/error-mapper';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<{ url?: string; method?: string }>();

    if (exception instanceof AppError) {
      const mapped = mapAppError(exception);
      response.status(mapped.status).json({
        statusCode: mapped.status,
        code: mapped.code,
        category: mapped.category,
        message: mapped.message,
        details: mapped.details,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }
}
