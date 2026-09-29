import { AuthGuard } from '@/common';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinancialService } from './finance.service';

@Controller('finance')
@UseGuards(AuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('paid-orders')
  async getPaidOrders(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.getPaidOrders(startDate, endDate);
  }

  @Get('projection/sales')
  async getProjectSales(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('monthsToProject') monthsToProject?: string,
  ) {
    return this.financialService.projectSales(
      startDate,
      endDate,
      monthsToProject ? Number(monthsToProject) : 1,
    );
  }

  @Get('projection/revenue')
  async getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('monthsToProject') monthsToProject?: string,
  ) {
    return this.financialService.projectRevenue(
      startDate,
      endDate,
      monthsToProject ? Number(monthsToProject) : 1,
    );
  }
}
