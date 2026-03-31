import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const TREND_CATEGORIES = ['sports', 'food', 'tech', 'wellness', 'culture'] as const;
const HISTORICAL_OUTCOMES = ['mainstream', 'fizzled', 'pending'] as const;

export class CreateTrendDto {
  @ApiProperty({ example: 'pickleball' })
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiProperty({ example: 'Pickleball' })
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @Length(2, 120)
  name: string;

  @ApiProperty({ example: 'The fastest growing sport in America', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim())
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'sports', required: false, enum: TREND_CATEGORIES })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsIn(TREND_CATEGORIES)
  category?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isHistorical?: boolean;

  @ApiProperty({ example: 'pending', required: false, enum: HISTORICAL_OUTCOMES })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @IsIn(HISTORICAL_OUTCOMES)
  actualOutcome?: string;
}
