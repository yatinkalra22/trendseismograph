import { HttpStatus } from '@nestjs/common';
import { AppError, AppErrorCode } from './app-error';

type MappedError = {
  status: number;
  code: AppErrorCode;
  message: string;
  category: string;
  details?: Record<string, unknown>;
};

const codeToStatus: Record<AppErrorCode, number> = {
  [AppErrorCode.VALIDATION]: HttpStatus.BAD_REQUEST,
  [AppErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [AppErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [AppErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [AppErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [AppErrorCode.EXTERNAL_SERVICE]: HttpStatus.BAD_GATEWAY,
  [AppErrorCode.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
  [AppErrorCode.INFRASTRUCTURE]: HttpStatus.SERVICE_UNAVAILABLE,
  [AppErrorCode.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR,
};

export function mapAppError(error: AppError): MappedError {
  return {
    status: codeToStatus[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR,
    code: error.code,
    category: error.category,
    message: error.message,
    details: error.details,
  };
}
