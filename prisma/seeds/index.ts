import {
  PrismaClient,
  OrderStatus,
  OrderType,
  ProductStatus,
  Role,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const user = await prisma.user.upsert({
    where: {
      email: 'admin@test.com',
    },
    update: {},
    create: {
      employeeNumber: 'EMP-001',
      email: 'admin@test.com',
      name: 'Admin Test',
      telephone: '5512345678',
      password: 'password',
      role: Role.ADMIN,
    },
  });

  // =========================
  // CLIENTS
  // =========================

  const client1 = await prisma.client.upsert({
    where: {
      email: 'cliente1@test.com',
    },
    update: {},
    create: {
      email: 'cliente1@test.com',
      name: 'Cliente Uno',
      telephone: '5511111111',
      address: 'Dirección 1',
      rfc: 'XAXX010101000',
    },
  });

  const client2 = await prisma.client.upsert({
    where: {
      email: 'cliente2@test.com',
    },
    update: {},
    create: {
      email: 'cliente2@test.com',
      name: 'Cliente Dos',
      telephone: '5522222222',
      address: 'Dirección 2',
      rfc: 'XEXX010101000',
    },
  });

  // =========================
  // PRODUCTS
  // =========================

  const product1 = await prisma.product.upsert({
    where: {
      barcode: '750000000001',
    },
    update: {},
    create: {
      barcode: '750000000001',
      sku: 'SKU-001',
      name: 'Producto A',
      brand: 'Marca A',
      category: 'General',
      purchasePrice: 50,
      salePrice: 100,
      status: ProductStatus.AVAILABLE,
    },
  });

  const product2 = await prisma.product.upsert({
    where: {
      barcode: '750000000002',
    },
    update: {},
    create: {
      barcode: '750000000002',
      sku: 'SKU-002',
      name: 'Producto B',
      brand: 'Marca B',
      category: 'General',
      purchasePrice: 80,
      salePrice: 150,
      status: ProductStatus.AVAILABLE,
    },
  });
  const now = new Date();
  const todayOrder = await prisma.order.create({
    data: {
      orderNumber: 'TEST-001',
      totalAmount: 250,
      totalItems: 2,
      type: OrderType.ORDER,
      status: OrderStatus.PAID,
      clientId: client1.id,
      userId: user.id,

      OrderItem: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            price: 100,
          },
          {
            productId: product2.id,
            quantity: 1,
            price: 150,
          },
        ],
      },
    },
  });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.order.create({
    data: {
      orderNumber: 'TEST-002',
      totalAmount: 300,
      totalItems: 3,
      type: OrderType.ORDER,
      status: OrderStatus.PAID,
      clientId: client1.id,
      userId: user.id,

      createdAt: yesterday,
      updatedAt: yesterday,

      OrderItem: {
        create: [
          {
            productId: product2.id,
            quantity: 2,
            price: 150,
          },
        ],
      },
    },
  });
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await prisma.order.create({
    data: {
      orderNumber: 'TEST-003',
      totalAmount: 500,
      totalItems: 5,
      type: OrderType.ORDER,
      status: OrderStatus.PAID,
      clientId: client2.id,
      userId: user.id,

      createdAt: lastWeek,
      updatedAt: lastWeek,

      OrderItem: {
        create: [
          {
            productId: product1.id,
            quantity: 5,
            price: 100,
          },
        ],
      },
    },
  });
  await prisma.order.create({
    data: {
      orderNumber: 'TEST-004',
      totalAmount: 1000,
      totalItems: 10,
      type: OrderType.ORDER,
      status: OrderStatus.PENDING,
      clientId: client2.id,
      userId: user.id,

      OrderItem: {
        create: [
          {
            productId: product1.id,
            quantity: 10,
            price: 100,
          },
        ],
      },
    },
  });

  // Hoy pero CANCELLED
  await prisma.order.create({
    data: {
      orderNumber: 'TEST-005',
      totalAmount: 750,
      totalItems: 5,
      type: OrderType.ORDER,
      status: OrderStatus.CANCELLED,
      clientId: client2.id,
      userId: user.id,

      OrderItem: {
        create: [
          {
            productId: product2.id,
            quantity: 5,
            price: 150,
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed');
  console.log({
    todayOrder: todayOrder.id,
    user: user.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
