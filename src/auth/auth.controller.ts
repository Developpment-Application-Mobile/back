import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class SignupDto {
  name: string;
  email: string;
  password: string;
}

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const parent = await this.authService.validateParent(body.email, body.password);
    return this.authService.login(parent);
  }
}
