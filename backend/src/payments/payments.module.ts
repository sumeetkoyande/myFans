import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeWebhookController } from './stripe.webhook.controller';

@Module({
  providers: [PaymentsService],
  controllers: [PaymentsController, StripeWebhookController],
})
export class PaymentsModule {}
