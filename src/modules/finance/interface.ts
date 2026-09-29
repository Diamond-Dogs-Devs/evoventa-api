import { FinancialOrderItem } from './utils/type';

export interface FinancialInitialData {
  orders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    totalItems: number;
    updatedAt: Date;
  }>;

  items: FinancialOrderItem[];
}

export interface FinancialSalesData {
  productId: string;
  quantity: number;
  price: number;
  updatedAt: Date | string;
}

export interface MonthlySales {
  period: string;
  sales: number;
  revenue: number;
}
