import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Truck, FileText, Pencil } from "lucide-react";
import { fetchOrderById, updateOrderStatus, downloadOrderInvoice, type Order } from "@/lib/api/orders";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";
import { toast } from "sonner";
import { STATUS_BADGE_STYLES, isEditable, nextStatuses } from "@/lib/orderStatus";
import { useMyRole } from "@/lib/hooks/useMyRole";
import { OrderFormDialog } from "@/components/orders/OrderFormDialog";

export const Route = createFileRoute("/orders/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id.slice(0, 8).toUpperCase()} — ${ro.orders.headTitleSingle}` }] }),
  component: OrderDetail,
});

// Shared status badge styles are imported from lib/orderStatus

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

function OrderDetail() {
  const { isPrivileged } = useMyRole();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: order, isLoading, error, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrderById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: Order["status"]) => updateOrderStatus(id, newStatus),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(ro.orders.statusUpdated);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setDownloadingInvoice(true);
      await downloadOrderInvoice(order.id);
    } catch (err) {
      console.error("Failed to download invoice", err);
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
            <Link to="/orders">
              <ArrowLeft className="h-4 w-4 mr-1" /> {ro.orders.backToOrders}
            </Link>
          </Button>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-60" />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError || !order) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{ro.orders.orderNotFound}</p>
          {error && (
            <p className="text-xs text-muted-foreground/60 mt-2">
              {getErrorMessage(error)}
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link to="/orders">{ro.orders.backToOrders}</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link to="/orders">
            <ArrowLeft className="h-4 w-4 mr-1" /> {ro.orders.backToOrders}
          </Link>
        </Button>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                {order.id.slice(0, 8).toUpperCase()}
              </h1>
              <Badge variant="outline" className={STATUS_BADGE_STYLES[order.status]}>
                {ro.statuses[order.status] ?? order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {ro.orders.placedOn} {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {(() => {
              const allowedNext = nextStatuses(order.status);
              const isTerminal = allowedNext.length === 0;
              if (isTerminal) {
                return (
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-md border border-border/80">
                    {ro.statuses[order.status] ?? order.status} ({ro.orders.finalState})
                  </span>
                );
              }
              return (
                <Select
                  value={order.status}
                  onValueChange={(val) => statusMutation.mutate(val as Order["status"])}
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder={ro.orders.changeStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={order.status} disabled>
                      {ro.statuses[order.status] ?? order.status}
                    </SelectItem>
                    {allowedNext.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ro.statuses[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
            {statusMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {isPrivileged && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFormOpen(true)}
              disabled={!isEditable(order.status)}
              title={!isEditable(order.status) ? ro.orders.notEditableHint : undefined}
              className={!isEditable(order.status) ? "cursor-not-allowed text-muted-foreground" : ""}
            >
              <Pencil className="h-4 w-4 mr-1.5" /> {ro.orders.editOrder}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            disabled
            title={ro.orders.comingSoon}
            className="cursor-not-allowed text-muted-foreground"
          >
            <Truck className="h-4 w-4 mr-1.5" /> {ro.orders.generateAwb} (
            {ro.orders.comingSoon})
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
          >
            {downloadingInvoice ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1.5" />
            )}
            {ro.orders.downloadInvoice}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {ro.orders.purchasedItems}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
                      <tr>
                        <th className="text-left px-4 py-2.5">
                          {ro.products.tableProduct}
                        </th>
                        <th className="text-right px-4 py-2.5">{ro.orders.qty}</th>
                        <th className="text-right px-4 py-2.5">
                          {ro.orders.unit}
                        </th>
                        <th className="text-right px-4 py-2.5">
                          {ro.orders.tableTotal}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((i) => (
                        <tr key={i.id} className="border-b last:border-0">
                          <td className="px-4 py-3">
                            {i.product?.name || ro.orders.deletedProduct}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {i.quantity}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {fmtPrice(i.price)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                            {fmtPrice(i.quantity * parseFloat(i.price))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {ro.orders.subtotal}
                    </span>
                    <span>{fmtPrice(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-1.5 border-t">
                    <span>{ro.orders.total}</span>
                    <span>{fmtPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                {ro.orders.customer}
                <Badge variant="outline">{order.customerType}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {order.customerType === "B2B" ? (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {ro.orders.company}
                    </div>
                    <div className="font-medium">{order.companyName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {ro.orders.cui}
                      </div>
                      <div className="font-medium">{order.cui}</div>
                    </div>
                    {order.regCom && (
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {ro.orders.regCom}
                        </div>
                        <div className="font-medium">{order.regCom}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {ro.orders.contact}
                    </div>
                    <div>{order.customerName}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground">
                    {ro.orders.custName}
                  </div>
                  <div className="font-medium">{order.customerName}</div>
                </div>
              )}
              <div className="grid gap-1 border-t pt-2">
                <div className="text-muted-foreground text-xs">
                  {order.customerEmail}
                </div>
              </div>
              {order.phone && (
                <div className="grid gap-1 border-t pt-2">
                  <div className="text-xs text-muted-foreground">Telefon</div>
                  <div className="font-medium">{order.phone}</div>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="grid gap-1 border-t pt-2">
                  <div className="text-xs text-muted-foreground">Adresă de livrare</div>
                  <div className="font-medium">{order.deliveryAddress}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <OrderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode="edit"
        initialOrder={order}
      />
    </AdminLayout>
  );
}
