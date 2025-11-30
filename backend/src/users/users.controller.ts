import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('profile')
  @Roles('user', 'creator')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('creators')
  @Roles('user', 'creator')
  async getCreators() {
    return this.usersService.getCreators();
  }

  @Get('creator-area')
  @Roles('creator')
  creatorArea(@Request() req: any) {
    return { message: 'Welcome, creator!', user: req.user };
  }

  @Get('user-area')
  @Roles('user')
  userArea(@Request() req: any) {
    return { message: 'Welcome, user!', user: req.user };
  }
}
