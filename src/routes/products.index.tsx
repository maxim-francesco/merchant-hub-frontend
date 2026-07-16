import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { normalizePriceInput } from "@/lib/price";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
  Package,
  Loader2,
  ImagePlus,
  Upload,
  X,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  type Product,
} from "@/lib/api/catalog";
import { useTenantStore } from "@/lib/store/tenantStore";
import { useMyRole } from "@/lib/hooks/useMyRole";

export const Route = createFileRoute("/products/")({
  head: () => ({ meta: [{ title: ro.products.headTitle }] }),
  component: ProductsPage,
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

function getPrimaryAttribute(attrs: Product["attributes"]): string | null {
  const SKIP = ["sku", "stock", "description", "imageUrl", "inStock", "tags"];
  const entry = Object.entries(attrs).find(([k]) => !SKIP.includes(k));
  if (!entry) return null;
  const [key, val] = entry;
  const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
  const display = Array.isArray(val) ? val.join(", ") : String(val);
  return `${label}: ${display}`;
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-10 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-16 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-md ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────
interface ProductRowProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

function ProductRow({ product, onEdit, onDelete }: ProductRowProps) {
  const { isPrivileged } = useMyRole();
  const attribute = getPrimaryAttribute(product.attributes);
  const imageUrl = typeof product.attributes === 'object' && product.attributes !== null ? (product.attributes as Record<string, any>).imageUrl : null;

  return (
    <TableRow className="group border-b border-border/60 hover:bg-muted/30 transition-colors">
      <TableCell className="py-3.5 pl-5">
        <div className="flex items-center gap-3 min-w-0">
          {imageUrl && typeof imageUrl === "string" ? (
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted/50">
              <img 
                src={imageUrl} 
                alt={product.name} 
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-muted/50 text-muted-foreground">
              <Package className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {product.name}
            </div>
            <div className="text-xs text-muted-foreground/70 truncate font-mono">
              {product.slug}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-3.5">
        <Badge
          variant="secondary"
          className="text-[11px] font-normal px-2 py-0.5 border border-border/50"
        >
          {product.category.name}
        </Badge>
      </TableCell>

      <TableCell className="py-3.5 text-right tabular-nums font-medium text-sm">
        {product.stock === 0 ? (
          <Badge
            variant="destructive"
            className="text-[11px] font-semibold px-2 py-0.5"
          >
            {ro.products.outOfStock}
          </Badge>
        ) : (
          <span className={product.stock < 5 ? "text-amber-600 dark:text-amber-500 font-semibold" : "text-muted-foreground"}>
            {product.stock}
          </span>
        )}
      </TableCell>

      <TableCell className="py-3.5 text-right tabular-nums font-medium text-sm pr-5">
        {fmtPrice(product.price)}
      </TableCell>

      <TableCell className="py-3.5">
        {attribute ? (
          <Badge
            variant="outline"
            className="text-[11px] font-normal text-muted-foreground border-border/50 max-w-[180px] truncate"
          >
            {attribute}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </TableCell>

      <TableCell className="py-3.5 text-right pr-4">
        {isPrivileged && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                aria-label="Open row actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-sm border-border/60">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit(product)}>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                {ro.products.editProduct}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => onDelete(product)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {ro.common.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

function ProductCard({ product, onEdit, onDelete }: ProductRowProps) {
  const { isPrivileged } = useMyRole();
  const attribute = getPrimaryAttribute(product.attributes);
  const imageUrl =
    typeof product.attributes === "object" && product.attributes !== null
      ? (product.attributes as Record<string, any>).imageUrl
      : null;
  return (
    <div className="flex items-start gap-3 p-4">
      {imageUrl && typeof imageUrl === "string" ? (
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted/50">
          <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-muted/50 text-muted-foreground">
          <Package className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
            <div className="text-xs text-muted-foreground/70 truncate font-mono">{product.slug}</div>
          </div>
          {/* Actions — ALWAYS visible on mobile (no hover on touch) */}
          {isPrivileged && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-1" aria-label="Open row actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-sm border-border/60">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit(product)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  {ro.products.editProduct}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onDelete(product)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {ro.common.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[11px] font-normal px-2 py-0.5 border border-border/50">
            {product.category.name}
          </Badge>
          {attribute && (
            <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground border-border/50 max-w-[160px] truncate">
              {attribute}
            </Badge>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="text-xs">
            {product.stock === 0 ? (
              <Badge variant="destructive" className="text-[11px] font-semibold px-2 py-0.5">
                {ro.products.outOfStock}
              </Badge>
            ) : (
              <span className={product.stock < 5 ? "text-amber-600 dark:text-amber-500 font-semibold" : "text-muted-foreground"}>
                {ro.products.stockShort}: {product.stock}
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-foreground tabular-nums">{fmtPrice(product.price)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Form validation ──────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(2, ro.validation.productMin),
  price: z.string().refine((val) => normalizePriceInput(val) !== null, {
    message: ro.validation.pricePositive,
  }),
  categoryId: z.string().min(1, ro.validation.categoryRequired),
  sku: z.string().optional(),
  stock: z.coerce.number().int("Stocul trebuie să fie un număr întreg.").min(0, "Stocul nu poate fi negativ."),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// ─── Page Component ───────────────────────────────────────────────────────────
function ProductsPage() {
  const { isPrivileged } = useMyRole();
  const queryClient = useQueryClient();
  const activeAdminTenant = useTenantStore((s) => s.activeAdminTenant);

  // Modal and CRUD states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Dynamic Category Schema attributes state
  const [dynamicAttrs, setDynamicAttrs] = useState<Record<string, string>>({});

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      categoryId: "",
      sku: "",
      stock: 0,
      description: "",
      imageUrl: "",
    },
  });

  const { isSubmitting } = form.formState;

  // Live queries
  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products", activeAdminTenant?.id],
    queryFn: fetchProducts,
    enabled: !!activeAdminTenant?.id,
    staleTime: 60_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", activeAdminTenant?.id],
    queryFn: fetchCategories,
    enabled: !!activeAdminTenant?.id,
  });

  // Watchers
  const selectedCategoryId = form.watch("categoryId");

  // Update dynamic attributes state when category ID changes
  useEffect(() => {
    if (selectedCategoryId) {
      const category = categories.find((c) => c.id === selectedCategoryId);
      if (category) {
        const expected = category.expectedAttributes || [];
        const updated: Record<string, string> = {};
        expected.forEach((attr) => {
          updated[attr] = dynamicAttrs[attr] || "";
        });
        setDynamicAttrs(updated);
      }
    } else {
      setDynamicAttrs({});
    }
  }, [selectedCategoryId, categories]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success(ro.products.createdSuccess);
      form.reset();
      setDynamicAttrs({});
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      toast.success(ro.products.updatedSuccess);
      form.reset();
      setDynamicAttrs({});
      setEditingId(null);
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success(ro.products.deletedSuccess);
      setProductToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
      setProductToDelete(null);
    },
  });

  // Open Form Handlers
  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({
      name: "",
      price: "",
      categoryId: categories[0]?.id || "",
      sku: "",
      stock: 0,
      description: "",
      imageUrl: "",
    });
    setDynamicAttrs({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    
    // Core inputs
    form.setValue("name", p.name, { shouldValidate: true });
    form.setValue("price", String(p.price), { shouldValidate: true });
    form.setValue("categoryId", p.category.id, { shouldValidate: true });

    // Custom helper attributes
    const saved = p.attributes as Record<string, any>;
    form.setValue("sku", saved?.sku || "");
    form.setValue("stock", p.stock !== undefined ? p.stock : 0, { shouldValidate: true });
    form.setValue("description", saved?.description || "");
    form.setValue("imageUrl", saved?.imageUrl || "");

    // Populate dynamic attributes
    const dynamicFields: Record<string, string> = {};
    const cat = categories.find((c) => c.id === p.category.id);
    if (cat) {
      (cat.expectedAttributes || []).forEach((a) => {
        dynamicFields[a] = saved[a] !== undefined ? String(saved[a]) : "";
      });
    }
    setDynamicAttrs(dynamicFields);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.reset();
    setDynamicAttrs({});
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const data = await uploadProductImage(file);
      onChange(data.url); // Update react-hook-form state
      toast.success(ro.products.imageSuccess);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const onSubmit = (values: ProductFormValues) => {
    let finalSku = "";

    if (editingId) {
      const existingProduct = products?.find((p) => p.id === editingId);
      finalSku = (existingProduct?.attributes as any)?.sku || 'PRD-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
    } else {
      finalSku = 'PRD-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
    }

    const normalizedPrice = normalizePriceInput(values.price) || values.price;

    const payload = {
      name: values.name,
      price: normalizedPrice,
      categoryId: values.categoryId,
      stock: values.stock,
      attributes: {
        sku: finalSku,
        description: values.description || "",
        imageUrl: values.imageUrl || "",
        ...dynamicAttrs,
      },
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const category = categories.find((c) => c.id === selectedCategoryId);
  const expectedAttrs = category?.expectedAttributes || [];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{ro.products.title}</h1>
            <p className="text-sm text-muted-foreground">
              {ro.products.subtitle}{" "}
              {products && !isLoading && (
                <span className="text-muted-foreground/60">
                  {products.length} {products.length === 1 ? ro.common.product : ro.common.products}
                </span>
              )}
            </p>
          </div>
          {isPrivileged && (
            <Button onClick={handleOpenCreate} className="shrink-0 gap-1.5 self-start sm:self-center">
              <Plus className="h-4 w-4" />
              {ro.products.createBtn}
            </Button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder={ro.products.searchPlaceholder}
              className="pl-9 h-10 bg-background border-border/70 focus-visible:ring-1"
            />
          </div>
          <Button variant="outline" className="h-10 gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4" />
            {ro.products.filters}
          </Button>
        </div>

        {/* Error banner */}
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 mt-px shrink-0" />
            <span>{getErrorMessage(error)}</span>
          </div>
        )}

        {/* Data Table */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardContent className="p-0">
            {/* Desktop View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/60 bg-muted/20 hover:bg-muted/20">
                      <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground pl-5 py-3">
                        {ro.products.tableProduct}
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3">
                        {ro.products.tableCategory}
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3 text-right">
                        {ro.products.stockLabel}
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3 text-right pr-5">
                        {ro.products.tablePrice}
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground py-3">
                        {ro.products.tableAttrs}
                      </TableHead>
                      <TableHead className="py-3 pr-4 w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && <SkeletonRows />}

                    {!isLoading &&
                      products?.map((product) => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          onEdit={handleOpenEdit}
                          onDelete={setProductToDelete}
                        />
                      ))}

                    {!isLoading && !isError && products?.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">{ro.products.noProducts}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {ro.products.noProductsDesc}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              {isLoading && (
                <div className="divide-y divide-border/60">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-4">
                      <Skeleton className="h-9 w-9 rounded-md shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && !isError && products?.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{ro.products.noProducts}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {ro.products.noProductsDesc}
                  </p>
                </div>
              )}

              {!isLoading && products && products.length > 0 && (
                <div className="divide-y divide-border/60">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleOpenEdit}
                      onDelete={setProductToDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Modal Dialog */}
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-[480px] w-[95vw] max-h-[85vh] overflow-y-auto border-border/60">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {editingId ? ro.products.editProduct : ro.products.createProduct}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-3">
                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">{ro.products.nameLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={ro.products.namePlaceholder} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">{ro.products.priceLabel}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={ro.products.pricePlaceholder}
                          className="h-11"
                          inputMode="decimal"
                          {...field}
                          onBlur={(e) => {
                            const normalized = normalizePriceInput(e.target.value);
                            if (normalized !== null) {
                              form.setValue("price", normalized, { shouldValidate: true });
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Stock */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">{ro.products.stockLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={ro.products.stockPlaceholder} type="number" inputMode="numeric" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">{ro.products.descLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={ro.products.descPlaceholder} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Image URL Placeholder */}
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">Product Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-3">
                          <input 
                            type="file" 
                            accept="image/jpeg, image/png, image/webp, image/gif" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={(e) => handleFileUpload(e, field.onChange)} 
                          />

                          {field.value ? (
                            <div className="relative w-32 h-32 rounded-md border border-border/60 overflow-hidden group">
                              <img src={field.value} alt="Product preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => fileInputRef.current?.click()}>
                                  <Upload className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-400/20" onClick={() => field.onChange("")}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="h-24 w-full border-dashed border-2 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                  <span className="text-xs font-medium">Uploading to Cloudinary...</span>
                                </>
                              ) : (
                                <>
                                  <ImagePlus className="h-6 w-6" />
                                  <span className="text-xs font-medium">Click to upload image</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Category Selector */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">{ro.products.categoryLabel}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} {...({ modal: false } as any)}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-border/70">
                            <SelectValue placeholder={ro.products.selectCategory} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="z-[100] pointer-events-auto max-h-[300px] overflow-y-auto border-border/60">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Dynamic Category Attributes */}
                {expectedAttrs.length > 0 && (
                  <div className="flex flex-col gap-3.5 border-t border-border/40 pt-4 mt-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {ro.products.specifications}
                    </Label>
                    <div className="grid gap-3">
                      {expectedAttrs.map((attr) => (
                        <div key={attr} className="grid gap-1">
                          <Label className="text-[13px] font-medium">{attr}</Label>
                          <Input
                            value={dynamicAttrs[attr] || ""}
                            onChange={(e) => {
                              setDynamicAttrs((prev) => ({
                                ...prev,
                                [attr]: e.target.value,
                              }));
                            }}
                            placeholder={`${ro.products.specPlaceholder}${attr.toLowerCase()}`}
                            className="h-11 border-border/70"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Row */}
                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1"
                    onClick={handleCancel}
                  >
                    {ro.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 flex-1"
                    disabled={isSubmitting || updateMutation.isPending || createMutation.isPending || !activeAdminTenant}
                  >
                    {isSubmitting || updateMutation.isPending || createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {ro.common.saving}
                      </>
                    ) : editingId ? (
                      ro.common.saveChanges
                    ) : (
                      ro.products.createProduct
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Alert Dialog */}
        <AlertDialog
          open={!!productToDelete}
          onOpenChange={(open) => !open && setProductToDelete(null)}
        >
          <AlertDialogContent className="border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>{ro.products.confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {ro.products.confirmDesc.replace("{name}", productToDelete?.name || "")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                {ro.common.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (productToDelete) {
                    deleteMutation.mutate(productToDelete.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? ro.common.deleting : ro.products.deleteBtn}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
