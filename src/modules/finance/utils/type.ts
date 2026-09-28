export interface FinancialOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  updatedAt: Date;
}

export enum TrendType {
  INCREASE = 'A LA ALZA',
  DECREASE = 'A LA BAJA',
  STABLE = 'ESTABLE',
}

export interface ProductProjection {
  productId: string;
  productName: string;
  currentSales: number;
  averageMonthlySales: number;

  trend: number;
  trendPercentage: number;

  projectedNextMonth: number;
  projectedRevenue: number;

  variance: number;
  standardDeviation: number;

  trendType: TrendType;
  productHealth: ProductHealth;
}

export interface YearlyEstimate {
  productId: string;

  currentYearSales: number;
  previousYearsAverage: number;

  estimatedSales: number;
  estimatedRevenue: number;

  growthPercentage: number;
}

export enum ProductHealth {
  GROWING = 'A LA ALZA',
  STABLE = 'ESTABLE',
  DECLINING = 'A LA BAJA',
  VOLATILE = 'VOLATIL',
}
