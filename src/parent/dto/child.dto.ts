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

  @ApiPropertyOptional({ example: '675abc123def4567890fedcb', description: 'Parent ID (filled automatically from route, optional in request)' })
  @IsOptional()
  @IsString()
  parentId?: string;
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

  @ApiPropertyOptional({ example: '675abc123def4567890fedcb', description: 'Parent ID reference (rarely updated)' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ChildResponseDto {
  @ApiProperty({ example: '675abc123def4567890fedcb', description: 'Parent ID owning this child' })
  parentId: string;

  @ApiProperty({ example: 'abc123childid', description: 'Child unique ID' })
  _id: string;

  @ApiProperty({ example: 'Alice', description: 'Child name' })
  name: string;

  @ApiProperty({ example: 8, description: 'Child age' })
  age: number;

  @ApiProperty({ example: 'beginner', description: 'Child level' })
  level: string;

  @ApiPropertyOptional({ example: '👧', description: 'Avatar emoji' })
  avatarEmoji?: string;

  @ApiProperty({ example: 0, description: 'Accumulated score' })
  Score: number;
}
