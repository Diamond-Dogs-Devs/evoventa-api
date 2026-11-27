import { OrderStatus, OrderType } from '@prisma/client';

// Derived from the schema enum: a hardcoded list silently drops any status added
// to `prisma/schema.prisma` later, and `PAID` was the one already missing, which
// left order status without a writer while `finance.service.ts` reads it.
export const OrderStatusList = Object.values(OrderStatus);

export const OrderTypeList = [OrderType.ORDER, OrderType.QUOTATION];
