import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Truck, FileText } from "lucide-react";
import { fmtRON, orderDetails, orders, statusColor } from "@/lib/dummy-data";
import { ro } from "@/lib/i18n/ro";

export const Route = createFileRoute("/orders/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — ${ro.orders.headTitleSingle}` }] }),
  loader: ({ params }) => {
    const order = orders.find((o) => o.id === params.id);
    if (!order) throw notFound();
    const details = orderDetails[params.id] ?? orderDetails["ORD-1042"];
    return { order, details };
  },
  component: OrderDetail,
  notFoundComponent: () => (
    <AdminLayout>
      <div className="text-center py-16">
        <p className="text-muted-foreground">{ro.orders.orderNotFound}</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/orders">{ro.orders.backToOrders}</Link></Button>
      </div>
    </AdminLayout>
  ),
});

function OrderDetail() {
  const { order, details } = Route.useLoaderData() as {
    order: (typeof orders)[number];
    details: (typeof orderDetails)[string];
  };
  const subtotal = details.items.reduce((s: number, i) => s + i.qty * i.price, 0);
  const total = subtotal + details.shipping;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link to="/orders"><ArrowLeft className="h-4 w-4 mr-1" /> {ro.orders.backToOrders}</Link>
        </Button>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">{order.id}</h1>
              <Badge variant="outline" className={statusColor[order.status]}>
                {ro.statuses[order.status as keyof typeof ro.statuses] ?? order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{ro.orders.placedOn} {order.date}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm"><RefreshCw className="h-4 w-4 mr-1.5" /> {ro.orders.changeStatus}</Button>
          <Button size="sm" variant="outline"><Truck className="h-4 w-4 mr-1.5" /> {ro.orders.generateAwb}</Button>
          <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-1.5" /> {ro.orders.downloadInvoice}</Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{ro.orders.purchasedItems}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
                      <tr>
                        <th className="text-left px-4 py-2.5">{ro.products.tableProduct}</th>
                        <th className="text-right px-4 py-2.5">{ro.orders.qty}</th>
                        <th className="text-right px-4 py-2.5">{ro.orders.unit}</th>
                        <th className="text-right px-4 py-2.5">{ro.orders.tableTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.items.map((i) => (
                        <tr key={i.name} className="border-b last:border-0">
                          <td className="px-4 py-3">{i.name}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">{i.qty}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">{fmtRON(i.price)}</td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{fmtRON(i.qty * i.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{ro.orders.subtotal}</span><span>{fmtRON(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{ro.orders.shipping}</span><span>{fmtRON(details.shipping)}</span></div>
                  <div className="flex justify-between font-semibold text-base pt-1.5 border-t"><span>{ro.orders.total}</span><span>{fmtRON(total)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                {ro.orders.customer}
                <Badge variant="outline">{details.customer.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {details.customer.type === "B2B" ? (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground">{ro.orders.company}</div>
                    <div className="font-medium">{details.customer.company}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">{ro.orders.cui}</div>
                      <div className="font-medium">{details.customer.cui}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{ro.orders.regCom}</div>
                      <div className="font-medium">{details.customer.regCom}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{ro.orders.contact}</div>
                    <div>{details.customer.name}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground">{ro.orders.custName}</div>
                  <div className="font-medium">{details.customer.name}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">{ro.orders.shippingAddress}</div>
                <div>{details.customer.address}</div>
              </div>
              <div className="grid gap-1">
                <div className="text-muted-foreground text-xs">{details.customer.email}</div>
                <div className="text-muted-foreground text-xs">{details.customer.phone}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
