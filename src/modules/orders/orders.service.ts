import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';

import { ProductsService } from '../products/products.service';

import {
  CreateOrderDto,
  ChangeOrderStatusDto,
  ChangeOrderTypeDto,
  OrderPaginationDto,
} from './dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(
    private readonly productsService: ProductsService,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  async create(createOrderDto: CreateOrderDto, userId: string) {
    const { clientId, orderNumber } = createOrderDto;

    const existingOrderNumber = await this.order.findUnique({
      where: { orderNumber },
    });

    if (existingOrderNumber) {
      throw new HttpException(
        `Order with number "${orderNumber}" already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const productIds = createOrderDto.items.map((item) => item.productId);

    const products = await this.productsService.validateProducts(productIds);

    const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
      const product = products.find(
        (product) => product.id === orderItem.productId,
      );

      if (!product) {
        throw new HttpException(
          `Product ${orderItem.productId} not found`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return acc + product.price * orderItem.quantity;
    }, 0);

    const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
      return acc + orderItem.quantity;
    }, 0);

    try {
      const order = await this.order.create({
        data: {
          orderNumber,
          totalAmount,
          totalItems,
          clientId,
          userId,

          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => {
                const product = products.find(
                  (product) => product.id === orderItem.productId,
                );

                return {
                  price: product?.price ?? 0,
                  productId: orderItem.productId,
                  quantity: orderItem.quantity,
                };
              }),
            },
          },
        },

        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,

        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,

          name: products.find((product) => product.id === orderItem.productId)
            ?.name,
        })),
      };
    } catch (error) {
      this.logger.error(error);

      throw new HttpException('Error creating order', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { page, limit, search } = orderPaginationDto;

    const where = {
      status: orderPaginationDto.status,
      type: orderPaginationDto.type,
      OR: search
        ? [
            {
              orderNumber: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ]
        : undefined,
    };

    const totalPages = await this.order.count({
      where,
    });

    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,

        where,
      }),

      meta: {
        total: totalPages,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const cacheKey = `order:${id}`;

    const cachedOrder = await this.cacheService.get(cacheKey);

    if (cachedOrder) {
      return cachedOrder;
    }

    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new HttpException(
        `Order with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const productIds = order.OrderItem.map((item) => item.productId);

    const products = await this.productsService.validateProducts(productIds);

    const response = {
      ...order,

      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,

        name: products.find((product) => product.id === orderItem.productId)
          ?.name,
      })),
    };

    await this.cacheService.set(cacheKey, response, 300);

    return response;
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const cacheKey = `order:${id}`;

    const order = await this.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new HttpException(
        `Order with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (order.status === status) {
      return order;
    }

    const updated = await this.order.update({
      where: { id },
      data: { status },
    });

    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteOrder(id: string, isAdmin: boolean) {
    const cacheKey = `order:${id}`;
    const order = await this.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new HttpException(
        `Order with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (order.type === 'QUOTATION') {
      await this.order.delete({
        where: { id },
      });

      await this.cacheService.del(cacheKey);

      return {
        message: 'Quotation deleted successfully',
      };
    }

    if (order.type === 'ORDER') {
      if (!isAdmin) {
        throw new HttpException(
          'Only admins can delete orders',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.order.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      await this.cacheService.del(cacheKey);

      return {
        message: 'Order cancelled successfully',
      };
    }

    throw new HttpException('Invalid order type', HttpStatus.BAD_REQUEST);
  }

  async changeOrderType(changeOrderTypeDto: ChangeOrderTypeDto) {
    const { id, type } = changeOrderTypeDto;
    const cacheKey = `order:${id}`;
    const order = await this.order.findUnique({
      where: {
        id,
      },
    });

    if (!order) {
      throw new HttpException(
        `Order with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.order.update({
      where: {
        id,
      },
      data: {
        type,
      },
    });

    await this.cacheService.del(cacheKey);

    return updated;
  }
}
