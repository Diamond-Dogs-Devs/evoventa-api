import { v2 as cloudinary } from 'cloudinary';

import { envs } from '../../config';

export const cloudinaryConfig = cloudinary.config({
  cloud_name: envs.cloudinaryCloudName,
  api_key: envs.cloudinaryApiKey,
  api_secret: envs.cloudinaryApiSecret,
});
