import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Loader2,
  SlidersHorizontal,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchStorefrontProducts,
  fetchStorefrontCategories,
  submitCheckout,
  resolveTenant,
  type StorefrontProduct,
} from "@/lib/api/storefront";
import { useTenantStore } from "@/lib/store/tenantStore";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";

export const Route = createFileRoute("/store/$tenantSlug")({
  head: ({ params }) => ({ meta: [{ title: `${params.tenantSlug || ro.storefront.headTitle} — Storefront` }] }),
  component: StorefrontPage,
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

interface CartItem {
  product: StorefrontProduct;
  quantity: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────

function StorefrontPage() {
  const { tenantSlug } = Route.useParams();
  const queryClient = useQueryClient();

  const activeTenant = useTenantStore((s) => s.activeStorefrontTenant);
  const setActiveTenant = useTenantStore((s) => s.setActiveStorefrontTenant);

  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout states
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Active category filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ─── Resolve Tenant on Mount or Slug Change ─────────────────────────────────
  useEffect(() => {
    let active = true;
    async function init() {
      if (!tenantSlug) return;
      try {
        setResolving(true);
        setResolveError(null);
        const resolved = await resolveTenant(tenantSlug);
        if (active) {
          setActiveTenant(resolved);
          setResolving(false);
        }
      } catch (err: any) {
        if (active) {
          setResolveError(getErrorMessage(err));
          setResolving(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [tenantSlug, setActiveTenant]);

  // Fetch public catalog - ONLY enabled after tenant is resolved
  const { data: products, isLoading: isLoadingProds } = useQuery({
    queryKey: ["storefront-products", activeTenant?.id],
    queryFn: fetchStorefrontProducts,
    enabled: !!activeTenant?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ["storefront-categories", activeTenant?.id],
    queryFn: fetchStorefrontCategories,
    enabled: !!activeTenant?.id,
  });

  // Cart operations
  const addToCart = (product: StorefrontProduct) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success(`${product.name} ${ro.storefront.addToCartSuccess}`);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    toast.error(ro.storefront.itemRemoved);
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + parseFloat(item.product.price) * item.quantity,
    0
  );

  // Handle Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error(ro.validation.checkoutDetailsRequired);
      return;
    }
    if (cart.length === 0) {
      toast.error(ro.validation.cartEmpty);
      return;
    }

    setIsCheckingOut(true);
    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const response = await submitCheckout({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        items: itemsPayload,
      });

      toast.success(ro.storefront.redirectingPayment);

      // Clear the local cart before redirecting
      setCart([]);

      // Redirect the user to the Stripe Checkout page
      window.location.href = response.url;
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products?.filter((p) => p.category.slug === selectedCategory)
    : products;

  // ─── Loading Screen ─────────────────────────────────────────────────────────
  if (resolving) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50/50 text-stone-900 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-stone-600 mb-4" />
        <p className="text-sm font-medium tracking-wide text-stone-500 uppercase animate-pulse">
          {ro.storefront.resolving}
        </p>
      </div>
    );
  }

  // ─── Error Screen ───────────────────────────────────────────────────────────
  if (resolveError || !activeTenant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50/50 text-stone-900 font-sans px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight mb-3">{ro.storefront.notFoundTitle}</h1>
          <p className="text-sm text-stone-500 mb-6" dangerouslySetInnerHTML={{ __html: ro.storefront.notFoundDesc.replace("{slug}", tenantSlug || "") }} />
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-850"
          >
            {ro.storefront.goToAdmin}
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Storefront Page ───
  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-900 font-sans selection:bg-stone-200">
      {/* ── Minimal Storefront Header ── */}
      <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-white/80 backdrop-blur-md px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <Link to="/store/$tenantSlug" params={{ tenantSlug: activeTenant.slug }} className="text-lg font-bold tracking-widest uppercase">
            {activeTenant.name}
          </Link>
          <span className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">
            {ro.storefront.posLabel}
          </span>
        </div>

        {/* Shopping Cart Drawer Toggle */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative h-10 px-4 rounded-full border-stone-200 hover:bg-stone-50 transition-colors"
            >
              <ShoppingBag className="h-4 w-4 mr-2" strokeWidth={2} />
              <span className="font-semibold text-xs">{ro.storefront.cartLabel}</span>
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white tabular-nums ring-4 ring-white">
                  {totalCartItems}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="sm:max-w-md border-l border-stone-200/60 p-6 flex flex-col h-full bg-white">
            <SheetHeader className="text-left space-y-1.5 border-b border-stone-200/60 pb-5">
              <SheetTitle className="text-lg font-semibold tracking-wide uppercase">
                {ro.storefront.cartTitle}
              </SheetTitle>
            </SheetHeader>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-stone-400 py-16">
                  <ShoppingBag className="h-8 w-8 mb-3 opacity-30 text-stone-900" />
                  <p className="text-sm font-medium">{ro.storefront.cartEmpty}</p>
                  <p className="text-xs mt-1 text-stone-400/80">
                    {ro.storefront.cartEmptyDesc}
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3 border border-stone-150 rounded-xl bg-stone-50/50 hover:bg-stone-50 transition-colors"
                  >
                    <div className="grid h-16 w-16 place-items-center rounded-lg bg-stone-100 border border-stone-200 text-stone-400">
                      <Package className="h-6 w-6 opacity-40 text-stone-900" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5 uppercase tracking-wide">
                          {item.product.category.name}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {/* Qty adjustments */}
                        <div className="flex items-center border border-stone-200 rounded-md bg-white">
                          <button
                            onClick={() => updateQty(item.product.id, -1)}
                            className="p-1 text-stone-500 hover:text-stone-900"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-2 text-xs font-semibold tabular-nums text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.product.id, 1)}
                            className="p-1 text-stone-500 hover:text-stone-900"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {/* Price */}
                        <span className="text-xs font-bold text-stone-850 tabular-nums">
                          {fmtPrice(parseFloat(item.product.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-fit text-stone-400 hover:text-stone-900 mt-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer / Checkout Form */}
            {cart.length > 0 && (
              <div className="border-t border-stone-200/60 pt-5 mt-auto space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold text-stone-850 pb-2">
                  <span>{ro.storefront.subtotal}</span>
                  <span className="text-base font-bold text-stone-900 tabular-nums">
                    {fmtPrice(cartSubtotal)}
                  </span>
                </div>

                <form onSubmit={handleCheckout} className="space-y-3">
                  <div className="grid gap-1">
                    <Label htmlFor="cust-name" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {ro.storefront.custName}
                    </Label>
                    <Input
                      id="cust-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={ro.storefront.custNamePlaceholder}
                      className="h-10 border-stone-200 text-xs bg-stone-50/30"
                      required
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="cust-email" className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {ro.storefront.custEmail}
                    </Label>
                    <Input
                      id="cust-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={ro.storefront.custEmailPlaceholder}
                      className="h-10 border-stone-200 text-xs bg-stone-50/30"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isCheckingOut}
                    className="h-11 w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {ro.storefront.processing}
                      </>
                    ) : (
                      ro.storefront.checkoutBtn
                    )}
                  </Button>
                </form>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </header>

      {/* ── Main Catalog View ── */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-10 flex flex-col gap-8">
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/60 pb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="h-9 px-4 rounded-full text-xs font-semibold"
            >
              {ro.storefront.allCollection}
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.slug)}
                className="h-9 px-4 rounded-full text-xs font-semibold"
              >
                {cat.name}
              </Button>
            ))}
          </div>
          <div className="text-xs text-stone-400 flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="h-4 w-4" /> {ro.storefront.filters}
          </div>
        </div>

        {/* Success Modal / Banner */}
        {checkoutSuccess && (
          <div className="flex flex-col items-center justify-center p-12 border border-emerald-100 rounded-2xl bg-emerald-50/40 text-center max-w-xl mx-auto my-6 animate-in fade-in zoom-in-95">
            <CheckCircle className="h-12 w-12 text-emerald-600 mb-4" />
            <h2 className="text-lg font-bold text-stone-900 tracking-wide uppercase">
              {ro.storefront.orderSuccessTitle}
            </h2>
            <p className="text-xs text-stone-500 mt-2 max-w-sm">
              {ro.storefront.orderSuccessDesc}
            </p>
            {createdOrderId && (
              <p className="text-[10px] font-mono bg-emerald-100/50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded mt-4">
                {ro.storefront.orderRef.replace("{id}", createdOrderId.slice(0, 8).toUpperCase())}
              </p>
            )}
            <Button
              onClick={() => setCheckoutSuccess(false)}
              className="mt-6 h-10 px-6 rounded-full bg-stone-900 hover:bg-stone-850 text-xs font-semibold text-white uppercase"
            >
              {ro.storefront.continueShopping}
            </Button>
          </div>
        )}

        {/* Product Grid */}
        {!checkoutSuccess && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingProds ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-80 w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))
            ) : filteredProducts?.length === 0 ? (
              <div className="col-span-full py-16 text-center text-stone-400">
                {ro.storefront.noProducts}
              </div>
            ) : (
              filteredProducts?.map((product) => {
                // Extract first attribute for subtitle
                const attrs = Object.entries(product.attributes).find(
                  ([k]) => k !== "inStock" && k !== "tags"
                );
                const attrText = attrs
                  ? `${attrs[0].charAt(0).toUpperCase() + attrs[0].slice(1)}: ${attrs[1]}`
                  : null;

                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between bg-white border border-stone-200/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:border-stone-300/40"
                  >
                    {/* Visual Card surface */}
                    <div className="relative w-full aspect-square rounded-xl bg-stone-100/60 overflow-hidden flex items-center justify-center text-stone-400 border border-stone-100">
                      <Package className="h-10 w-10 opacity-30 text-stone-900 group-hover:scale-105 transition-transform duration-300" />
                      <Badge
                        variant="secondary"
                        className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-stone-200/60 text-[10px] font-normal"
                      >
                        {product.category.name}
                      </Badge>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                          <h3 className="text-sm font-bold text-stone-900 truncate">
                            {product.name}
                          </h3>
                          {attrText && (
                            <p className="text-xs text-stone-400 mt-0.5">
                              {attrText}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-stone-850 tabular-nums">
                          {fmtPrice(product.price)}
                        </span>
                      </div>

                      <Button
                        onClick={() => addToCart(product)}
                        className="h-10 w-full bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        {ro.storefront.addToCart}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-200/60 bg-white py-12 px-6 text-center text-xs text-stone-400 mt-20">
        <p className="font-semibold text-stone-500 uppercase tracking-widest text-[9px]">
          {activeTenant.name} {ro.storefront.posLabel}
        </p>
        <p className="mt-1">{ro.storefront.connectedApi}</p>
      </footer>
    </div>
  );
}
