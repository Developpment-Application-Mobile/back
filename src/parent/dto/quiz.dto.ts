import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

  @ApiProperty({ example: false, description: 'Is answered' })
  @IsBoolean()
  isAnswered: boolean;

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

export class SubmitQuizAnswersDto {
  @ApiProperty({
    example: [0, 2, 1, 3],
    description: 'Array of user answer indices corresponding to each question'
  })
  @IsArray()
  @IsInt({ each: true })
  answers: number[];
}

export class GenerateQuizDto {
  @ApiPropertyOptional({ example: 'math', description: 'Subject of the quiz (leave empty for retry mode)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'beginner', description: 'Difficulty level (leave empty for retry mode)' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 10, description: 'Number of questions to generate (leave empty for retry mode)' })
  @IsOptional()
  @IsInt()
  nbrQuestions?: number;

  @ApiPropertyOptional({
    example: 'fractions',
    description: 'Optional topic within the subject',
  })
  @IsOptional()
  @IsString()
  topic?: string;
}
