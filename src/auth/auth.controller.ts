import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new parent account' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Parent successfully registered and logged in',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request - invalid input data' })
  @ApiConflictResponse({ description: 'Conflict - email already registered' })
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid credentials',
  })
  @ApiBadRequestResponse({ description: 'Bad request - invalid input data' })
  async login(@Body() body: LoginDto) {
    const parent = await this.authService.validateParent(
      body.email,
      body.password,
    );
    return this.authService.login(parent);
  }

  @Post('forgot-password')
  forgot(@Body('email') email: string) {
  return this.authService.forgotPassword(email);
}

@Post('reset-password')
reset(@Body() body: { token: string; newPassword: string }) {
  return this.authService.resetPassword(body.token, body.newPassword);
}}