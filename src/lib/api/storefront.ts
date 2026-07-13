import apiClient from "./client";



// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  attributes: Record<string, any>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  items: CheckoutItem[];
  customerType?: "B2C" | "B2B";
  companyName?: string;
  cui?: string;
  regCom?: string;
}

interface ProductsEnvelope {
  status: string;
  data: { products: StorefrontProduct[] };
}

interface CategoriesEnvelope {
  status: string;
  data: { categories: StorefrontCategory[] };
}

interface CheckoutResponseEnvelope {
  status: string;
  data: { url: string };
}

// ─── API Functions ───────────────────────────────────────────────────────────

/** Fetch public products catalog for storefront */
export async function fetchStorefrontProducts(): Promise<StorefrontProduct[]> {
  const { data: envelope } = await apiClient.get<ProductsEnvelope>(
    "/storefront/products"
  );
  return envelope.data.products;
}

/** Fetch public categories list for storefront */
export async function fetchStorefrontCategories(): Promise<StorefrontCategory[]> {
  const { data: envelope } = await apiClient.get<CategoriesEnvelope>(
    "/storefront/categories"
  );
  return envelope.data.categories;
}

/** Submit public consumer checkout cart details */
export async function submitCheckout(payload: CheckoutPayload): Promise<{ url: string }> {
  const { data: envelope } = await apiClient.post<CheckoutResponseEnvelope>(
    "/storefront/checkout",
    payload
  );
  return envelope.data;
}

export interface ResolvedTenant {
  id: string;
  name: string;
  slug: string;
  settings?: any;
}

interface ResolveResponseEnvelope {
  status: string;
  data: { tenant: ResolvedTenant };
}

/** Resolve tenant details by slug */
export async function resolveTenant(slug: string): Promise<ResolvedTenant> {
  const { data: envelope } = await apiClient.get<ResolveResponseEnvelope>(
    `/storefront/resolve/${slug}`
  );
  return envelope.data.tenant;
}
