import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Comment } from './comment/comment';
import { Like } from './like/like';
import { Photo } from './photo/photo';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Photo, Like, Comment]),
    SubscriptionsModule,
  ],
  providers: [PhotosService],
  controllers: [PhotosController],
})
export class PhotosModule {}
