import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePaymentDto } from '../subscriptions/dto/subscription.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('subscribe')
  @Roles('user')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  async subscribe(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createCheckoutSession(
      createPaymentDto.amount,
      req.user.email,
      createPaymentDto.creatorId,
      req.user.userId,
    );
  }
}
