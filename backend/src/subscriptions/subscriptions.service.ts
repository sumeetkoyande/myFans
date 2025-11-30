import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscription/subscription';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async subscribe(
    subscriberId: number,
    creatorId: number,
  ): Promise<Subscription> {
    const subscription = this.subscriptionsRepository.create({
      subscriber: { id: subscriberId },
      creator: { id: creatorId },
      startDate: new Date(),
    });
    return this.subscriptionsRepository.save(subscription);
  }
  async getSubscribedCreatorIds(userId: number): Promise<number[]> {
    const subs = await this.subscriptionsRepository.find({
      where: { subscriber: { id: userId } },
      relations: ['creator'],
    });
    return subs.map((sub) => sub.creator.id);
  }

  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { subscriber: { id: userId } },
      relations: ['creator'],
    });
  }

  async getCreatorSubscribers(creatorId: number): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { creator: { id: creatorId } },
      relations: ['subscriber'],
    });
  }

  async checkSubscription(
    subscriberId: number,
    creatorId: number,
  ): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: subscriberId },
        creator: { id: creatorId },
      },
    });
    return !!subscription;
  }

  async unsubscribe(
    subscriberId: number,
    creatorId: number,
  ): Promise<{ message: string }> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: subscriberId },
        creator: { id: creatorId },
      },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    await this.subscriptionsRepository.delete(subscription.id);
    return { message: 'Successfully unsubscribed' };
  }

  async getSubscriptionStatus(userId: number, creatorId: number): Promise<any> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: {
        subscriber: { id: userId },
        creator: { id: creatorId },
      },
      relations: ['creator'],
    });

    return {
      isSubscribed: !!subscription,
      subscriptionDate: subscription?.startDate || null,
      creatorId,
      nextBillingDate: subscription
        ? new Date(subscription.startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null, // 30 days from start
    };
  }

  async getSubscriptionAnalytics(creatorId: number): Promise<any> {
    const subscribers = await this.getCreatorSubscribers(creatorId);

    // Mock analytics data
    // In a real app, you'd calculate from actual subscription data
    return {
      totalSubscribers: subscribers.length,
      newSubscribersThisMonth: Math.floor(subscribers.length * 0.3), // Mock: 30% are new
      churnRate: 5.2, // Mock churn rate percentage
      monthlyGrowth: [
        { month: 'Jan', subscribers: Math.max(0, subscribers.length - 50) },
        { month: 'Feb', subscribers: Math.max(0, subscribers.length - 40) },
        { month: 'Mar', subscribers: Math.max(0, subscribers.length - 30) },
        { month: 'Apr', subscribers: Math.max(0, subscribers.length - 20) },
        { month: 'May', subscribers: subscribers.length },
      ],
      topSubscribers: subscribers.slice(0, 5).map((sub, index) => ({
        id: sub.subscriber.id,
        email: sub.subscriber.email || `subscriber${index + 1}@example.com`,
        subscriptionDate: sub.startDate,
        totalSpent: Math.floor(Math.random() * 500) + 50, // Mock spending
      })),
    };
  }
}
