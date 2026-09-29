import {
  PrismaClient,
  OrderStatus,
  OrderType,
  ProductStatus,
  Role,
} from '@prisma/client';

const prisma = new PrismaClient();

function createDate(year: number, month: number, day = 15): Date {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

async function main() {
  console.log('🌱 Seeding database...');

  // =========================================================
  // USER
  // =========================================================

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

  // =========================================================
  // CLIENTS
  // =========================================================

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

  // =========================================================
  // PRODUCTS
  // =========================================================

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

  // =========================================================
  // CLEAN TEST ORDERS
  // =========================================================

  await prisma.$transaction(async (tx) => {
    const testOrders = await tx.order.findMany({
      where: {
        orderNumber: {
          startsWith: 'TEST-',
        },
      },
      select: {
        id: true,
      },
    });

    const orderIds = testOrders.map((order) => order.id);

    if (orderIds.length === 0) {
      return;
    }

    // Primero hijos
    await tx.orderItem.deleteMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
    });

    // Después padres
    await tx.order.deleteMany({
      where: {
        id: {
          in: orderIds,
        },
      },
    });
  });

  // =========================================================
  // HELPER PARA CREAR ORDENES
  // =========================================================

  let orderCounter = 1;

  async function createPaidOrder(params: {
    date: Date;
    productId: string;
    quantity: number;
    price: number;
    clientId?: string;
  }) {
    const orderNumber = `TEST-${String(orderCounter).padStart(4, '0')}`;

    orderCounter++;

    const totalAmount = params.quantity * params.price;

    return prisma.order.create({
      data: {
        orderNumber,

        totalAmount,

        totalItems: params.quantity,

        type: OrderType.ORDER,

        status: OrderStatus.PAID,

        clientId: params.clientId ?? client1.id,

        userId: user.id,

        createdAt: params.date,

        updatedAt: params.date,

        OrderItem: {
          create: [
            {
              productId: params.productId,

              quantity: params.quantity,

              price: params.price,
            },
          ],
        },
      },
    });
  }

  // =========================================================
  // HISTORICAL DATA
  // =========================================================
  //
  // PRODUCT A
  //
  // Tendencia creciente.
  //
  // 2023 -> ~20-40 unidades
  // 2024 -> ~40-70 unidades
  // 2025 -> ~70-100 unidades
  // 2026 -> ~100-140 unidades
  //
  // =========================================================

  const productAGrowth = [
    // 2023
    [2023, 1, 20],
    [2023, 2, 22],
    [2023, 3, 25],
    [2023, 4, 27],
    [2023, 5, 30],
    [2023, 6, 32],
    [2023, 7, 35],
    [2023, 8, 34],
    [2023, 9, 38],
    [2023, 10, 40],
    [2023, 11, 42],
    [2023, 12, 45],

    // 2024
    [2024, 1, 45],
    [2024, 2, 48],
    [2024, 3, 52],
    [2024, 4, 55],
    [2024, 5, 58],
    [2024, 6, 62],
    [2024, 7, 65],
    [2024, 8, 68],
    [2024, 9, 70],
    [2024, 10, 74],
    [2024, 11, 78],
    [2024, 12, 82],

    // 2025
    [2025, 1, 80],
    [2025, 2, 84],
    [2025, 3, 88],
    [2025, 4, 91],
    [2025, 5, 95],
    [2025, 6, 98],
    [2025, 7, 103],
    [2025, 8, 106],
    [2025, 9, 110],
    [2025, 10, 114],
    [2025, 11, 118],
    [2025, 12, 122],

    // 2026
    [2026, 1, 120],
    [2026, 2, 125],
    [2026, 3, 130],
    [2026, 4, 134],
    [2026, 5, 138],
    [2026, 6, 142],
    [2026, 7, 148],
    [2026, 8, 153],
    [2026, 9, 158],
  ];

  for (const [year, month, quantity] of productAGrowth) {
    await createPaidOrder({
      date: createDate(year, month),

      productId: product1.id,

      quantity,

      price: 100,
    });
  }

  // =========================================================
  // PRODUCT B
  //
  // Tendencia decreciente + cierta volatilidad.
  //
  // =========================================================

  const productBDecline = [
    // 2023
    [2023, 1, 180],
    [2023, 2, 175],
    [2023, 3, 170],
    [2023, 4, 165],
    [2023, 5, 160],
    [2023, 6, 155],
    [2023, 7, 150],
    [2023, 8, 145],
    [2023, 9, 140],
    [2023, 10, 135],
    [2023, 11, 130],
    [2023, 12, 125],

    // 2024
    [2024, 1, 120],
    [2024, 2, 130],
    [2024, 3, 105],
    [2024, 4, 125],
    [2024, 5, 95],
    [2024, 6, 115],
    [2024, 7, 90],
    [2024, 8, 105],
    [2024, 9, 85],
    [2024, 10, 100],
    [2024, 11, 75],
    [2024, 12, 95],

    // 2025
    [2025, 1, 85],
    [2025, 2, 100],
    [2025, 3, 70],
    [2025, 4, 90],
    [2025, 5, 65],
    [2025, 6, 85],
    [2025, 7, 60],
    [2025, 8, 78],
    [2025, 9, 55],
    [2025, 10, 70],
    [2025, 11, 50],
    [2025, 12, 65],

    // 2026
    [2026, 1, 60],
    [2026, 2, 70],
    [2026, 3, 45],
    [2026, 4, 65],
    [2026, 5, 40],
    [2026, 6, 58],
    [2026, 7, 35],
    [2026, 8, 50],
    [2026, 9, 30],
  ];

  for (const [year, month, quantity] of productBDecline) {
    await createPaidOrder({
      date: createDate(year, month),

      productId: product2.id,

      quantity,

      price: 150,
    });
  }

  // =========================================================
  // MULTIPLE ORDERS IN THE SAME MONTH
  // =========================================================
  //
  // Esto sirve para verificar que groupByProductAndMonth()
  // sume correctamente varias órdenes del mismo producto.
  //

  await createPaidOrder({
    date: createDate(2026, 9, 5),
    productId: product1.id,
    quantity: 20,
    price: 100,
  });

  await createPaidOrder({
    date: createDate(2026, 9, 10),
    productId: product1.id,
    quantity: 15,
    price: 100,
  });

  await createPaidOrder({
    date: createDate(2026, 9, 20),
    productId: product2.id,
    quantity: 8,
    price: 150,
  });

  // =========================================================
  // PENDING
  // =========================================================
  //
  // NO debe aparecer en los análisis.
  //

  await prisma.order.create({
    data: {
      orderNumber: 'TEST-PENDING',

      totalAmount: 1000,

      totalItems: 10,

      type: OrderType.ORDER,

      status: OrderStatus.PENDING,

      clientId: client2.id,

      userId: user.id,

      createdAt: createDate(2026, 9, 20),

      updatedAt: createDate(2026, 9, 20),

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

  // =========================================================
  // CANCELLED
  // =========================================================
  //
  // TAMPOCO debe aparecer.
  //

  await prisma.order.create({
    data: {
      orderNumber: 'TEST-CANCELLED',

      totalAmount: 1500,

      totalItems: 10,

      type: OrderType.ORDER,

      status: OrderStatus.CANCELLED,

      clientId: client2.id,

      userId: user.id,

      createdAt: createDate(2026, 9, 21),

      updatedAt: createDate(2026, 9, 21),

      OrderItem: {
        create: [
          {
            productId: product2.id,

            quantity: 10,

            price: 150,
          },
        ],
      },
    },
  });

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalPaid = await prisma.order.count({
    where: {
      orderNumber: {
        startsWith: 'TEST-',
      },

      status: OrderStatus.PAID,
    },
  });

  console.log('✅ Seed completed');

  console.log({
    user: user.email,

    products: {
      product1: product1.name,
      product2: product2.name,
    },

    paidOrders: totalPaid,

    historicalPeriod: '2023-01 → 2026-09',

    tests: [
      'Sales projection',
      'Revenue projection',
      'Product health',
      'Trend detection',
      'Variance',
      'Previous years estimation',
      'PAID filtering',
      'PENDING filtering',
      'CANCELLED filtering',
      'Multiple orders per month',
    ],
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
