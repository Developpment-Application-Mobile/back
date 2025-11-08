import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { QuestionDto } from './question.dto';

export class QuizDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsInt()
  answered: number;

  @IsInt()
  score?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
