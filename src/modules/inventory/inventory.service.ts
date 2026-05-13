import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import { ProductsService } from '../products/products.service';

import { PaginationDto } from '../../common';

import { CreateInventoryDto, UpdateInventoryDto } from './dto';

@Injectable()
export class InventoryService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('InventoryService');

  constructor(private readonly productsService: ProductsService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  async createInventory(createInventoryDto: CreateInventoryDto) {
    const { code, name, description, items } = createInventoryDto;

    const existingCode = await this.inventory.findUnique({
      where: { code },
    });

    if (existingCode) {
      throw new HttpException(
        `Inventory with code "${code}" already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const productIds = items.map((item) => item.productId);

    const products = await this.productsService.validateProducts(productIds);

    const notFound = items.filter(
      (item) => !products.some((product) => product.id === item.productId),
    );

    if (notFound.length > 0) {
      throw new HttpException(
        `Products not found: ${notFound.map((i) => i.productId).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const inventory = await this.inventory.create({
        data: {
          code,
          name,
          description,
          InventoryItem: {
            createMany: {
              data: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
          },
        },
        include: {
          InventoryItem: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      return {
        ...inventory,
        InventoryItem: inventory.InventoryItem.map((inventoryItem) => ({
          ...inventoryItem,
          name: products.find(
            (product) => product.id === inventoryItem.productId,
          )?.name,
        })),
      };
    } catch (error) {
      this.logger.error(error);

      throw new HttpException(
        'Error creating inventory',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAllInventories(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = await this.inventory.count({
      where: { isActive: true },
    });

    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.inventory.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { isActive: true },
      }),

      meta: {
        total: totalPages,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const inventory = await this.inventory.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        InventoryItem: true,
      },
    });

    if (!inventory) {
      throw new HttpException(
        `Inventory with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return inventory;
  }

  async updateInventory(id: string, updateInventoryDto: UpdateInventoryDto) {
    await this.findOne(id);

    const { items, ...data } = updateInventoryDto;

    if (items?.length) {
      const productIds = items.map((i) => i.productId);

      await this.productsService.validateProducts(productIds);
    }

    await this.inventory.update({
      where: { id },
      data,
    });

    if (!items) {
      return this.inventory.findUnique({
        where: { id },
        include: {
          InventoryItem: true,
        },
      });
    }

    const incomingIds = items.map((i) => i.productId);

    await this.inventoryItem.deleteMany({
      where: {
        inventoryId: id,
        productId: {
          notIn: incomingIds,
        },
      },
    });

    await Promise.all(
      items.map((item) =>
        this.inventoryItem.upsert({
          where: {
            productId_inventoryId: {
              productId: item.productId,
              inventoryId: id,
            },
          },

          update: {
            quantity: item.quantity,
          },

          create: {
            inventoryId: id,
            productId: item.productId,
            quantity: item.quantity,
          },
        }),
      ),
    );

    return this.inventory.findUnique({
      where: { id },
      include: {
        InventoryItem: true,
      },
    });
  }

  async deleteInventory(id: string) {
    await this.findOne(id);

    return this.inventory.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
