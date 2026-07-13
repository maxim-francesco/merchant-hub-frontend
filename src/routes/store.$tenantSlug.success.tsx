import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShoppingBag, Loader2 } from "lucide-react";
import { z } from "zod";
import { resolveTenant, type ResolvedTenant } from "@/lib/api/storefront";
import { useTenantStore } from "@/lib/store/tenantStore";
import { ro } from "@/lib/i18n/ro";

const successSearchSchema = z.object({
  order_id: z.string().optional(),
});

export const Route = createFileRoute("/store/$tenantSlug/success")({
  validateSearch: (search) => successSearchSchema.parse(search),
  component: SuccessPage,
});

function SuccessPage() {
  const { tenantSlug } = Route.useParams();
  const { order_id } = Route.useSearch();

  const [tenant, setTenant] = useState<ResolvedTenant | null>(
    useTenantStore.getState().activeStorefrontTenant
  );
  const [resolving, setResolving] = useState(!tenant);

  useEffect(() => {
    if (tenant) return;
    async function load() {
      try {
        const resolved = await resolveTenant(tenantSlug);
        setTenant(resolved);
      } catch (e) {
        console.error("Failed to resolve tenant on success page", e);
      } finally {
        setResolving(false);
      }
    }
    load();
  }, [tenantSlug, tenant]);

  if (resolving) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50/50 text-stone-900 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-stone-600 mb-4" />
        <p className="text-sm font-medium tracking-wide text-stone-500 uppercase animate-pulse">
          {ro.storefront.loadingConfirmation}
        </p>
      </div>
    );
  }

  const storeName = tenant?.name || "Luxe Fashion";

  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-900 font-sans flex flex-col justify-between selection:bg-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200/60 bg-white/80 backdrop-blur-md px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <Link to="/store/$tenantSlug" params={{ tenantSlug }} className="text-lg font-bold tracking-widest uppercase">
            {storeName}
          </Link>
          <span className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">
            {ro.storefront.checkoutSuccess}
          </span>
        </div>
      </header>

      {/* Main Success Area */}
      <main className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-8 flex-1 justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-100/60 scale-150 animate-ping opacity-30" />
          <div className="relative h-20 w-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-10 w-10" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl uppercase">
            {ro.storefront.thankYou}
          </h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            {ro.storefront.thankYouDesc}
          </p>
        </div>

        {order_id && (
          <div className="w-full max-w-sm border border-stone-200/60 rounded-xl bg-white p-5 text-left space-y-3 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
              {ro.storefront.txDetails}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-stone-400 font-mono">{ro.storefront.orderRefLabel}</span>
              <span className="text-xs font-semibold font-mono text-stone-850 break-all select-all bg-stone-50 border border-stone-150/60 p-2 rounded">
                {order_id}
              </span>
            </div>
            <div className="text-[10px] text-stone-400/80 pt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {ro.storefront.securedStripe}
            </div>
          </div>
        )}

        <div className="pt-4">
          <Link
            to="/store/$tenantSlug"
            params={{ tenantSlug }}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-3.5 text-xs font-semibold text-white uppercase tracking-wider transition-all hover:bg-stone-800 active:scale-[0.98] shadow-sm hover:shadow"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            {ro.storefront.continueShopping}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/60 bg-white py-12 px-6 text-center text-xs text-stone-400">
        <p className="font-semibold text-stone-500 uppercase tracking-widest text-[9px]">
          {storeName} POS Storefront
        </p>
        <p className="mt-1">Secure payment confirmation page.</p>
      </footer>
    </div>
  );
}
