import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SubscribeDto } from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

interface AuthenticatedRequest {
  user: {
    userId: number;
    email: string;
    isCreator: boolean;
  };
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post('subscribe')
  @Roles('user')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 subscriptions per minute
  async subscribe(
    @Request() req: AuthenticatedRequest,
    @Body() subscribeDto: SubscribeDto,
  ) {
    if (req.user.userId === subscribeDto.creatorId) {
      throw new BadRequestException('Cannot subscribe to yourself');
    }
    return this.subscriptionsService.subscribe(
      req.user.userId,
      subscribeDto.creatorId,
    );
  }

  @Get('my-subscriptions')
  @Roles('user')
  async getMySubscriptions(@Request() req: AuthenticatedRequest) {
    return await this.subscriptionsService.getUserSubscriptions(
      req.user.userId,
    );
  }

  @Get('my-subscribers')
  @Roles('creator')
  async getMySubscribers(@Request() req: AuthenticatedRequest) {
    return await this.subscriptionsService.getCreatorSubscribers(
      req.user.userId,
    );
  }
}
