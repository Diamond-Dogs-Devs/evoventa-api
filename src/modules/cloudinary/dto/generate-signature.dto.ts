import { IsEnum } from 'class-validator';
import { CloudinaryType, CloudinaryTypeList } from '../enum/cloudinary.enum';

export class GenerateSignatureDto {
  @IsEnum(CloudinaryType, {
    message: `Valid types are ${CloudinaryTypeList}`,
  })
  type!: CloudinaryType;
}
