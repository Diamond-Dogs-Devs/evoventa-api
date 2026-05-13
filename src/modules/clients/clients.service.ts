import {
  HttpStatus,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PaginationDto } from '../../common';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Clients-MS');

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
    const { page, limit } = paginationDto;

    const totalPages = await this.client.count({ where: { isActive: true } });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.client.findMany({
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
    const client = await this.client.findFirst({
      where: { id, isActive: true },
    });

    if (!client) {
      throw new HttpException(
        `Client with id ${id} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    await this.findOne(id);

    return this.client.update({ where: { id }, data: updateClientDto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const client = await this.client.update({
      where: { id },
      data: { isActive: false },
    });
    return client;
  }
}
