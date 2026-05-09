import {
  BadRequestException,
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
      throw new BadRequestException('User with this email already exists');
    }

    const existingEmployee = await this.user.findUnique({
      where: { employeeNumber },
    });

    if (existingEmployee) {
      throw new BadRequestException('Employee number already exists');
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
      throw new BadRequestException('Error creating user');
    }
  }

  async findByEmail(email: string) {
    const user = await this.user.findUnique({
      where: { email },
      select: userSelect,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const total = await this.user.count({
      where: { isActive: true },
    });

    const lastPage = Math.ceil(total / limit);

    const data = await this.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { isActive: true },
      select: userSelect,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
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
      throw new BadRequestException(`User with id ${id} not found`);
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
