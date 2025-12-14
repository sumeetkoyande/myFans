import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeWebhookController } from './stripe.webhook.controller';

@Module({
  providers: [PaymentsService],
  controllers: [PaymentsController, StripeWebhookController],
  imports: [SubscriptionsModule],
})
export class PaymentsModule {}
