import { OrderStatus, OrderType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common';
import { OrderStatusList, OrderTypeList } from '../enum/order.enum';

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList}`,
  })
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderTypeList, {
    message: `Valid types are ${OrderTypeList}`,
  })
  type?: OrderType;
}
