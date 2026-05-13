import { IsOptional, IsEnum } from 'class-validator';
import { OrderType } from '@prisma/client';
import { OrderTypeList } from '../enum/order.enum';

export class TypeDto {
  @IsOptional()
  @IsEnum(OrderTypeList, {
    message: `Valid types are ${OrderTypeList}`,
  })
  type!: OrderType;
}
