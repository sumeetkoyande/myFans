import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { User } from '../users/user/user';
import { Comment } from './comment/comment';
import { Like } from './like/like';
import { Photo } from './photo/photo';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private photosRepository: Repository<Photo>,
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
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

  async getCreatorPhotos(creatorId: number, viewerId: number): Promise<any> {
    const isOwner = creatorId === viewerId;
    const subscribedCreatorIds =
      await this.subscriptionsService.getSubscribedCreatorIds(viewerId);
    const isSubscribed = !isOwner && subscribedCreatorIds.includes(creatorId);

    const allPhotos = await this.photosRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.creator', 'creator')
      .where('photo.creator.id = :creatorId', { creatorId })
      .orderBy('photo.createdAt', 'DESC')
      .getMany();

    const publicPhotos = allPhotos.filter((photo) => !photo.isPremium);
    const premiumPhotos = allPhotos.filter((photo) => photo.isPremium);

    if (isOwner || isSubscribed) {
      // Return all photos for owner or subscribers
      return {
        hasAccess: true,
        photos: allPhotos,
        publicPhotos,
        premiumPhotos,
        totalCount: allPhotos.length,
        premiumCount: premiumPhotos.length,
      };
    } else {
      // Return limited info for non-subscribers
      return {
        hasAccess: false,
        photos: publicPhotos.slice(0, 3), // Only show 3 preview photos
        publicPhotos: publicPhotos.slice(0, 3),
        premiumPhotos: [], // No premium photos
        totalCount: allPhotos.length,
        premiumCount: premiumPhotos.length,
        previewCount: Math.min(3, publicPhotos.length),
      };
    }
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

  async likePhoto(
    photoId: number,
    userId: number,
  ): Promise<{ message: string; isLiked: boolean }> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
    });
    if (!photo) {
      throw new BadRequestException('Photo not found');
    }

    const existingLike = await this.likesRepository.findOne({
      where: { photo: { id: photoId }, user: { id: userId } },
    });

    if (existingLike) {
      throw new BadRequestException('Photo already liked');
    }

    const like = this.likesRepository.create({
      photo: { id: photoId } as Photo,
      user: { id: userId } as User,
    });

    await this.likesRepository.save(like);
    return { message: 'Photo liked successfully', isLiked: true };
  }

  async unlikePhoto(
    photoId: number,
    userId: number,
  ): Promise<{ message: string; isLiked: boolean }> {
    const like = await this.likesRepository.findOne({
      where: { photo: { id: photoId }, user: { id: userId } },
    });

    if (!like) {
      throw new BadRequestException('Like not found');
    }

    await this.likesRepository.delete(like.id);
    return { message: 'Photo unliked successfully', isLiked: false };
  }

  async getPhotoLikes(photoId: number): Promise<any> {
    const likes = await this.likesRepository.find({
      where: { photo: { id: photoId } },
      relations: ['user'],
      select: {
        id: true,
        createdAt: true,
        user: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
    });

    return {
      count: likes.length,
      likes: likes.map((like) => ({
        id: like.id,
        user: {
          id: like.user.id,
          name: like.user.name || like.user.email.split('@')[0],
          email: like.user.email,
          avatar: like.user.avatar,
        },
        createdAt: like.createdAt,
      })),
    };
  }

  async commentOnPhoto(
    photoId: number,
    userId: number,
    content: string,
  ): Promise<Comment> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
    });
    if (!photo) {
      throw new BadRequestException('Photo not found');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const comment = this.commentsRepository.create({
      content: content.trim(),
      photo: { id: photoId } as Photo,
      user: { id: userId } as User,
    });

    return this.commentsRepository.save(comment);
  }

  async getPhotoComments(photoId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { photo: { id: photoId } },
      relations: ['user'],
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteComment(
    commentId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'photo', 'photo.creator'],
    });

    if (!comment) {
      throw new BadRequestException('Comment not found');
    }

    // Allow deletion if user owns the comment or owns the photo
    if (comment.user.id !== userId && comment.photo.creator.id !== userId) {
      throw new BadRequestException(
        'You can only delete your own comments or comments on your photos',
      );
    }

    await this.commentsRepository.delete(commentId);
    return { message: 'Comment deleted successfully' };
  }
}
