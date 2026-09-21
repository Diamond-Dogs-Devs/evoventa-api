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
}
