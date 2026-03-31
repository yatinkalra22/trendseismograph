import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import securityConfig from '../../config/security.config';
import { AppErrorCode, DomainError } from '../../common/errors/app-error';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(securityConfig.KEY)
    private readonly securityCfg: ConfigType<typeof securityConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new DomainError(AppErrorCode.UNAUTHORIZED, 'API key required');
    }
    const key = authHeader.split(' ')[1];
    const secret = this.securityCfg.apiKeySecret;
    if (!secret || !this.safeCompare(key, secret)) {
      throw new DomainError(AppErrorCode.UNAUTHORIZED, 'Invalid API key');
    }
    return true;
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
