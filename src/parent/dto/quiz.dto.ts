import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QuestionDto } from './question.dto';

export class QuizDto {
  @ApiProperty({ example: 'Math Quiz 1', description: 'Quiz title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'math', description: 'Quiz type' })
  @IsString()
  type: string;

  @ApiProperty({ example: 0, description: 'Number of questions answered' })
  @IsInt()
  answered: number;

  @ApiPropertyOptional({ example: 0, description: 'Quiz score' })
  @IsOptional()
  @IsInt()
  score?: number;

  @ApiProperty({ type: [QuestionDto], description: 'Array of questions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

export class UpdateQuizDto {
  @ApiPropertyOptional({ example: 'Math Quiz 1', description: 'Quiz title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'math', description: 'Quiz type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of questions answered',
  })
  @IsOptional()
  @IsInt()
  answered?: number;

  @ApiPropertyOptional({ example: 85, description: 'Quiz score' })
  @IsOptional()
  @IsInt()
  score?: number;
}

export class GenerateQuizDto {
  @ApiProperty({ example: 'math', description: 'Subject of the quiz' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'beginner', description: 'Difficulty level' })
  @IsString()
  difficulty: string;

  @ApiProperty({ example: 10, description: 'Number of questions to generate' })
  @IsInt()
  nbrQuestions: number;

  @ApiPropertyOptional({
    example: 'fractions',
    description: 'Optional topic within the subject',
  })
  @IsOptional()
  @IsString()
  topic?: string;
}
