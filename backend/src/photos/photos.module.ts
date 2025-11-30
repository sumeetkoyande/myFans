import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Photo } from './photo/photo';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo]), SubscriptionsModule],
  providers: [PhotosService],
  controllers: [PhotosController],
})
export class PhotosModule {}
