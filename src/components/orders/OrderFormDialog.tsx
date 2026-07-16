import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProducts } from "@/lib/api/catalog";
import {
  createOrder,
  updateOrder,
  type Order,
  type OrderInput,
} from "@/lib/api/orders";
import { useTenantStore } from "@/lib/store/tenantStore";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";

export interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialOrder?: Order;
  onSuccess?: (order: Order) => void;
}

interface FormItem {
  productId: string;
  quantity: number;
}

function fmtPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
  }).format(num);
}

export function OrderFormDialog({
  open,
  onOpenChange,
  mode,
  initialOrder,
  onSuccess,
}: OrderFormDialogProps) {
  const queryClient = useQueryClient();
  const activeAdminTenant = useTenantStore((s) => s.activeAdminTenant);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerType, setCustomerType] = useState<"B2C" | "B2B">("B2C");
  const [companyName, setCompanyName] = useState("");
  const [cui, setCui] = useState("");
  const [regCom, setRegCom] = useState("");
  const [items, setItems] = useState<FormItem[]>([{ productId: "", quantity: 1 }]);

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", activeAdminTenant?.id],
    queryFn: fetchProducts,
    enabled: !!activeAdminTenant?.id,
  });

  // Prefill on open
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialOrder) {
        setCustomerName(initialOrder.customerName || "");
        setCustomerEmail(initialOrder.customerEmail || "");
        setPhone(initialOrder.phone || "");
        setDeliveryAddress(initialOrder.deliveryAddress || "");
        setCustomerType(initialOrder.customerType || "B2C");
        setCompanyName(initialOrder.companyName || "");
        setCui(initialOrder.cui || "");
        setRegCom(initialOrder.regCom || "");
        setItems(
          initialOrder.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          }))
        );
      } else {
        setCustomerName("");
        setCustomerEmail("");
        setPhone("");
        setDeliveryAddress("");
        setCustomerType("B2C");
        setCompanyName("");
        setCui("");
        setRegCom("");
        setItems([{ productId: "", quantity: 1 }]);
      }
    }
  }, [open, mode, initialOrder]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(ro.orders.orderCreated);
      onOpenChange(false);
      if (onSuccess) onSuccess(newOrder);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: OrderInput) => {
      if (!initialOrder) throw new Error("No initial order to update");
      return updateOrder(initialOrder.id, payload);
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (initialOrder) {
        queryClient.invalidateQueries({ queryKey: ["order", initialOrder.id] });
      }
      toast.success(ro.orders.orderUpdated);
      onOpenChange(false);
      if (onSuccess) onSuccess(updatedOrder);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, fields: Partial<FormItem>) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, ...fields } : item))
    );
  };

  // Get available products (disabling already selected ones)
  const getAvailableProductsForIndex = (currentIndex: number) => {
    const selectedOtherIds = items
      .filter((_, idx) => idx !== currentIndex)
      .map((item) => item.productId)
      .filter(Boolean);

    return products.map((p) => ({
      ...p,
      disabled: selectedOtherIds.includes(p.id),
    }));
  };

  // Compute live preview total
  const previewTotal = items.reduce((acc, item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) return acc;
    return acc + parseFloat(prod.price) * item.quantity;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error(ro.validation.checkoutDetailsRequired);
      return;
    }

    if (customerType === "B2B" && (!companyName.trim() || !cui.trim())) {
      toast.error(ro.validation.b2bFieldsRequired);
      return;
    }

    // Filter out items without selected product ID
    const validItems = items.filter((item) => item.productId);
    if (validItems.length === 0) {
      toast.error(ro.orders.noItemsYet);
      return;
    }

    const trimmedPhone = phone.trim();
    const trimmedAddress = deliveryAddress.trim();

    if (mode === "create") {
      if (!trimmedPhone) {
        toast.error("Numărul de telefon este obligatoriu.");
        return;
      }
      if (trimmedPhone.length < 7) {
        toast.error("Phone number is too short.");
        return;
      }
      if (trimmedPhone.length > 30) {
        toast.error("Phone number is too long.");
        return;
      }
      if (!/^[0-9+()\s-]+$/.test(trimmedPhone)) {
        toast.error("Phone number contains invalid characters.");
        return;
      }

      if (!trimmedAddress) {
        toast.error("Adresa de livrare este obligatorie.");
        return;
      }
      if (trimmedAddress.length < 5) {
        toast.error("Delivery address is too short.");
        return;
      }
      if (trimmedAddress.length > 250) {
        toast.error("Delivery address is too long.");
        return;
      }
    } else {
      // mode === "edit"
      if (trimmedPhone !== "") {
        if (trimmedPhone.length < 7) {
          toast.error("Phone number is too short.");
          return;
        }
        if (trimmedPhone.length > 30) {
          toast.error("Phone number is too long.");
          return;
        }
        if (!/^[0-9+()\s-]+$/.test(trimmedPhone)) {
          toast.error("Phone number contains invalid characters.");
          return;
        }
      }

      if (trimmedAddress !== "") {
        if (trimmedAddress.length < 5) {
          toast.error("Delivery address is too short.");
          return;
        }
        if (trimmedAddress.length > 250) {
          toast.error("Delivery address is too long.");
          return;
        }
      }
    }

    const payload: OrderInput = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerType,
      companyName: customerType === "B2B" ? companyName.trim() : undefined,
      cui: customerType === "B2B" ? cui.trim() : undefined,
      regCom: customerType === "B2B" && regCom.trim() ? regCom.trim() : undefined,
      phone: trimmedPhone !== "" ? trimmedPhone : undefined,
      deliveryAddress: trimmedAddress !== "" ? trimmedAddress : undefined,
      items: validItems,
    };

    if (mode === "create") {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {mode === "create" ? ro.orders.newOrder : ro.orders.editOrder}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
          {/* Client Type Segmented Control */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              {ro.orders.clientType}
            </Label>
            <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setCustomerType("B2C")}
                className={`h-8 rounded-md text-xs font-medium transition-all ${
                  customerType === "B2C"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ro.orders.b2cLabel}
              </button>
              <button
                type="button"
                onClick={() => setCustomerType("B2B")}
                className={`h-8 rounded-md text-xs font-medium transition-all ${
                  customerType === "B2B"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ro.orders.b2bLabel}
              </button>
            </div>
          </div>

          {/* Customer details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="customerName" className="text-xs font-semibold">
                {ro.orders.custName} *
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={ro.orders.custNamePlaceholder}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="customerEmail" className="text-xs font-semibold">
                {ro.orders.custEmail} *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder={ro.orders.custEmailPlaceholder}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Telefon {mode === "create" && "*"}
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex. 0740123456"
                required={mode === "create"}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deliveryAddress" className="text-xs font-semibold">
                Adresă de livrare {mode === "create" && "*"}
              </Label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="ex. Strada Florilor 12, Cluj-Napoca"
                required={mode === "create"}
              />
            </div>
          </div>

          {/* B2B fields */}
          {customerType === "B2B" && (
            <div className="space-y-4 p-4 border border-border/80 rounded-lg bg-muted/20 animate-in fade-in duration-250">
              <div className="grid gap-1.5">
                <Label htmlFor="companyName" className="text-xs font-semibold">
                  {ro.orders.company} *
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ex. Alpha SRL"
                  required={customerType === "B2B"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="cui" className="text-xs font-semibold">
                    {ro.orders.cui} *
                  </Label>
                  <Input
                    id="cui"
                    value={cui}
                    onChange={(e) => setCui(e.target.value)}
                    placeholder="ex. RO12345678"
                    required={customerType === "B2B"}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="regCom" className="text-xs font-semibold">
                    {ro.orders.regCom}
                  </Label>
                  <Input
                    id="regCom"
                    value={regCom}
                    onChange={(e) => setRegCom(e.target.value)}
                    placeholder="ex. J40/123/2020"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {ro.orders.purchasedItems}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-8 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                {ro.orders.addProduct}
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                {ro.orders.noItemsYet}
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => {
                  const availableProducts = getAvailableProductsForIndex(index);
                  return (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1 min-w-0">
                        <Select
                          value={item.productId}
                          onValueChange={(val) =>
                            handleUpdateItem(index, { productId: val })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={ro.orders.selectProduct} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingProducts ? (
                              <SelectItem value="loading" disabled>
                                {ro.common.loading}
                              </SelectItem>
                            ) : (
                              availableProducts.map((p) => (
                                <SelectItem
                                  key={p.id}
                                  value={p.id}
                                  disabled={p.disabled}
                                >
                                  {p.name} ({fmtPrice(p.price)})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(index, {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          placeholder={ro.orders.qty}
                          className="w-full text-center"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Preview */}
          <div className="border-t border-border pt-4 mt-4 space-y-1.5">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>{ro.orders.total} (Preview)</span>
              <span>{fmtPrice(previewTotal)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground italic text-right">
              * {ro.orders.totalServerNote}
            </p>
          </div>
        </form>

        <DialogFooter className="border-t border-border pt-4 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {ro.common.cancel}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {ro.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
