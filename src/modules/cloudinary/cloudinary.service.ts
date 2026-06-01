import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { envs } from '../../config';
import { CloudinaryType } from './enum/cloudinary.enum';

@Injectable()
export class CloudinaryService {
  generateSignature(type: CloudinaryType) {
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: type },
      envs.cloudinaryApiSecret,
    );

    return {
      timestamp,
      signature,
      folder: type,
      apiKey: envs.cloudinaryApiKey,
      cloudName: envs.cloudinaryCloudName,
    };
  }

  async deleteImage(publicId: string) {
    if (!publicId) return;
    return cloudinary.uploader.destroy(publicId);
  }
}
