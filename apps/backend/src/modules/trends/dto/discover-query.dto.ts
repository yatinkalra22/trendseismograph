import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DiscoverQueryDto {
  @ApiProperty({ required: false, minLength: 2, maxLength: 80, example: 'pickleball' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @Length(2, 80)
  q?: string;
}