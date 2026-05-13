import { ProductStatus } from '@prisma/client';
import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusList } from '../enum/status.enum';

export class CreateProductDto {
  @IsString()
  barcode!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  name!: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(StatusList, { message: `Possible status values are ${StatusList}` })
  @IsString()
  status?: ProductStatus = ProductStatus.AVAILABLE;
}
