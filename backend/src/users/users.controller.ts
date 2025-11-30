import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Get('profile')
  @Roles('user', 'creator')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('creator-area')
  @Roles('creator')
  creatorArea(@Request() req) {
    return { message: 'Welcome, creator!', user: req.user };
  }

  @Get('user-area')
  @Roles('user')
  userArea(@Request() req) {
    return { message: 'Welcome, user!', user: req.user };
  }
}
