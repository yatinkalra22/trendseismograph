export type ErrorCategory = 'domain' | 'infrastructure';

export enum AppErrorCode {
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  TIMEOUT = 'TIMEOUT',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  INTERNAL = 'INTERNAL',
}

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly category: ErrorCategory,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class DomainError extends AppError {
  constructor(code: AppErrorCode, message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(code, 'domain', message, details, cause);
  }
}

export class InfrastructureError extends AppError {
  constructor(code: AppErrorCode, message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(code, 'infrastructure', message, details, cause);
  }
}
