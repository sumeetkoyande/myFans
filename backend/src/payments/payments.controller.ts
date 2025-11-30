import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
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
  async subscribe(
    @Request() req: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createCheckoutSession(
      createPaymentDto.amount,
      req.user.email,
      createPaymentDto.creatorId,
      req.user.userId,
    );
  }

  @Get('history')
  @Roles('user', 'creator')
  async getPaymentHistory(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.paymentsService.getPaymentHistory(req.user.userId, {
      status,
      type,
    });
  }

  @Post('refund/:paymentId')
  @Roles('user', 'creator')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  async requestRefund(
    @Request() req: any,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() refundData: { reason: string },
  ) {
    return this.paymentsService.requestRefund(
      paymentId,
      req.user.userId,
      refundData.reason,
    );
  }

  @Get('creator/earnings')
  @Roles('creator')
  async getCreatorEarnings(@Request() req: any) {
    return this.paymentsService.getCreatorEarnings(req.user.userId);
  }

  @Post('creator/payout')
  @Roles('creator')
  @Throttle({ default: { limit: 2, ttl: 86400000 } }) // 2 payout requests per day
  async requestPayout(
    @Request() req: any,
    @Body() payoutData: { amount: number },
  ) {
    return this.paymentsService.requestPayout(
      req.user.userId,
      payoutData.amount,
    );
  }
}
