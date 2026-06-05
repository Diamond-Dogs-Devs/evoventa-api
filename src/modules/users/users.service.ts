import {
  HttpStatus,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

import { PaginationDto } from '../../common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { userSelect } from './prisma/user.select';

@Injectable()
export class UsersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Users-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  async create(createUserDto: CreateUserDto) {
    const { employeeNumber, password, ...rest } = createUserDto;

    const existingUserByEmail = await this.user.findUnique({
      where: { email: rest.email },
    });

    if (existingUserByEmail) {
      throw new HttpException(
        'User with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingEmployee = await this.user.findUnique({
      where: { employeeNumber },
    });

    if (existingEmployee) {
      throw new HttpException(
        'Employee number already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.user.create({
        data: {
          ...rest,
          employeeNumber,
          password: bcrypt.hashSync(password, 10),
        },
        select: userSelect,
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Error creating user', HttpStatus.BAD_REQUEST);
    }
  }

  async findByEmail(email: string) {
    const user = await this.user.findUnique({
      where: { email },
      select: userSelect,
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, search } = paginationDto;

    const where = {
      isActive: true,
      OR: search
        ? [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ]
        : undefined,
    };

    const totalPages = await this.user.count({
      where,
    });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.user.findMany({
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
    const user = await this.user.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: userSelect,
    });

    if (!user) {
      throw new HttpException(
        `User with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    return this.user.update({
      where: { id },
      data: updateUserDto,
      select: userSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });
  }
}
