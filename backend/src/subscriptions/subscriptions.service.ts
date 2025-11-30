import { Injectable } from '@nestjs/common';
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
}
