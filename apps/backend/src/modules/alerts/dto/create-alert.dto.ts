import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNumber, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
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
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: 'pickleball' })
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiProperty({ example: 'tipping_point', required: false, enum: DISCOURSE_STAGES })
  @IsIn(DISCOURSE_STAGES)
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  triggerStage?: string;

  @ApiProperty({ example: 7.5, required: false })
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  @Max(10)
  triggerScore?: number;
}
