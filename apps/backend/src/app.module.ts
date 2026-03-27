import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: true,
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
    }),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    BullModule.forRoot({
      redis: {
        host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
        port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
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
