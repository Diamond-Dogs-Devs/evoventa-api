import { IsString, IsNumber, IsPositive } from 'class-validator';

export class InventoryItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
