import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('API key required');
    }
    const key = authHeader.split(' ')[1];
    if (key !== process.env.API_KEY_SECRET) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
