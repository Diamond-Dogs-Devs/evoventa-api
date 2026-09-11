import { IsString, IsNumber, IsPositive, IsInt } from 'class-validator';

export class InventoryItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsInt()
  @IsPositive()
  lowStock!: number;

  @IsInt()
  @IsPositive()
  criticalStock!: number;
}
