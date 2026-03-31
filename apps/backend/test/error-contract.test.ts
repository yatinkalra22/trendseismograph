/// <reference types="node" />

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AppErrorCode, InfrastructureError } from '../src/common/errors/app-error';
import { mapAppError } from '../src/common/errors/error-mapper';

type MockResponse = {
  statusCode?: number;
  payload?: Record<string, unknown>;
  status: (code: number) => MockResponse;
  json: (body: Record<string, unknown>) => MockResponse;
};

function createMockResponse(): MockResponse {
  return {
    statusCode: undefined,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: Record<string, unknown>) {
      this.payload = body;
      return this;
    },
  };
}

function createHost(response: MockResponse): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'GET', url: '/health/nlp' }),
    }),
  } as unknown as ArgumentsHost;
}

test('mapAppError returns status and human userMessage', () => {
  const error = new InfrastructureError(
    AppErrorCode.EXTERNAL_SERVICE,
    'Low-level upstream timeout details',
  );

  const mapped = mapAppError(error);

  assert.equal(mapped.status, HttpStatus.BAD_GATEWAY);
  assert.equal(mapped.code, AppErrorCode.EXTERNAL_SERVICE);
  assert.equal(mapped.userMessage, 'A dependent service is temporarily unavailable. Please try again soon.');
});

test('HttpExceptionFilter returns safe contract for AppError', () => {
  const filter = new HttpExceptionFilter();
  const response = createMockResponse();

  filter.catch(
    new InfrastructureError(AppErrorCode.EXTERNAL_SERVICE, 'axios ECONNRESET stack trace'),
    createHost(response),
  );

  assert.equal(response.statusCode, HttpStatus.BAD_GATEWAY);
  assert.equal(response.payload?.code, AppErrorCode.EXTERNAL_SERVICE);
  assert.equal(response.payload?.category, 'infrastructure');
  assert.equal(response.payload?.message, 'A dependent service is temporarily unavailable. Please try again soon.');
  assert.equal(response.payload?.method, 'GET');
  assert.equal(response.payload?.path, '/health/nlp');
});

test('HttpExceptionFilter sanitizes 500 HttpException messages', () => {
  const filter = new HttpExceptionFilter();
  const response = createMockResponse();

  filter.catch(
    new HttpException('SQL connection refused at db.internal:5432', HttpStatus.INTERNAL_SERVER_ERROR),
    createHost(response),
  );

  assert.equal(response.statusCode, HttpStatus.INTERNAL_SERVER_ERROR);
  assert.equal(response.payload?.message, 'Something went wrong on our side. Please try again.');
});

test('HttpExceptionFilter preserves client-safe 404 messages', () => {
  const filter = new HttpExceptionFilter();
  const response = createMockResponse();

  filter.catch(
    new HttpException('Trend not found', HttpStatus.NOT_FOUND),
    createHost(response),
  );

  assert.equal(response.statusCode, HttpStatus.NOT_FOUND);
  assert.equal(response.payload?.message, 'Trend not found');
});
