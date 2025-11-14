import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateChildDto {
  @ApiProperty({ example: 'Alice', description: 'Child name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 8, description: 'Child age' })
  @IsInt()
  age: number;

  @ApiProperty({
    example: 'beginner',
    description: 'Child level (e.g., beginner, intermediate, advanced)',
  })
  @IsString()
  level: string;

  @ApiPropertyOptional({
    example: '👧',
    description: 'Avatar emoji for the child',
  })
  @IsOptional()
  @IsString()
  avatarEmoji?: string;
}

export class UpdateChildDto {
  @ApiPropertyOptional({ example: 'Alice', description: 'Child name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 8, description: 'Child age' })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional({ example: 'intermediate', description: 'Child level' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({
    example: '👧',
    description: 'Avatar emoji for the child',
  })
  @IsOptional()
  @IsString()
  avatarEmoji?: string;
}
