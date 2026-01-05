import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';

export class GeneratePuzzleDto {
  @ApiProperty({ required: false, enum: ['image', 'word', 'number', 'sequence', 'pattern'] })
  @IsOptional()
  @IsEnum(['image', 'word', 'number', 'sequence', 'pattern'])
  type?: string;

  @ApiProperty({ required: false, enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  gridSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topic?: string;
}

export class SubmitPuzzleDto {
  @ApiProperty({ description: 'Array of piece positions (indices)' })
  @IsArray()
  @IsNumber({}, { each: true })
  positions: number[];

  @ApiProperty({ description: 'Time spent in seconds' })
  @IsNumber()
  timeSpent: number;
}