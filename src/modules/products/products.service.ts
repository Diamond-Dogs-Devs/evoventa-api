import {
  HttpStatus,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PaginationDto } from '../../common';
import { CreateProductDto, UpdateProductDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Products-Service');

  constructor(private readonly cloudinaryService: CloudinaryService) {
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

      return await this.product.create({
        data: createProductDto,
      });
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

  async findOne(id: string) {
    const product = await this.product.findFirst({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new HttpException(
        `Product with id ${id} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
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

    return this.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    if (product.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(product.imagePublicId);
      } catch (err) {
        this.logger.error('Cloudinary delete failed', err);
      }
    }

    return this.product.update({
      where: { id },
      data: {
        isActive: false,
        imageUrl: null,
        imagePublicId: null,
      },
    });
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
