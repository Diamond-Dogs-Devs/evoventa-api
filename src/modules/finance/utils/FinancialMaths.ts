import {
  FinancialOrderItem,
  ProductHealth,
  ProductProjection,
  TrendType,
  YearlyEstimate,
} from './type';

export class FinancialMaths {
  private groupByProductAndMonth(
    items: FinancialOrderItem[],
  ): Map<string, Map<string, number>> {
    const result = new Map<string, Map<string, number>>();

    for (const item of items) {
      const date = new Date(item.updatedAt);

      const month = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;

      if (!result.has(item.productId)) {
        result.set(item.productId, new Map());
      }

      const product = result.get(item.productId);

      product.set(month, (product.get(month) ?? 0) + item.quantity);
    }

    return result;
  }

  private linearRegression(values: number[]) {
    const n = values.length;

    if (n < 2) {
      return {
        slope: 0,
        intercept: values[0] ?? 0,
      };
    }

    const x = values.map((_, index) => index + 1);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);

    const sumXY = x.reduce(
      (sum, value, index) => sum + value * values[index],
      0,
    );

    const sumX2 = x.reduce((sum, value) => sum + value * value, 0);

    const denominator = n * sumX2 - sumX * sumX;

    if (denominator === 0) {
      return {
        slope: 0,
        intercept: values[0] ?? 0,
      };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;

    const intercept = (sumY - slope * sumX) / n;

    return {
      slope,
      intercept,
    };
  }

  private variance(values: number[]): number {
    if (!values.length) return 0;

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    return (
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      values.length
    );
  }

  private standardDeviation(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  projectSales(
    items: FinancialOrderItem[],
    monthsToProject = 1,
  ): ProductProjection[] {
    const grouped = this.groupByProductAndMonth(items);

    const result: ProductProjection[] = [];

    for (const [productId, monthlySales] of grouped) {
      const values = Array.from(monthlySales.values());

      if (!values.length) continue;

      const currentSales = values[values.length - 1];

      const averageMonthlySales =
        values.reduce((a, b) => a + b, 0) / values.length;

      const product = items.find((itm) => itm.productId === productId);

      const { slope, intercept } = this.linearRegression(values);

      const futureX = values.length + monthsToProject;

      const projectedNextMonth = Math.max(0, intercept + slope * futureX);

      const variance = this.variance(values);

      const standardDeviation = this.standardDeviation(values);

      const trendPercentage =
        averageMonthlySales !== 0 ? (slope / averageMonthlySales) * 100 : 0;

      let trendType: TrendType;

      if (Math.abs(trendPercentage) < 5) {
        trendType = TrendType.STABLE;
      } else if (trendPercentage > 0) {
        trendType = TrendType.INCREASE;
      } else {
        trendType = TrendType.DECREASE;
      }

      const coefficientOfVariation =
        averageMonthlySales !== 0 ? standardDeviation / averageMonthlySales : 0;

      /**
       * Determinamos si el producto tiene
       * demasiada variabilidad.
       *
       * 30% es un umbral inicial.
       * Posteriormente puede hacerse configurable.
       */
      const isVolatile = coefficientOfVariation >= 0.3;

      let productHealth: ProductHealth;

      if (isVolatile) {
        productHealth = ProductHealth.VOLATILE;
      } else if (trendType === TrendType.INCREASE) {
        productHealth = ProductHealth.GROWING;
      } else if (trendType === TrendType.DECREASE) {
        productHealth = ProductHealth.DECLINING;
      } else {
        productHealth = ProductHealth.STABLE;
      }

      const averagePrice =
        items.reduce((sum, item) => sum + item.price, 0) / items.length;

      const projectedRevenue = projectedNextMonth * averagePrice;

      result.push({
        productId,
        productName: product.productName,
        currentSales,
        averageMonthlySales: Number(averageMonthlySales.toFixed(2)),
        trend: Number(slope.toFixed(2)),
        trendPercentage: Number(trendPercentage.toFixed(2)),
        projectedNextMonth: Number(projectedNextMonth.toFixed(2)),
        projectedRevenue,
        variance: Number(variance.toFixed(2)),
        standardDeviation: Number(standardDeviation.toFixed(2)),
        trendType,
        productHealth,
      });
    }

    return result;
  }

  /**
   * Calcula el precio promedio de cada producto
   * y agrega el ingreso estimado.
   */
  projectRevenue(
    items: FinancialOrderItem[],
    monthsToProject = 1,
  ): ProductProjection[] {
    const projections = this.projectSales(items, monthsToProject);

    const prices = new Map<string, number[]>();

    for (const item of items) {
      if (!prices.has(item.productId)) {
        prices.set(item.productId, []);
      }

      prices.get(item.productId).push(item.price);
    }

    return projections.map((projection) => {
      const productPrices = prices.get(projection.productId) ?? [];

      const averagePrice = productPrices.length
        ? productPrices.reduce((a, b) => a + b, 0) / productPrices.length
        : 0;

      return {
        ...projection,
        productName: projection.productName,
        projectedRevenue: Number(
          (projection.projectedNextMonth * averagePrice).toFixed(2),
        ),
      };
    });
  }

  /**
   * Compara el comportamiento de ventas
   * entre años.
   *
   * Ejemplo:
   *
   * 2023 -> 100
   * 2024 -> 120
   * 2025 -> 150
   *
   * promedio histórico = 110
   * crecimiento = 36.36%
   */
  estimateFromPreviousYears(
    items: FinancialOrderItem[],
    currentYear = new Date().getFullYear(),
  ): YearlyEstimate[] {
    const yearlySales = new Map<string, Map<number, number>>();

    for (const item of items) {
      const year = new Date(item.updatedAt).getFullYear();

      if (!yearlySales.has(item.productId)) {
        yearlySales.set(item.productId, new Map());
      }

      const product = yearlySales.get(item.productId);

      product.set(year, (product.get(year) ?? 0) + item.quantity);
    }

    const result: YearlyEstimate[] = [];

    for (const [productId, years] of yearlySales) {
      const currentYearSales = years.get(currentYear) ?? 0;

      const previousYears = Array.from(years.entries())
        .filter(([year]) => year < currentYear)
        .map(([, sales]) => sales);

      if (!previousYears.length) {
        continue;
      }

      const previousYearsAverage =
        previousYears.reduce((a, b) => a + b, 0) / previousYears.length;

      const growthPercentage =
        previousYearsAverage !== 0
          ? ((currentYearSales - previousYearsAverage) / previousYearsAverage) *
            100
          : 0;

      const estimatedSales =
        currentYearSales > 0
          ? currentYearSales * (1 + growthPercentage / 100)
          : previousYearsAverage;

      const productItems = items.filter((item) => item.productId === productId);

      const averagePrice = productItems.length
        ? productItems.reduce((sum, item) => sum + item.price, 0) /
          productItems.length
        : 0;

      result.push({
        productId,

        currentYearSales,

        previousYearsAverage: Number(previousYearsAverage.toFixed(2)),

        estimatedSales: Number(estimatedSales.toFixed(2)),

        estimatedRevenue: Number((estimatedSales * averagePrice).toFixed(2)),

        growthPercentage: Number(growthPercentage.toFixed(2)),
      });
    }

    return result;
  }
}
