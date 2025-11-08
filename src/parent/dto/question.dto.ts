import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class QuestionDto {
  @IsString()
  questionText: string;

  @IsArray()
  options: string[];

  @IsInt()
  correctAnswerIndex: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  type: string;

  @IsString()
  level: string;
}
