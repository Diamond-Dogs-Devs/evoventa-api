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
import { CacheService } from '../cache/cache.service';

@Injectable()
export class InventoryService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('InventoryService');

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
    const { page, limit, search } = paginationDto;

    const where = {
      isActive: true,
      OR: search
        ? [
            {
              code: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ]
        : undefined,
    };

    const totalPages = await this.inventory.count({
      where,
    });

    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.inventory.findMany({
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
    const cacheKey = `inventory:${id}`;

    const cachedInventory = await this.cacheService.get(cacheKey);

    if (cachedInventory) {
      return cachedInventory;
    }

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

    await this.cacheService.set(cacheKey, inventory, 300);

    return inventory;
  }

  async updateInventory(id: string, updateInventoryDto: UpdateInventoryDto) {
    const cacheKey = `inventory:${id}`;

    await this.findOne(id);

    const { items, ...data } = updateInventoryDto;

    if (items?.length) {
      const productIds = items.map((item) => item.productId);

      await this.productsService.validateProducts(productIds);
    }

    await this.inventory.update({
      where: { id },
      data,
    });

    if (!items) {
      const updated = await this.inventory.findUnique({
        where: { id },
        include: {
          InventoryItem: true,
        },
      });

      await this.cacheService.del(cacheKey);

      return updated;
    }

    const incomingIds = items.map((item) => item.productId);

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

    const updated = await this.inventory.findUnique({
      where: { id },
      include: {
        InventoryItem: true,
      },
    });

    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteInventory(id: string) {
    const cacheKey = `inventory:${id}`;

    await this.findOne(id);

    const deleted = await this.inventory.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await this.cacheService.del(cacheKey);

    return deleted;
  }
}
