import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, X, Loader2, Store, Trash2 } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/catalog";
import { useTenantStore } from "@/lib/store/tenantStore";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "Categories — Commerce OS Admin" }] }),
  component: CategoriesPage,
});

// ─── Validation Schema ───────────────────────────────────────────────────────
const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Helper to resolve category attributes dynamically for visual presentation
function getCategoryAttributes(c: any): string[] {
  if (Array.isArray(c.expectedAttributes)) return c.expectedAttributes;
  if (Array.isArray(c.attributes)) return c.attributes;
  
  const slug = c.slug || "";
  if (slug.includes("apparel") || slug.includes("imbracaminte")) {
    return ["Mărime", "Culoare", "Material"];
  }
  if (slug.includes("accesorii") || slug.includes("accessories")) {
    return ["Material", "Dimensiune"];
  }
  return ["General"];
}

// ─── Component ────────────────────────────────────────────────────────────────
function CategoriesPage() {
  const queryClient = useQueryClient();
  const activeAdminTenant = useTenantStore((s) => s.activeAdminTenant);

  // Expected attributes list for local showcase
  const [attrs, setAttrs] = useState<string[]>(["Culoare", "Dimensiune"]);
  const [draft, setDraft] = useState("");
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal Open state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Deletion Target State
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Live query
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", activeAdminTenant?.id],
    queryFn: fetchCategories,
    enabled: !!activeAdminTenant?.id,
  });

  // Form wiring
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "" },
  });

  const { isSubmitting } = form.formState;

  // Auto-slugify watch hook (disabled during edit to allow custom slugs)
  const nameValue = form.watch("name");
  useEffect(() => {
    if (nameValue && !editingId) {
      const generatedSlug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except spaces/hyphens
        .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens
        .replace(/^-+|-+$/g, ""); // Trim hyphens
      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, editingId, form]);

  // Create Mutation wiring
  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success("Category created successfully");
      form.reset();
      setAttrs([]); // Reset local attribute pills state back to empty
      setIsModalOpen(false); // Close Modal
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create category.";
      toast.error(message);
    },
  });

  // Update Mutation wiring
  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      toast.success("Category updated successfully");
      form.reset();
      setAttrs([]);
      setEditingId(null);
      setIsModalOpen(false); // Close Modal
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update category.";
      toast.error(message);
    },
  });

  // Delete Mutation wiring
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success("Category deleted successfully");
      setCategoryToDelete(null); // Close Alert Dialog
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete category.";
      toast.error(message);
      setCategoryToDelete(null); // Close Alert Dialog
    },
  });

  const handleCancelEdit = () => {
    form.reset({ name: "", slug: "" });
    setAttrs([]);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const onSubmit = (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug,
      expectedAttributes: attrs,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      mutation.mutate(payload);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {/* Header Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
            <p className="text-sm text-muted-foreground">Group products and define custom attribute schemas.</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              form.reset({ name: "", slug: "" });
              setAttrs([]);
              setIsModalOpen(true);
            }}
            className="shrink-0 gap-1.5 self-start sm:self-center"
            disabled={!activeAdminTenant}
          >
            <Plus className="h-4 w-4" />
            Create Category
          </Button>
        </div>

        {/* Categories List Container */}
        <div className="flex flex-col gap-3 w-full">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex flex-col gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2.5 mt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : categories.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <Store className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <div className="font-medium text-foreground">No categories found</div>
              <div className="text-xs text-muted-foreground mt-0.5 max-w-[280px]">
                Start structuring your product catalog by creating your first category.
              </div>
            </Card>
          ) : (
            categories.map((c) => (
              <Card key={c.id} className="border-border/60 hover:border-border/100 transition-colors shadow-sm">
                <CardContent className="p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c._count?.products ?? 0} products
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {getCategoryAttributes(c).map((a) => (
                          <Badge key={a} variant="secondary" className="font-normal">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(c.id);
                          form.setValue("name", c.name, { shouldValidate: true });
                          form.setValue("slug", c.slug, { shouldValidate: true });
                          setAttrs(getCategoryAttributes(c));
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setCategoryToDelete(c.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modal Form Dialog */}
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              handleCancelEdit();
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px] w-[95vw] border-border/60">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {editingId ? "Edit category" : "Create category"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
                {/* Category Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Accesorii" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel className="text-[13px] font-medium">Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="accesorii" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Custom Attributes (Showcase only) */}
                <div className="grid gap-2">
                  <Label className="text-[13px] font-medium">Expected attributes</Label>
                  <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                    {attrs.length === 0 ? (
                      <span className="text-xs text-muted-foreground/60 italic">No attributes added</span>
                    ) : (
                      attrs.map((a) => (
                        <Badge key={a} variant="outline" className="gap-1.5 py-0.5 pr-1.5">
                          {a}
                          <button
                            type="button"
                            onClick={() => setAttrs((x) => x.filter((y) => y !== a))}
                            className="rounded-full hover:bg-muted p-0.5 text-muted-foreground/80 hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Attribute name"
                      className="h-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (draft.trim()) {
                            setAttrs((a) => [...a, draft.trim()]);
                            setDraft("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => {
                        if (draft.trim()) {
                          setAttrs((a) => [...a, draft.trim()]);
                          setDraft("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 flex-1"
                    disabled={isSubmitting || updateMutation.isPending || mutation.isPending || !activeAdminTenant}
                  >
                    {isSubmitting || updateMutation.isPending || mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : editingId ? (
                      "Save changes"
                    ) : (
                      "Create category"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Deletion Confirm Alert Dialog */}
        <AlertDialog
          open={!!categoryToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setCategoryToDelete(null);
            }
          }}
        >
          <AlertDialogContent className="border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the category and remove its attribute schema. Ensure no products are currently linked to it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (categoryToDelete) {
                    deleteMutation.mutate(categoryToDelete);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete category"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
