import {
  HttpStatus,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PaginationDto } from '../../common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Products-Service');

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }
  async create(createProductDto: CreateProductDto) {
    const { barcode, sku } = createProductDto;

    if (barcode) {
      const existingBarcode = await this.product.findUnique({
        where: { barcode: createProductDto.barcode },
      });
      if (existingBarcode) {
        throw new HttpException(
          `Product with barcode "${createProductDto.barcode}" already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (sku) {
      const existingSku = await this.product.findUnique({
        where: { sku: createProductDto.sku },
      });
      if (existingSku) {
        throw new HttpException(
          `Product with SKU "${createProductDto.sku}" already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      return await this.product.create({
        data: createProductDto,
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Error creating product', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = await this.product.count({
      where: { isActive: true },
    });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { isActive: true },
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
    await this.findOne(id);

    return await this.product.update({ where: { id }, data: updateProductDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    //Hard delete
    // return this.product.delete({
    //   where: { id },
    // });

    //Soft delete
    const product = await this.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return product;
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
