import apiClient from "./client";



// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface TenantSettings {
  currency?: string;
  timezone?: string;
  billingMode?: "B2B" | "B2C" | "BOTH";
  enableB2B?: boolean;
  enableB2C?: boolean;
  stripeSecretKey?: string;
  stripeSecretKeyLast4?: string | null;
  stripeWebhookSecret?: string;
  stripeWebhookSecretLast4?: string | null;
  [key: string]: any;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

interface TenantEnvelope {
  status: string;
  data: {
    tenant: Tenant;
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetch current tenant configuration.
 * Scoped automatically by header and auth.
 */
export async function fetchCurrentTenant(): Promise<Tenant> {
  const { data: envelope } = await apiClient.get<TenantEnvelope>(
    "/tenants/current"
  );
  return envelope.data.tenant;
}

/**
 * Update current tenant name, slug, or nested settings.
 */
export async function updateTenant(data: {
  name?: string;
  slug?: string;
  settings?: TenantSettings;
}): Promise<Tenant> {
  const { data: envelope } = await apiClient.put<TenantEnvelope>(
    "/tenants/current",
    data
  );
  return envelope.data.tenant;
}
