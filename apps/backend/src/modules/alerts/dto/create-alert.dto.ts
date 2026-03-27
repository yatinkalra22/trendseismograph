import { IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'pickleball' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'tipping_point', required: false })
  @IsString()
  @IsOptional()
  triggerStage?: string;

  @ApiProperty({ example: 7.5, required: false })
  @IsNumber()
  @IsOptional()
  triggerScore?: number;
}
