import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateParentDto {
  @ApiProperty({ example: 'John Doe', description: 'Parent full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Parent email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Parent password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateParentDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Parent full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Parent email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'password123', description: 'Parent password', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

