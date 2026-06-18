import {
  HttpStatus,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';

import { PaginationDto } from '../../common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { userSelect } from './prisma/user.select';
import { CacheService } from '../cache/cache.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Users-Service');

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  async create(createUserDto: CreateUserDto) {
    try {
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

      const user = await this.user.create({
        data: {
          ...rest,
          employeeNumber,
          password: bcrypt.hashSync(password, 10),
        },
        select: userSelect,
      });
      return user;
    } catch (error) {
      if (createUserDto.imagePublicId) {
        try {
          await this.cloudinaryService.deleteImage(createUserDto.imagePublicId);
        } catch (cloudinaryError) {
          this.logger.error('Cloudinary rollback failed', cloudinaryError);
        }
      }

      this.logger.error(error);

      if (error instanceof HttpException) {
        throw error;
      }
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

  async findOne(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheService.get<User>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

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

    await this.cacheService.set(cacheKey, user, 300);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const cacheKey = `user:${id}`;
    const user = await this.findOne(id);

    const oldImagePublicId = user.imagePublicId;
    const newImagePublicId = updateUserDto.imagePublicId;

    const hasNewImage =
      newImagePublicId && newImagePublicId !== oldImagePublicId;

    if (hasNewImage && oldImagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(oldImagePublicId);
      } catch (err) {
        this.logger.error('Cloudinary delete failed', err);
      }
    }

    const updatedUser = await this.user.update({
      where: { id },
      data: updateUserDto,
      select: userSelect,
    });

    await this.cacheService.del(cacheKey);

    return updatedUser;
  }

  async remove(id: string) {
    const cacheKey = `user:${id}`;
    const user = await this.findOne(id);

    if (user.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(user.imagePublicId);
      } catch (err) {
        this.logger.error('Cloudinary delete failed', err);
      }
    }

    const deleted = await this.user.update({
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
}
