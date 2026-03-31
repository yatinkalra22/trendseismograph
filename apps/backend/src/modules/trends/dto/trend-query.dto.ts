import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const TREND_STAGES = ['discovery', 'early_adoption', 'tipping_point', 'mainstream', 'saturation'] as const;
const TREND_CATEGORIES = ['sports', 'food', 'tech', 'wellness', 'culture'] as const;

export class TrendQueryDto {
  @ApiProperty({ required: false, enum: TREND_STAGES })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsIn(TREND_STAGES)
  stage?: string;

  @ApiProperty({ required: false, enum: TREND_CATEGORIES })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsIn(TREND_CATEGORIES)
  category?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
