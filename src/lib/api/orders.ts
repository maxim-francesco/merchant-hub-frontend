import apiClient from "./client";



// ─── TypeScript Interfaces ───────────────────────────────────────────────────

export interface OrderProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string; // Locked price at time of purchase
  product: OrderProduct;
}

export interface Order {
  id: string;
  tenantId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string; // Decimal returned as string
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customerType: "B2C" | "B2B";
  companyName: string | null;
  cui: string | null;
  regCom: string | null;
}

interface OrdersResponseEnvelope {
  status: string;
  data: {
    orders: Order[];
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetch all orders for the hardcoded "Luxe Fashion" tenant.
 * Requires a valid JWT token in localStorage.
 */
export async function fetchOrders(): Promise<Order[]> {
  const { data: envelope } = await apiClient.get<OrdersResponseEnvelope>(
    "/orders"
  );
  return envelope.data.orders;
}

/**
 * Download order invoice PDF from backend.
 * Programmatically triggers the browser's download prompt.
 */
export async function downloadOrderInvoice(orderId: string): Promise<void> {
  const response = await apiClient.get(`/orders/${orderId}/invoice`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Invoice-${orderId.substring(0, 8)}.pdf`);
  document.body.appendChild(link);
  link.click();

  // Clean up DOM and URL resources
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Fetch a single order by ID.
 */
export async function fetchOrderById(id: string): Promise<Order> {
  const { data: envelope } = await apiClient.get<{
    status: string;
    data: { order: Order };
  }>(`/orders/${id}`);
  return envelope.data.order;
}

/**
 * Update the status of a single order by ID.
 */
export async function updateOrderStatus(
  id: string,
  status: Order["status"]
): Promise<Order> {
  const { data: envelope } = await apiClient.patch<{
    status: string;
    data: { order: Order };
  }>(`/orders/${id}/status`, { status });
  return envelope.data.order;
}

