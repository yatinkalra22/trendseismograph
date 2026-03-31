import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TrendsModule } from './modules/trends/trends.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { BacktestModule } from './modules/backtest/backtest.module';
import { QueuesModule } from './queues/queues.module';
import { HealthController } from './health.controller';
import { validateEnv } from './config/env.validation';
import appConfig from './config/app.config';
import securityConfig from './config/security.config';
import ingestionConfig from './modules/ingestion/ingestion.config';
import alertsConfig from './modules/alerts/alerts.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, securityConfig, ingestionConfig, alertsConfig],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      }),
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single' as const,
        url: config.getOrThrow<string>('REDIS_URL'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.getOrThrow<string>('REDIS_URL');
        const parsed = new URL(redisUrl);
        return {
          redis: {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
          },
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TrendsModule,
    ScoringModule,
    IngestionModule,
    AlertsModule,
    BacktestModule,
    QueuesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
