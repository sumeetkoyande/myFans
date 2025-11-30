import {
  BadRequestException,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('payments')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-11-17.clover',
    });
  }

  @Post('webhook')
  @HttpCode(200)
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is required');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.body as string,
        sig as string,
        webhookSecret,
      );
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(
        `Webhook signature verification failed: ${errorMessage}`,
      );
      throw new BadRequestException(`Webhook Error: ${errorMessage}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          await this.handleSuccessfulPayment(session);
          break;
        }
        default:
          this.logger.warn(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing webhook: ${errorMessage}`);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }

    res.json({ received: true });
  }

  private async handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (metadata && metadata.creatorId && metadata.subscriberId) {
      await this.subscriptionsService.subscribe(
        parseInt(metadata.subscriberId),
        parseInt(metadata.creatorId),
      );
      this.logger.log(
        `Subscription created: user ${metadata.subscriberId} -> creator ${metadata.creatorId}`,
      );
    }
  }
}
