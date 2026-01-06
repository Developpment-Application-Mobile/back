import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsDateString, 
  IsNumber, 
  IsOptional,
  IsObject,
  IsBoolean,
  ValidateNested,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ActivityType {
  QUIZ = 'quiz',
  GAME = 'game',
  PUZZLE = 'puzzle',
}

export class QuizDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @IsOptional()
  questions?: any[];
}

export class PuzzleDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  isLocal: boolean;
}

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @IsString()
  @IsNotEmpty()
  kidId: string;

  @IsEnum(ActivityType)
  @IsNotEmpty()
  activityType: ActivityType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledTime: string;

  @IsNumber()
  @Min(60) // Minimum 1 minute
  duration: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizDataDto)
  quizData?: QuizDataDto;

  @IsOptional()
  @IsString()
  gameType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PuzzleDataDto)
  puzzleData?: PuzzleDataDto;
}