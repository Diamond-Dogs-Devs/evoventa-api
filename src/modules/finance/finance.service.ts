import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FinancialMaths } from './utils/FinancialMaths';
import { ProductProjection } from './utils/type';
import {
  FinancialInitialData,
  FinancialSalesData,
  MonthlySales,
} from './interface';

@Injectable()
export class FinancialService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('FinancialService');
  private readonly maths = new FinancialMaths();

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  private groupSalesByMonth(data: FinancialSalesData[]): MonthlySales[] {
    const grouped = new Map<string, MonthlySales>();

    for (const item of data) {
      const date = new Date(item.updatedAt);

      if (isNaN(date.getTime())) {
        continue;
      }

      const period = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;

      const current = grouped.get(period);

      const sales = item.quantity;
      const revenue = item.quantity * item.price;

      if (current) {
        current.sales += sales;
        current.revenue += revenue;
      } else {
        grouped.set(period, {
          period,
          sales,
          revenue,
        });
      }
    }

    return Array.from(grouped.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((item) => ({
        ...item,
        revenue: Number(item.revenue.toFixed(2)),
      }));
  }

  private async onInitialData(
    start: Date,
    end: Date,
  ): Promise<FinancialInitialData> {
    const orders = await this.order.findMany({
      where: {
        status: 'PAID',
        updatedAt: {
          gte: start,
          lte: end,
        },
      },

      orderBy: {
        updatedAt: 'asc',
      },

      include: {
        OrderItem: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const items = orders.flatMap((order) =>
      order.OrderItem.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        updatedAt: order.updatedAt,
      })),
    );

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        totalItems: order.totalItems,
        updatedAt: order.updatedAt,
      })),

      items,
    };
  }

  private resolveDateRange(startDate?: string, endDate?: string) {
    let start: Date;
    let end: Date;

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

    return {
      start,
      end,
    };
  }

  private async getFinancialData(startDate?: string, endDate?: string) {
    const { start, end } = this.resolveDateRange(startDate, endDate);

    return this.onInitialData(start, end);
  }

  async getPaidOrders(startDate?: string, endDate?: string) {
    try {
      const { end, start } = this.resolveDateRange(startDate, endDate);
      const { orders, items } = await this.onInitialData(start, end);
      const totalAmount = orders.reduce(
        (total, order) => total + order.totalAmount,
        0,
      );
      const totalItems = orders.reduce(
        (total, order) => total + order.totalItems,
        0,
      );

      const monthlySales = this.groupSalesByMonth(items);

      return {
        data: items,
        monthlySales,
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

  async projectSales(
    startDate?: string,
    endDate?: string,
    monthsToProject = 1,
  ): Promise<ProductProjection[]> {
    const { items } = await this.getFinancialData(startDate, endDate);

    return this.maths.projectSales(items, monthsToProject);
  }

  async projectRevenue(
    startDate?: string,
    endDate?: string,
    monthsToProject = 1,
  ): Promise<ProductProjection[]> {
    const { items } = await this.getFinancialData(startDate, endDate);

    return this.maths.projectRevenue(items, monthsToProject);
  }

  async estimateFromPreviousYears(startDate?: string, endDate?: string) {
    try {
      const { items } = await this.getFinancialData(startDate, endDate);

      return this.maths.estimateFromPreviousYears(items);
    } catch (error) {
      this.logger.error(error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error generating historical estimate',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
