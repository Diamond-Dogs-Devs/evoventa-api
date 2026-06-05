import {
  ArrayMinSize,
  IsArray,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryItemDto } from './inventory-item.dto';

export class CreateInventoryDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  items!: InventoryItemDto[];
}
