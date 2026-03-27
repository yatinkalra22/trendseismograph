import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrendDto {
  @ApiProperty({ example: 'pickleball' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Pickleball' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'The fastest growing sport in America', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'sports', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isHistorical?: boolean;

  @IsString()
  @IsOptional()
  actualOutcome?: string;
}
