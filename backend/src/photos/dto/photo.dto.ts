import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UploadPhotoDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
