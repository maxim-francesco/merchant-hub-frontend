import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Settings2, Globe, Shield, Wallet, AlertCircle } from "lucide-react";
import { fetchCurrentTenant, updateTenant } from "@/lib/api/tenant";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: ro.settings.headTitle }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();

  // Query tenant settings
  const { data: tenant, isLoading, isError, error } = useQuery({
    queryKey: ["tenant"],
    queryFn: fetchCurrentTenant,
  });

  // Local Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [enableB2B, setEnableB2B] = useState(false);
  const [enableB2C, setEnableB2C] = useState(false);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [deleteSecretKey, setDeleteSecretKey] = useState(false);
  const [deleteWebhookSecret, setDeleteWebhookSecret] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Sync state once fetched
  useEffect(() => {
    if (tenant) {
      setName(tenant.name || "");
      setSlug(tenant.slug || "");
      setEnableB2B(tenant.settings?.enableB2B ?? false);
      setEnableB2C(tenant.settings?.enableB2C ?? false);
      setStripeSecretKey("");
      setStripeWebhookSecret("");
      setDeleteSecretKey(false);
      setDeleteWebhookSecret(false);
    }
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(ro.validation.storeNameRequired);
      return;
    }
    if (!slug.trim()) {
      toast.error(ro.validation.storeSlugRequired);
      return;
    }

    setIsSaving(true);
    try {
      const settingsPayload: Record<string, any> = {
        enableB2B,
        enableB2C,
      };

      if (stripeSecretKey.trim()) {
        settingsPayload.stripeSecretKey = stripeSecretKey.trim();
      } else if (deleteSecretKey) {
        settingsPayload.stripeSecretKey = "";
      }

      if (stripeWebhookSecret.trim()) {
        settingsPayload.stripeWebhookSecret = stripeWebhookSecret.trim();
      } else if (deleteWebhookSecret) {
        settingsPayload.stripeWebhookSecret = "";
      }

      await updateTenant({
        name: name.trim(),
        slug: slug.trim(),
        settings: settingsPayload,
      });

      // Refetch
      await queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success(ro.settings.updatedSuccess);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ro.settings.title}</h1>
          <p className="text-sm text-muted-foreground">{ro.settings.subtitle}</p>
        </div>

        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
            <span>{getErrorMessage(error)}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-6">
            <Card className="border-border/60">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid gap-6">
            {/* 1. General Profile Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground/80">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">{ro.settings.profileTitle}</CardTitle>
                  <CardDescription className="text-xs">{ro.settings.profileDesc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-5">
                <div className="grid gap-2">
                  <Label htmlFor="store-name" className="text-xs font-semibold text-muted-foreground">{ro.settings.storeName}</Label>
                  <Input
                    id="store-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={ro.settings.storeNamePlaceholder}
                    className="h-11 border-border/70 text-sm"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store-slug" className="text-xs font-semibold text-muted-foreground">{ro.settings.storeSlug}</Label>
                  <div className="flex">
                    <Input
                      id="store-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder={ro.settings.storeSlugPlaceholder}
                      className="h-11 border-border/70 text-sm rounded-r-none font-mono"
                      required
                    />
                    <span className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-border/70 bg-muted/30 text-xs text-muted-foreground font-medium">
                      .commerceos.ro
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Business Configuration Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground/80">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">{ro.settings.configTitle}</CardTitle>
                  <CardDescription className="text-xs">{ro.settings.configDesc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border/50 pt-1">
                {/* B2C Switch */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="enable-b2c" className="text-sm font-semibold text-foreground">{ro.settings.enableB2C}</Label>
                    <span className="text-xs text-muted-foreground max-w-lg">
                      {ro.settings.enableB2CDesc}
                    </span>
                  </div>
                  <Switch
                    id="enable-b2c"
                    checked={enableB2C}
                    onCheckedChange={setEnableB2C}
                  />
                </div>

                {/* B2B Switch */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="enable-b2b" className="text-sm font-semibold text-foreground">{ro.settings.enableB2B}</Label>
                    <span className="text-xs text-muted-foreground max-w-lg">
                      {ro.settings.enableB2BDesc}
                    </span>
                  </div>
                  <Switch
                    id="enable-b2b"
                    checked={enableB2B}
                    onCheckedChange={setEnableB2B}
                  />
                </div>

                {/* Monedă (Fixă RON) */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-sm font-semibold text-foreground">{ro.settings.currencyLabel}</Label>
                    <span className="text-xs text-muted-foreground max-w-lg">
                      Toate tranzacțiile și plățile din sistem sunt procesate exclusiv în RON (Lei românești).
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold bg-muted px-3 py-1.5 rounded border border-border">
                    RON
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Payment Integration Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground/80">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">{ro.settings.stripeTitle}</CardTitle>
                  <CardDescription className="text-xs">{ro.settings.stripeDesc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-5">
                {/* Stripe Secret Key */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stripe-secret-key" className="text-xs font-semibold text-muted-foreground">
                      {ro.settings.stripeSecretKey}
                    </Label>
                    {tenant?.settings?.stripeSecretKeyLast4 && !deleteSecretKey && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleteSecretKey(true);
                          setStripeSecretKey("");
                        }}
                      >
                        {ro.settings.stripeDeleteKey}
                      </Button>
                    )}
                  </div>
                  <Input
                    id="stripe-secret-key"
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => {
                      setStripeSecretKey(e.target.value);
                      if (deleteSecretKey) setDeleteSecretKey(false);
                    }}
                    placeholder={
                      tenant?.settings?.stripeSecretKeyLast4 && !deleteSecretKey
                        ? `•••• ${tenant.settings.stripeSecretKeyLast4}`
                        : ro.settings.stripeSecretKeyPlaceholder
                    }
                    className="h-11 border-border/70 font-mono text-sm"
                  />
                  {deleteSecretKey && (
                    <p className="text-[11px] text-destructive font-medium">
                      Cheia va fi ștearsă la salvare.
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ro.settings.stripeSecretKeyNote}
                  </p>
                </div>

                {/* Stripe Webhook Secret */}
                <div className="grid gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stripe-webhook-secret" className="text-xs font-semibold text-muted-foreground">
                      {ro.settings.stripeWebhookSecret}
                    </Label>
                    {tenant?.settings?.stripeWebhookSecretLast4 && !deleteWebhookSecret && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleteWebhookSecret(true);
                          setStripeWebhookSecret("");
                        }}
                      >
                        {ro.settings.stripeDeleteKey}
                      </Button>
                    )}
                  </div>
                  <Input
                    id="stripe-webhook-secret"
                    type="password"
                    value={stripeWebhookSecret}
                    onChange={(e) => {
                      setStripeWebhookSecret(e.target.value);
                      if (deleteWebhookSecret) setDeleteWebhookSecret(false);
                    }}
                    placeholder={
                      tenant?.settings?.stripeWebhookSecretLast4 && !deleteWebhookSecret
                        ? `•••• ${tenant.settings.stripeWebhookSecretLast4}`
                        : ro.settings.stripeWebhookSecretPlaceholder
                    }
                    className="h-11 border-border/70 font-mono text-sm"
                  />
                  {deleteWebhookSecret && (
                    <p className="text-[11px] text-destructive font-medium">
                      Secretul va fi șters la salvare.
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ro.settings.stripeWebhookSecretNote}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3 mt-2">
              <Button type="submit" disabled={isSaving} className="h-11 px-8 font-medium">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {ro.settings.saving}
                  </>
                ) : (
                  ro.common.saveChanges
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
