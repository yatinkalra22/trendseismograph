import { HttpStatus } from '@nestjs/common';
import { AppError, AppErrorCode } from './app-error';

type MappedError = {
  status: number;
  code: AppErrorCode;
  message: string;
  userMessage: string;
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

const codeToUserMessage: Record<AppErrorCode, string> = {
  [AppErrorCode.VALIDATION]: 'Please check your input and try again.',
  [AppErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [AppErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
  [AppErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [AppErrorCode.CONFLICT]: 'This request conflicts with the current state.',
  [AppErrorCode.EXTERNAL_SERVICE]: 'A dependent service is temporarily unavailable. Please try again soon.',
  [AppErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
  [AppErrorCode.INFRASTRUCTURE]: 'The service is temporarily unavailable. Please try again soon.',
  [AppErrorCode.INTERNAL]: 'Something went wrong. Please try again.',
};

export function mapAppError(error: AppError): MappedError {
  return {
    status: codeToStatus[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR,
    code: error.code,
    category: error.category,
    message: error.message,
    userMessage: codeToUserMessage[error.code] ?? codeToUserMessage[AppErrorCode.INTERNAL],
    details: error.details,
  };
}
