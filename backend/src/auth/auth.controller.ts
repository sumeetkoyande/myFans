import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; isCreator?: boolean },
  ) {
    const user = await this.usersService.createUser(
      body.email,
      body.password,
      body.isCreator,
    );
    return this.authService.login(user);
  }
}
