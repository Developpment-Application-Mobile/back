import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class QuestionDto {
  @ApiProperty({ example: 'What is 2 + 2?', description: 'The question text' })
  @IsString()
  questionText: string;

  @ApiProperty({
    example: ['2', '3', '4', '5'],
    description: 'Array of answer options',
  })
  @IsArray()
  options: string[];

  @ApiProperty({
    example: 2,
    description: 'Index of the correct answer in the options array',
  })
  @IsInt()
  correctAnswerIndex: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Index of the user\'s selected answer',
  })
  @IsOptional()
  @IsInt()
  userAnswerIndex?: number;

  @ApiPropertyOptional({
    example: '2 + 2 equals 4',
    description: 'Explanation for the correct answer',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.png',
    description: 'URL to an image for the question',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'math', description: 'Question type' })
  @IsString()
  type: string;

  @ApiProperty({
    example: 'beginner',
    description: 'Question difficulty level',
  })
  @IsString()
  level: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    example: 'What is 2 + 2?',
    description: 'The question text',
  })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({
    example: ['2', '3', '4', '5'],
    description: 'Array of answer options',
  })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({
    example: 2,
    description: 'Index of the correct answer',
  })
  @IsOptional()
  @IsInt()
  correctAnswerIndex?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Index of the user\'s selected answer',
  })
  @IsOptional()
  @IsInt()
  userAnswerIndex?: number;

  @ApiPropertyOptional({
    example: '2 + 2 equals 4',
    description: 'Explanation for the correct answer',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.png',
    description: 'URL to an image for the question',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'math', description: 'Question type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 'beginner',
    description: 'Question difficulty level',
  })
  @IsOptional()
  @IsString()
  level?: string;
}
