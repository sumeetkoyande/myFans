import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request as ExpressRequest } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UploadPhotoDto } from './dto/photo.dto';
import { PhotosService } from './photos.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
    email: string;
    isCreator: boolean;
  };
}

@Controller('photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhotosController {
  constructor(
    private photosService: PhotosService,
    private configService: ConfigService,
  ) {}

  @Post('upload')
  @Roles('creator')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(new BadRequestException('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: any,
    @Request() req: AuthenticatedRequest,
    @Body() uploadPhotoDto: UploadPhotoDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.photosService.createPhoto({
      url: file.path,
      description: uploadPhotoDto.description,
      creatorId: req.user.userId,
      isPremium: uploadPhotoDto.isPremium || false,
    });
  }

  @Get('list')
  async listPhotos(@Request() req: AuthenticatedRequest) {
    return this.photosService.getAccessiblePhotos(req.user.userId);
  }

  @Get(':id')
  async getPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const photo = await this.photosService.getPhotoById(id, req.user.userId);
    if (!photo) {
      throw new BadRequestException('Photo not found or access denied');
    }
    return photo;
  }
}
