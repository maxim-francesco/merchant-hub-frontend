export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "PAID", "SHIPPED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
} as const;

export function nextStatuses(current: OrderStatus): readonly OrderStatus[] {
  return ALLOWED_TRANSITIONS[current] || [];
}

export function isEditable(status: OrderStatus): boolean {
  return status === "PENDING";
}

export const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-muted/80 text-muted-foreground border-border/80",
  CONFIRMED: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30",
  SHIPPED: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30",
  DELIVERED: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200/50 dark:border-violet-900/30",
  CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30",
};

export const PAYMENT_METHOD_BADGE_STYLES: Record<"ramburs" | "card", string> = {
  ramburs: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200/50 dark:border-orange-900/30",
  card: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200/50 dark:border-sky-900/30",
};

