import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateChildDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  level: string;

  @IsOptional()
  @IsString()
  avatarEmoji?: string;
}
