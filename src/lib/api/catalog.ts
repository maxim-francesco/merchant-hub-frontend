import apiClient from "./client";



// ─── Types ───────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  expectedAttributes?: string[];
  _count: { products: number };
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

/** Typed representation of the dynamic JSONB attributes field. */
export type ProductAttributes = Record<string, string | number | boolean | string[]>;

export interface Product {
  id: string;
  name: string;
  slug: string;
  /** Prisma returns Decimal as a string over JSON */
  price: string;
  attributes: ProductAttributes;
  createdAt: string;
  category: ProductCategory;
}

// ─── Backend response envelopes ──────────────────────────────────────────────

interface CategoriesEnvelope {
  status: string;
  data: { categories: Category[] };
}

interface ProductsEnvelope {
  status: string;
  data: { products: Product[] };
}

// ─── API functions ───────────────────────────────────────────────────────────

/**
 * Fetch all categories for the hardcoded "Luxe Fashion" tenant.
 * Requires a valid JWT in localStorage (attached automatically by the Axios interceptor).
 */
export async function fetchCategories(): Promise<Category[]> {
  const { data: envelope } = await apiClient.get<CategoriesEnvelope>(
    "/catalog/categories"
  );
  return envelope.data.categories;
}

/**
 * Fetch all products (with their category) for the hardcoded "Luxe Fashion" tenant.
 * Requires a valid JWT in localStorage (attached automatically by the Axios interceptor).
 */
export async function fetchProducts(): Promise<Product[]> {
  const { data: envelope } = await apiClient.get<ProductsEnvelope>(
    "/catalog/products"
  );
  return envelope.data.products;
}

export interface CreateProductData {
  name: string;
  price: string | number;
  categoryId: string;
  attributes?: ProductAttributes;
}

interface SingleProductEnvelope {
  status: string;
  data: { product: Product };
}

export async function createProduct(productData: CreateProductData): Promise<Product> {
  const { data: envelope } = await apiClient.post<SingleProductEnvelope>(
    "/catalog/products",
    productData
  );
  return envelope.data.product;
}

/**
 * Update an existing product.
 */
export async function updateProduct({ id, data }: { id: string; data: CreateProductData }): Promise<Product> {
  const { data: envelope } = await apiClient.put<SingleProductEnvelope>(
    `/catalog/products/${id}`,
    data
  );
  return envelope.data.product;
}

/**
 * Delete a product.
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/catalog/products/${id}`);
}

export interface CreateCategoryData {
  name: string;
  expectedAttributes?: string[];
}

interface SingleCategoryEnvelope {
  status: string;
  data: { category: Category };
}

/**
 * Create a new category for the active tenant.
 * Requires a valid JWT in localStorage.
 */
export async function createCategory(categoryData: CreateCategoryData): Promise<Category> {
  const { data: envelope } = await apiClient.post<SingleCategoryEnvelope>(
    "/catalog/categories",
    categoryData
  );
  return envelope.data.category;
}

/**
 * Update an existing category.
 */
export async function updateCategory({ id, data }: { id: string; data: CreateCategoryData }): Promise<Category> {
  const { data: envelope } = await apiClient.put<SingleCategoryEnvelope>(
    `/catalog/categories/${id}`,
    data
  );
  return envelope.data.category;
}

/**
 * Delete a category.
 */
export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/catalog/categories/${id}`);
}

export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const { data: envelope } = await apiClient.post<{ status: string; data: { url: string } }>(
    "/media/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return envelope.data;
}

