import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinancialController } from './finance.controller';
import { FinancialService } from './finance.service';

@Module({
  imports: [AuthModule],
  controllers: [FinancialController],
  providers: [FinancialService],
})
export class FinancialModule {}
