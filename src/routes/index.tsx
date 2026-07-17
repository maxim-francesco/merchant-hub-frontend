import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ShoppingBag, Wallet, AlertTriangle, PackageCheck } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fetchOrders, type Order } from "@/lib/api/orders";
import { fetchDashboardMetrics } from "@/lib/api/analytics";
import { useTenantStore } from "@/lib/store/tenantStore";
import { ro } from "@/lib/i18n/ro";
import { STATUS_BADGE_STYLES } from "@/lib/orderStatus";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: ro.dashboard.headTitle },
      { name: "description", content: ro.dashboard.headDesc },
    ],
  }),
  component: Dashboard,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(value: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    month: "short",
    day: "numeric",
  });
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border/80 p-3 rounded-lg shadow-md text-xs font-sans">
        <p className="font-semibold text-foreground mb-1">{payload[0].payload.date}</p>
        <p className="text-primary font-bold">
          {new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: "RON",
            minimumFractionDigits: 2,
          }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// Shared badge styles imported from orderStatus

// ─── Dashboard Component ──────────────────────────────────────────────────────

function Dashboard() {
  const activeAdminTenant = useTenantStore((s) => s.activeAdminTenant);

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders", activeAdminTenant?.id],
    queryFn: fetchOrders,
    staleTime: 30_000,
    enabled: !!activeAdminTenant?.id,
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["dashboard-analytics", activeAdminTenant?.id],
    queryFn: fetchDashboardMetrics,
    staleTime: 30_000,
    enabled: !!activeAdminTenant?.id,
  });

  const isLoading = isLoadingOrders || isLoadingAnalytics;

  // Calculate dynamic metrics
  const totalSalesCount = analytics?.totalSalesCount ?? 0;
  const totalRevenue = analytics?.totalRevenue ?? 0;
  const activeOrdersCount = orders?.filter(o => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PAID").length ?? 0;

  // Static/Calculated metrics card list
  const metricsCards = [
    {
      label: ro.dashboard.totalSales,
      value: isLoading ? null : totalSalesCount.toString(),
      change: ro.dashboard.liveSynced,
      icon: ShoppingBag,
      subtext: ro.dashboard.nonCancelled
    },
    {
      label: ro.dashboard.activeOrders,
      value: isLoading ? null : activeOrdersCount.toString(),
      change: ro.dashboard.fulfillNow,
      icon: PackageCheck,
      subtext: ro.dashboard.pendingPaid
    },
    {
      label: ro.dashboard.revenue,
      value: isLoading ? null : fmtPrice(totalRevenue),
      change: ro.dashboard.settled,
      icon: Wallet,
      subtext: ro.dashboard.paidShipped
    },
    {
      label: ro.dashboard.systemAlerts,
      value: "0",
      change: ro.dashboard.allHealthy,
      icon: AlertTriangle,
      subtext: ro.dashboard.noIssues
    },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ro.dashboard.overview}</h1>
          <p className="text-sm text-muted-foreground">{ro.dashboard.welcome}</p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsCards.map((c) => (
            <Card key={c.label} className="border-border/60 shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between min-h-[7rem]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                  <c.icon className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div>
                  {c.value === null ? (
                    <Skeleton className="h-7 w-20 my-1" />
                  ) : (
                    <div className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums mt-1">{c.value}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground/70 mt-1.5 flex flex-col gap-0.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{c.change}</span>
                    <span className="leading-snug">{c.subtext}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Charts / List Split */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Chart Card */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">{ro.dashboard.salesVolume}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-md" />
                ) : !analytics?.chartData || analytics.chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                    <ShoppingBag className="h-8 w-8 mb-2 opacity-30" />
                    {ro.dashboard.noSalesData}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders List Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">{ro.dashboard.recentActivity}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
                ) : !orders || orders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    {ro.dashboard.noOrdersYet}
                  </div>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-foreground truncate">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {formatDate(order.createdAt)} • {order.items.length} {order.items.length === 1 ? ro.common.item : ro.common.items}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground tabular-nums">
                          {fmtPrice(parseFloat(order.totalAmount))}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-semibold px-1.5 py-0 border mt-1 ${
                            STATUS_BADGE_STYLES[order.status]
                          }`}
                        >
                          {ro.statuses[order.status]}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
