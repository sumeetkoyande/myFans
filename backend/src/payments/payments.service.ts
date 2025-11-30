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

  async getPaymentHistory(
    userId: number,
    filters: { status?: string; type?: string },
  ): Promise<any[]> {
    // Mock payment history data
    // In a real app, you'd query from a payments database table
    const mockPayments = [
      {
        id: 1,
        amount: 19.99,
        status: 'completed',
        type: 'subscription',
        description: 'Monthly subscription to @creator1',
        date: new Date(Date.now() - 86400000), // 1 day ago
        creatorName: 'Creator One',
        paymentMethod: 'Credit Card ending in 1234',
      },
      {
        id: 2,
        amount: 9.99,
        status: 'completed',
        type: 'tip',
        description: 'Tip for awesome content',
        date: new Date(Date.now() - 172800000), // 2 days ago
        creatorName: 'Creator Two',
        paymentMethod: 'Credit Card ending in 5678',
      },
      {
        id: 3,
        amount: 15.0,
        status: 'refunded',
        type: 'subscription',
        description: 'Monthly subscription to @creator3',
        date: new Date(Date.now() - 259200000), // 3 days ago
        creatorName: 'Creator Three',
        paymentMethod: 'Credit Card ending in 9876',
      },
    ];

    let filteredPayments = mockPayments;

    if (filters.status) {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.status === filters.status,
      );
    }

    if (filters.type) {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.type === filters.type,
      );
    }

    return filteredPayments;
  }

  async requestRefund(
    paymentId: number,
    userId: number,
    reason: string,
  ): Promise<{ message: string }> {
    // Mock refund request
    // In a real app, you'd validate the payment belongs to the user and process the refund
    return {
      message: `Refund request submitted for payment ${paymentId}. Reason: ${reason}`,
    };
  }

  async getCreatorEarnings(creatorId: number): Promise<any> {
    // Mock earnings data
    // In a real app, you'd query from payments and subscriptions tables
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      totalEarnings: 2847.5,
      thisMonthEarnings: 485.25,
      availableForPayout: 1230.75,
      subscriberCount: 127,
      monthlyEarnings: [
        { month: 'Jan', earnings: 320.5 },
        { month: 'Feb', earnings: 285.25 },
        { month: 'Mar', earnings: 410.75 },
        { month: 'Apr', earnings: 525.0 },
        { month: 'May', earnings: 485.25 },
      ],
      recentTransactions: [
        {
          id: 101,
          amount: 19.99,
          type: 'subscription',
          subscriberEmail: 'user1@example.com',
          date: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          id: 102,
          amount: 9.99,
          type: 'tip',
          subscriberEmail: 'user2@example.com',
          date: new Date(Date.now() - 7200000), // 2 hours ago
        },
      ],
    };
  }

  async requestPayout(
    creatorId: number,
    amount: number,
  ): Promise<{ message: string }> {
    // Mock payout request
    // In a real app, you'd validate available balance and process payout
    if (amount < 10) {
      throw new BadRequestException('Minimum payout amount is $10');
    }

    return {
      message: `Payout request of $${amount} submitted successfully. Processing time: 2-5 business days.`,
    };
  }
}
