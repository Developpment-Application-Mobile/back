import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'John Doe', description: 'Parent full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Parent email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Parent password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Parent email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Parent password' })
  @IsString()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'Parent object (without password)' })
  parent: any;
}

