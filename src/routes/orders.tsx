import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  SlidersHorizontal,
  Package,
  Calendar,
  User,
  Hash,
  ShoppingBag,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { fetchOrders, downloadOrderInvoice, updateOrderStatus, type Order } from "@/lib/api/orders";
import { useTenantStore } from "@/lib/store/tenantStore";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: ro.orders.headTitle }] }),
  component: OrdersPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusBadgeStyles: Record<Order["status"], string> = {
  PENDING: "bg-muted/80 text-muted-foreground border-border/80",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30",
  SHIPPED: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30",
  CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30",
};

// ─── Skeleton Loading ────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="pl-5"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
          <TableCell className="pr-5"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Orders Page Component ────────────────────────────────────────────────────

function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) =>
      updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSelectedOrder(updatedOrder);
      toast.success(ro.orders.statusUpdated);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      setDownloadingInvoiceId(orderId);
      await downloadOrderInvoice(orderId);
    } catch (err) {
      console.error("Failed to download invoice", err);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const activeAdminTenant = useTenantStore((s) => s.activeAdminTenant);

  const {
    data: orders,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders", activeAdminTenant?.id],
    queryFn: fetchOrders,
    staleTime: 30_000,
    enabled: !!activeAdminTenant?.id,
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ro.orders.title}</h1>
          <p className="text-sm text-muted-foreground">
            {ro.orders.subtitle}{" "}
            {orders && !isLoading && (
              <span className="text-muted-foreground/60">
                {orders.length} {orders.length === 1 ? ro.common.order : ro.common.orders}
              </span>
            )}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder={ro.orders.searchPlaceholder}
              className="pl-9 h-10 bg-background border-border/70 focus-visible:ring-1"
            />
          </div>
          <Button variant="outline" className="h-10 gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4" />
            {ro.orders.filters}
          </Button>
        </div>

        {/* Error banner */}
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-px shrink-0" />
            <span>
              {getErrorMessage(error)}
            </span>
          </div>
        )}

        {/* Data Table */}
        <Card className="overflow-hidden border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
                    <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground pl-5 py-3 w-[140px]">
                      {ro.orders.tableId}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3 w-[180px]">
                      {ro.orders.tableDate}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3">
                      {ro.orders.tableCustomer}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3 text-right">
                      {ro.orders.tableTotal}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3 pr-5 w-[140px]">
                      {ro.orders.tableStatus}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeletons */}
                  {isLoading && <SkeletonRows />}

                  {/* Orders rows */}
                  {orders?.map((order) => (
                    <TableRow
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="group border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-3.5 pl-5 font-mono text-xs font-semibold text-foreground/80">
                        {order.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="py-3.5 text-sm text-muted-foreground/90 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {order.customerName}
                          </span>
                          <span className="text-xs text-muted-foreground/60 truncate max-w-[220px]">
                            {order.customerEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-right font-medium text-sm tabular-nums">
                        {fmtPrice(order.totalAmount)}
                      </TableCell>
                      <TableCell className="py-3.5 pr-5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 border ${
                            statusBadgeStyles[order.status]
                          }`}
                        >
                          {ro.statuses[order.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {!isLoading && !isError && orders?.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <ShoppingBag className="h-8 w-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">{ro.orders.noOrders}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {ro.orders.noOrdersDesc}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Side panel Sheet to view specific order details ── */}
      <Sheet open={selectedOrder !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-md border-l border-border/80 p-6 flex flex-col gap-6 h-full overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="text-left space-y-1.5 border-b border-border/50 pb-5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono bg-muted/60 text-muted-foreground px-2 py-0.5 rounded border border-border/60">
                      #{selectedOrder.id.slice(0, 8).toUpperCase()}
                    </span>
                    {selectedOrder.customerType === "B2B" && (
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-blue-50/50 text-blue-700 border-blue-200">
                        B2B
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(val) => statusMutation.mutate({ id: selectedOrder.id, status: val as Order["status"] })}
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-[11px] font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const).map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {ro.statuses[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {statusMutation.isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                <SheetTitle className="text-xl font-bold tracking-tight mt-3">{ro.orders.detailsTitle}</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {ro.orders.detailsDesc}
                </SheetDescription>
              </SheetHeader>

              {/* Customer Info Card */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> {ro.orders.customerInfo}
                </h3>
                <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3 shadow-sm text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ro.orders.custName}</span>
                    <span className="font-medium text-foreground">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ro.orders.custEmail}</span>
                    <span className="font-medium text-foreground truncate max-w-[200px]">{selectedOrder.customerEmail}</span>
                  </div>
                  {selectedOrder.customerType === "B2B" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{ro.orders.company}</span>
                        <span className="font-medium text-foreground truncate max-w-[200px]">{selectedOrder.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{ro.orders.cui}</span>
                        <span className="font-medium text-foreground">{selectedOrder.cui}</span>
                      </div>
                      {selectedOrder.regCom && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{ro.orders.regCom}</span>
                          <span className="font-medium text-foreground">{selectedOrder.regCom}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{ro.orders.placedAt}</span>
                    <span className="font-medium text-foreground">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items Section */}
              <div className="flex flex-col gap-3 flex-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> {ro.orders.purchasedItems} ({selectedOrder.items.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product?.name || ro.orders.deletedProduct}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.quantity} × {fmtPrice(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {fmtPrice(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order summary footer */}
              <div className="border-t border-border/60 pt-5 mt-auto space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">{ro.orders.subtotal}</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {fmtPrice(selectedOrder.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/30 pt-3">
                  <span className="text-base font-semibold text-foreground">{ro.orders.total}</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {fmtPrice(selectedOrder.totalAmount)}
                  </span>
                </div>
                
                <Button
                  onClick={() => handleDownloadInvoice(selectedOrder.id)}
                  disabled={downloadingInvoiceId === selectedOrder.id}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl"
                  variant="outline"
                >
                  {downloadingInvoiceId === selectedOrder.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {downloadingInvoiceId === selectedOrder.id ? ro.orders.generatingPdf : ro.orders.downloadInvoice}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
