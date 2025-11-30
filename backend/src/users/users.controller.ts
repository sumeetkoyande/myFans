import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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

  @Put('profile')
  @Roles('user', 'creator')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateProfile(@Request() req: any, @Body() updateData: any) {
    return this.usersService.updateProfile(req.user.userId, updateData);
  }

  @Put('password')
  @Roles('user', 'creator')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async changePassword(
    @Request() req: any,
    @Body() passwordData: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.userId,
      passwordData.currentPassword,
      passwordData.newPassword,
    );
  }

  @Put('become-creator')
  @Roles('user')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async becomeCreator(
    @Request() req: any,
    @Body() creatorData: { subscriptionPrice: number },
  ) {
    return this.usersService.becomeCreator(
      req.user.userId,
      creatorData.subscriptionPrice,
    );
  }

  @Get('creator/:id')
  @Roles('user', 'creator')
  async getCreatorProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getCreatorProfile(id);
  }
}
