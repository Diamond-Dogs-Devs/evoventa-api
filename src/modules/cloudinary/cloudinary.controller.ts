import { Controller, Get, Delete, Query } from '@nestjs/common';

import { CloudinaryService } from './cloudinary.service';
import { GenerateSignatureDto } from './dto/generate-signature.dto';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Get('signature')
  getSignature(@Query() generateSignatureDto: GenerateSignatureDto) {
    return this.cloudinaryService.generateSignature(generateSignatureDto.type);
  }

  @Delete()
  delete(@Query('publicId') publicId: string) {
    return this.cloudinaryService.deleteImage(publicId);
  }
}
