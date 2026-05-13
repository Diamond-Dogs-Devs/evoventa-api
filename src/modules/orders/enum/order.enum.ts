import { OrderStatus, OrderType } from '@prisma/client';

export const OrderStatusList = [
  OrderStatus.CANCELLED,
  OrderStatus.DELIVERED,
  OrderStatus.PENDING,
];

export const OrderTypeList = [OrderType.ORDER, OrderType.QUOTATION];
