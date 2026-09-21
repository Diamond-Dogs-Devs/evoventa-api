import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class FinancialService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('FinancialService');

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  async getPaidOrders(startDate?: string, endDate?: string) {
    let start: Date;
    let end: Date;

    try {
      if (startDate || endDate) {
        start = startDate ? new Date(`${startDate}T00:00:00`) : new Date(0);

        end = endDate ? new Date(`${endDate}T23:59:59.999`) : new Date();
      } else {
        const today = new Date();

        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0,
          0,
        );

        end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
          999,
        );
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new HttpException('Invalid date format', HttpStatus.BAD_REQUEST);
      }

      if (start > end) {
        throw new HttpException(
          'startDate cannot be greater than endDate',
          HttpStatus.BAD_REQUEST,
        );
      }

      const orders = await this.order.findMany({
        where: {
          status: 'PAID',
          updatedAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          OrderItem: {
            select: {
              productId: true,
              quantity: true,
              price: true,
            },
          },
        },
      });

      const totalAmount = orders.reduce(
        (total, order) => total + order.totalAmount,
        0,
      );

      const totalItems = orders.reduce(
        (total, order) => total + order.totalItems,
        0,
      );

      return {
        data: orders,
        meta: {
          startDate: start,
          endDate: end,
          totalOrders: orders.length,
          totalItems,
          totalAmount,
        },
      };
    } catch (error) {
      this.logger.error(error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error retrieving financial data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
