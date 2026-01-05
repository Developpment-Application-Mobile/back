import { Body, Controller, Post , Headers, UnauthorizedException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService, // Add this
  ) {}
  
  @Post('signup')
  @ApiOperation({ summary: 'Register a new parent account' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Parent successfully registered and logged in',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already registered' })
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
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    const parent = await this.authService.validateParent(
      body.email,
      body.password,
    );
    return this.authService.login(parent);
  }

  @Post('forgot-password')
  async forgot(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async reset(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

 @Post('change-password')
@ApiOperation({ summary: 'Change password for authenticated user' })
@ApiBody({
  schema: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', minLength: 6 },
      newPassword: { type: 'string', minLength: 6 },
    },
  },
})
@ApiResponse({
  status: 200,
  description: 'Password changed successfully',
})
@ApiUnauthorizedResponse({ description: 'Current password is incorrect' })
async changePassword(
  @Body() body: { currentPassword: string; newPassword: string },
  @Headers('authorization') authHeader: string,
) {
  // Extract token from header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('No token provided');
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode the JWT token to get parent ID
    const decoded = this.jwtService.verify(token);
    const parentId = decoded.sub;

    return this.authService.changePassword(
      parentId,
      body.currentPassword,
      body.newPassword,
    );
  } catch (error) {
    throw new UnauthorizedException('Invalid token');
  }
}
}