import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsArray } from 'class-validator';

export class GeneratePuzzleDto {
  @ApiPropertyOptional({ enum: ['image', 'word', 'number', 'sequence', 'pattern'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gridSize?: number;
}

export class SubmitPuzzleDto {
  @ApiProperty({ type: [Number], description: 'Array of piece positions' })
  @IsArray()
  positions: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}

export class UpdatePuzzleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  positions?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}