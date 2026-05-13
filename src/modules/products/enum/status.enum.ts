import { ProductStatus } from '@prisma/client';

export const StatusList = [
  ProductStatus.AVAILABLE,
  ProductStatus.OUT_OF_STOCK,
  ProductStatus.DISCONTINUED,
];
