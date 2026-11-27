import { OrderStatus } from '@prisma/client';

import { OrderStatusList } from './order.enum';

describe('OrderStatusList', () => {
  it('exposes every status declared in prisma/schema.prisma', () => {
    expect([...OrderStatusList].sort()).toEqual(
      Object.values(OrderStatus).sort(),
    );
  });

  it('accepts PAID, the state the finance reader filters on', () => {
    expect(OrderStatusList).toContain(OrderStatus.PAID);
  });
});
