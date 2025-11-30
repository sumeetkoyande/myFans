import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { User } from '../users/user/user';
import { Photo } from './photo/photo';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private photosRepository: Repository<Photo>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createPhoto(
    data: Omit<Partial<Photo>, 'creator'> & { creatorId: number },
  ): Promise<Photo> {
    const photo = this.photosRepository.create({
      url: data.url,
      description: data.description,
      isPremium: data.isPremium,
      creator: { id: data.creatorId } as User,
    });
    return this.photosRepository.save(photo);
  }

  async getAccessiblePhotos(userId: number): Promise<Photo[]> {
    // Get all public photos
    const publicPhotos = await this.photosRepository.find({
      where: { isPremium: false },
    });

    // Get premium photos uploaded by this user (if creator)
    const ownPremiumPhotos = await this.photosRepository.find({
      where: { creator: { id: userId }, isPremium: true },
    });

    // Get premium photos from creators the user is subscribed to
    const creatorIds =
      await this.subscriptionsService.getSubscribedCreatorIds(userId);
    let subscribedPremiumPhotos: Photo[] = [];
    if (creatorIds.length > 0) {
      subscribedPremiumPhotos = await this.photosRepository
        .createQueryBuilder('photo')
        .where('photo.isPremium = :isPremium', { isPremium: true })
        .andWhere('photo.creator IN (:...creatorIds)', { creatorIds })
        .getMany();
    }

    // Merge all accessible photos
    return [...publicPhotos, ...ownPremiumPhotos, ...subscribedPremiumPhotos];
  }

  async getPhotoById(photoId: number, userId: number): Promise<Photo | null> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
      relations: ['creator'],
    });

    if (!photo) {
      return null;
    }

    // Check if user has access to this photo
    if (!photo.isPremium) {
      return photo; // Public photo, accessible to all
    }

    // Premium photo - check if user is the creator or subscribed
    if (photo.creator.id === userId) {
      return photo; // User is the creator
    }

    // Check if user is subscribed to the creator
    const creatorIds =
      await this.subscriptionsService.getSubscribedCreatorIds(userId);
    if (creatorIds.includes(photo.creator.id)) {
      return photo; // User is subscribed
    }

    return null; // No access
  }

  async getCreatorPhotos(
    creatorId: number,
    viewerId: number,
  ): Promise<Photo[]> {
    const isOwner = creatorId === viewerId;
    const isSubscribed =
      !isOwner &&
      (
        await this.subscriptionsService.getSubscribedCreatorIds(viewerId)
      ).includes(creatorId);

    const queryBuilder = this.photosRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.creator', 'creator')
      .where('photo.creator.id = :creatorId', { creatorId });

    if (!isOwner && !isSubscribed) {
      // Only show public photos for non-subscribers
      queryBuilder.andWhere('photo.isPremium = :isPremium', {
        isPremium: false,
      });
    }

    return queryBuilder.orderBy('photo.createdAt', 'DESC').getMany();
  }

  async updatePhoto(
    photoId: number,
    userId: number,
    updateData: { description?: string; isPremium?: boolean },
  ): Promise<Photo> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
      relations: ['creator'],
    });

    if (!photo) {
      throw new BadRequestException('Photo not found');
    }

    if (photo.creator.id !== userId) {
      throw new BadRequestException('You can only update your own photos');
    }

    await this.photosRepository.update(photoId, updateData);
    return this.photosRepository.findOne({
      where: { id: photoId },
      relations: ['creator'],
    });
  }

  async deletePhoto(
    photoId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
      relations: ['creator'],
    });

    if (!photo) {
      throw new BadRequestException('Photo not found');
    }

    if (photo.creator.id !== userId) {
      throw new BadRequestException('You can only delete your own photos');
    }

    await this.photosRepository.delete(photoId);
    return { message: 'Photo deleted successfully' };
  }
}
