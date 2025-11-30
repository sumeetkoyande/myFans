import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-11-17.clover',
    });
  }

  async createCheckoutSession(
    amount: number,
    userEmail: string,
    creatorId: number,
    subscriberId: number,
  ) {
    if (amount < 1 || amount > 99999) {
      throw new BadRequestException('Invalid amount');
    }

    return await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Subscription to creator ${creatorId}`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: userEmail,
      success_url: this.configService.get<string>('PAYMENT_SUCCESS_URL'),
      cancel_url: this.configService.get<string>('PAYMENT_CANCEL_URL'),
      metadata: {
        creatorId: creatorId.toString(),
        subscriberId: subscriberId.toString(),
      },
    });
  }
}
