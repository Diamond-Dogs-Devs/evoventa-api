import {
  HttpStatus,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Product } from '@prisma/client';

import { CacheService } from '../cache/cache.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { PaginationDto } from '../../common';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Products-Service');

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const { barcode, sku } = createProductDto;

      if (barcode) {
        const existingBarcode = await this.product.findUnique({
          where: { barcode },
        });

        if (existingBarcode) {
          throw new HttpException(
            `Product with barcode "${barcode}" already exists`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (sku) {
        const existingSku = await this.product.findUnique({
          where: { sku },
        });

        if (existingSku) {
          throw new HttpException(
            `Product with SKU "${sku}" already exists`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const product = await this.product.create({
        data: createProductDto,
      });

      return product;
    } catch (error) {
      if (createProductDto.imagePublicId) {
        try {
          await this.cloudinaryService.deleteImage(
            createProductDto.imagePublicId,
          );
        } catch (cloudinaryError) {
          this.logger.error('Cloudinary rollback failed', cloudinaryError);
        }
      }

      this.logger.error(error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Error creating product', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, search } = paginationDto;

    const where = {
      isActive: true,
      OR: search
        ? [
            {
              barcode: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              sku: {
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

    const totalPages = await this.product.count({
      where,
    });

    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    const cachedProduct = await this.cacheService.get<Product>(cacheKey);

    if (cachedProduct) {
      return cachedProduct;
    }

    const product = await this.product.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!product) {
      throw new HttpException(
        `Product with id ${id} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.cacheService.set(cacheKey, product, 300);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const cacheKey = `product:${id}`;
    const product = await this.findOne(id);

    const oldImagePublicId = product.imagePublicId;
    const newImagePublicId = updateProductDto.imagePublicId;

    const hasNewImage =
      newImagePublicId && newImagePublicId !== oldImagePublicId;

    if (hasNewImage && oldImagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(oldImagePublicId);
      } catch (err) {
        this.logger.error('Cloudinary delete failed', err);
      }
    }

    const updated = await this.product.update({
      where: { id },
      data: updateProductDto,
    });

    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(id: string) {
    const cacheKey = `product:${id}`;
    const product = await this.findOne(id);

    if (product.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(product.imagePublicId);
      } catch (err) {
        this.logger.error('Cloudinary delete failed', err);
      }
    }

    const deleted = await this.product.update({
      where: { id },
      data: {
        isActive: false,
        imageUrl: null,
        imagePublicId: null,
      },
    });

    await this.cacheService.del(cacheKey);

    return deleted;
  }

  async validateProducts(ids: string[]) {
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids,
        },
        isActive: true,
      },
    });

    if (products.length !== ids.length) {
      throw new HttpException(
        'Some products were not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    return products;
  }
}
