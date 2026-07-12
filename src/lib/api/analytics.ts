import apiClient from "./client";

export interface ChartPoint {
  date: string;
  revenue: number;
}

export interface DashboardMetrics {
  totalSalesCount: number;
  totalRevenue: number;
  chartData: ChartPoint[];
}

interface MetricsEnvelope {
  status: string;
  data: DashboardMetrics;
}

/**
 * Fetch advanced dashboard metrics and sales charts from backend.
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data: envelope } = await apiClient.get<MetricsEnvelope>("/analytics");
  return envelope.data;
}
