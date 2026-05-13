import { IsUUID, IsEnum } from 'class-validator';
import { OrderType } from '@prisma/client';

export class ChangeOrderTypeDto {
  @IsUUID()
  id!: string;

  @IsEnum(OrderType)
  type!: OrderType;
}
