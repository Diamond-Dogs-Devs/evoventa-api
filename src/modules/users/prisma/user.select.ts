import { Prisma } from '@prisma/client';

export const userSelect: Prisma.UserSelect = {
  id: true,
  name: true,
  email: true,
  employeeNumber: true,
  telephone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};
