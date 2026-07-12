export const fmtRON = (n: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 2 }).format(n);

export const salesLast7Days = [
  { day: "Lun", sales: 4200 },
  { day: "Mar", sales: 5100 },
  { day: "Mie", sales: 4800 },
  { day: "Joi", sales: 6300 },
  { day: "Vin", sales: 7200 },
  { day: "Sâm", sales: 8100 },
  { day: "Dum", sales: 6900 },
];

export const metrics = {
  totalSales: 42680,
  activeOrders: 37,
  revenue: 128450,
  lowStock: 8,
};

export type OrderStatus = "New" | "Processing" | "Shipped" | "Delivered" | "Canceled";

export const orders = [
  { id: "ORD-1042", date: "2026-07-10", customer: "Andrei Popescu", type: "B2C", total: 349.9, status: "New" as OrderStatus },
  { id: "ORD-1041", date: "2026-07-10", customer: "SC Alfa Trading SRL", type: "B2B", total: 2890.0, status: "Processing" as OrderStatus },
  { id: "ORD-1040", date: "2026-07-09", customer: "Maria Ionescu", type: "B2C", total: 129.5, status: "Shipped" as OrderStatus },
  { id: "ORD-1039", date: "2026-07-09", customer: "SC Beta Distrib SRL", type: "B2B", total: 5420.0, status: "Delivered" as OrderStatus },
  { id: "ORD-1038", date: "2026-07-08", customer: "Vlad Georgescu", type: "B2C", total: 89.0, status: "Delivered" as OrderStatus },
  { id: "ORD-1037", date: "2026-07-08", customer: "Elena Marinescu", type: "B2C", total: 245.0, status: "Canceled" as OrderStatus },
  { id: "ORD-1036", date: "2026-07-07", customer: "SC Gamma SRL", type: "B2B", total: 1780.5, status: "Shipped" as OrderStatus },
];

export const orderDetails: Record<string, {
  customer: { type: "B2C" | "B2B"; name: string; company?: string; cui?: string; regCom?: string; address: string; email: string; phone: string };
  items: { name: string; qty: number; price: number }[];
  shipping: number;
}> = {
  "ORD-1042": {
    customer: { type: "B2C", name: "Andrei Popescu", address: "Str. Victoriei 12, Bl. A, Ap. 5, București, 010101", email: "andrei.p@example.ro", phone: "+40 722 123 456" },
    items: [
      { name: "Cană ceramică handmade", qty: 2, price: 79.9 },
      { name: "Set 4 farfurii artizanale", qty: 1, price: 190.1 },
    ],
    shipping: 20,
  },
  "ORD-1041": {
    customer: { type: "B2B", name: "Contact: Ioana Radu", company: "SC Alfa Trading SRL", cui: "RO12345678", regCom: "J40/1234/2019", address: "Bd. Timișoara 26, Sector 6, București", email: "office@alfatrading.ro", phone: "+40 21 555 0100" },
    items: [
      { name: "Palet detergent industrial 20L", qty: 10, price: 250 },
      { name: "Mănuși protecție (100 buc)", qty: 8, price: 48.75 },
    ],
    shipping: 0,
  },
};

export const products = [
  { id: "P-001", name: "Cană ceramică handmade", price: 79.9, stock: 42, category: "Ceramică", image: "🍵" },
  { id: "P-002", name: "Set 4 farfurii artizanale", price: 190.0, stock: 12, category: "Ceramică", image: "🍽️" },
  { id: "P-003", name: "Suculentă în ghiveci", price: 45.0, stock: 3, category: "Plante", image: "🪴" },
  { id: "P-004", name: "Tricou bumbac organic", price: 129.0, stock: 88, category: "Îmbrăcăminte", image: "👕" },
  { id: "P-005", name: "Sac cafea boabe 1kg", price: 89.5, stock: 5, category: "Alimente", image: "☕" },
  { id: "P-006", name: "Lumânare parfumată soia", price: 55.0, stock: 27, category: "Decor", image: "🕯️" },
];

export const categories = [
  { id: "C-1", name: "Ceramică", products: 24, attributes: ["Culoare", "Dimensiune", "Material"] },
  { id: "C-2", name: "Plante", products: 18, attributes: ["Maturitate", "Înălțime", "Tip ghiveci"] },
  { id: "C-3", name: "Îmbrăcăminte", products: 62, attributes: ["Mărime", "Culoare", "Material"] },
  { id: "C-4", name: "Alimente", products: 31, attributes: ["Greutate", "Valabilitate", "Origine"] },
  { id: "C-5", name: "Decor", products: 15, attributes: ["Culoare", "Dimensiune"] },
];

export const statusColor: Record<OrderStatus, string> = {
  New: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Processing: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Shipped: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  Delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Canceled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
};
