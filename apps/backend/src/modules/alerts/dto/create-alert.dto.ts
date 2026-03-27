import { IsString, IsOptional, IsNumber, IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const DISCOURSE_STAGES = [
  'discovery',
  'early_adoption',
  'tipping_point',
  'mainstream',
  'saturation',
] as const;

export class CreateAlertDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'pickleball' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'tipping_point', required: false, enum: DISCOURSE_STAGES })
  @IsIn(DISCOURSE_STAGES)
  @IsOptional()
  triggerStage?: string;

  @ApiProperty({ example: 7.5, required: false })
  @IsNumber()
  @IsOptional()
  triggerScore?: number;
}
