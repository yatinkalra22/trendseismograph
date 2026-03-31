import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { mapAppError } from '../errors/error-mapper';

function toHumanMessage(status: number): string {
  if (status === HttpStatus.BAD_REQUEST) return 'Please check your request and try again.';
  if (status === HttpStatus.UNAUTHORIZED) return 'You are not authorized to perform this action.';
  if (status === HttpStatus.FORBIDDEN) return 'You do not have permission to access this resource.';
  if (status === HttpStatus.NOT_FOUND) return 'The requested resource was not found.';
  if (status === HttpStatus.CONFLICT) return 'This request conflicts with the current state.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Unable to process your request. Please try again.';
}

function extractHttpMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object') {
    const payload = response as { message?: string | string[] };
    if (Array.isArray(payload.message) && payload.message.length > 0) {
      return payload.message[0];
    }
    if (typeof payload.message === 'string' && payload.message.length > 0) {
      return payload.message;
    }
  }
  return exception.message || 'Request failed';
}

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
        message: mapped.userMessage,
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

    const technicalMessage = exception instanceof HttpException
      ? extractHttpMessage(exception)
      : 'Internal server error';

    const message = status >= 500
      ? toHumanMessage(status)
      : technicalMessage;

    response.status(status).json({
      statusCode: status,
      message,
      userMessage: message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }
}
