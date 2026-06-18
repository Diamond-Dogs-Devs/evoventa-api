import {
  HttpStatus,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

import { PaginationDto } from '../../common';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Clients-MS');

  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  async create(createClientDto: CreateClientDto) {
    const { email } = createClientDto;

    const existingClient = await this.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      throw new HttpException(
        'Client with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.client.create({
        data: createClientDto,
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Error creating client', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, search } = paginationDto;

    const where = {
      isActive: true,
      OR: search
        ? [
            {
              email: {
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

    const totalPages = await this.client.count({ where });

    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.client.findMany({
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
    const cacheKey = `client:${id}`;
    const cachedClient = await this.cacheService.get(cacheKey);

    if (cachedClient) {
      return cachedClient;
    }

    const client = await this.client.findFirst({
      where: { id, isActive: true },
    });

    if (!client) {
      throw new HttpException(
        `Client with id ${id} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.cacheService.set(cacheKey, client, 300);

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    const cacheKey = `client:${id}`;
    await this.findOne(id);

    const client = await this.client.update({
      where: { id },
      data: updateClientDto,
    });

    await this.cacheService.del(cacheKey);

    return client;
  }

  async remove(id: string) {
    const cacheKey = `client:${id}`;
    await this.findOne(id);

    const deleted = await this.client.update({
      where: { id },
      data: { isActive: false },
    });

    await this.cacheService.del(cacheKey);

    return deleted;
  }
}
