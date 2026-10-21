export interface SalesSummaryReport {
  tenantId: string;
  branchId?: string;
  from: string;
  to: string;
  grossSales: number;
  netSales: number;
  discounts: number;
  serviceCharge: number;
  tax: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface CategorySalesReport {
  categoryId: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
}

export interface ZReport {
  id: string;
  tenantId: string;
  branchId: string;
  closedAt: string;
  closedBy: string;
  openingCash: number;
  closingCash: number;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  discrepancy: number;
}
