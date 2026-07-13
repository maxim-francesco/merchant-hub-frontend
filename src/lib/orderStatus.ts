export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "SHIPPED", "CANCELLED"],
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
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30",
  SHIPPED: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30",
  DELIVERED: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200/50 dark:border-violet-900/30",
  CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30",
};
