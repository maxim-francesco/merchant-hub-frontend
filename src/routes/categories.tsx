import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, X, Loader2, Store, Trash2, MoreHorizontal, Pencil } from "lucide-react";
import { ro } from "@/lib/i18n/ro";
import { getErrorMessage } from "@/lib/i18n/getErrorMessage";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useMyRole } from "@/lib/hooks/useMyRole";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: ro.categories.headTitle }] }),
  component: CategoriesPage,
});

// ─── Validation Schema ───────────────────────────────────────────────────────
const categorySchema = z.object({
  name: z.string().min(2, ro.validation.categoryMin),
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
  const { isPrivileged } = useMyRole();
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
    defaultValues: { name: "" },
  });

  const { isSubmitting } = form.formState;

  // Create Mutation wiring
  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success(ro.categories.createdSuccess);
      form.reset();
      setAttrs([]); // Reset local attribute pills state back to empty
      setIsModalOpen(false); // Close Modal
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update Mutation wiring
  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      toast.success(ro.categories.updatedSuccess);
      form.reset();
      setAttrs([]);
      setEditingId(null);
      setIsModalOpen(false); // Close Modal
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete Mutation wiring
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success(ro.categories.deletedSuccess);
      setCategoryToDelete(null); // Close Alert Dialog
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
      setCategoryToDelete(null); // Close Alert Dialog
    },
  });

  const handleCancelEdit = () => {
    form.reset({ name: "" });
    setAttrs([]);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const onSubmit = (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
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
            <h1 className="text-2xl font-semibold tracking-tight">{ro.categories.title}</h1>
            <p className="text-sm text-muted-foreground">{ro.categories.subtitle}</p>
          </div>
          {isPrivileged && (
            <Button
              onClick={() => {
                setEditingId(null);
                form.reset({ name: "" });
                setAttrs([]);
                setIsModalOpen(true);
              }}
              className="shrink-0 gap-1.5 self-start sm:self-center"
              disabled={!activeAdminTenant}
            >
              <Plus className="h-4 w-4" />
              {ro.categories.createBtn}
            </Button>
          )}
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
              <div className="font-medium text-foreground">{ro.categories.noCategories}</div>
              <div className="text-xs text-muted-foreground mt-0.5 max-w-[280px]">
                {ro.categories.noCategoriesDesc}
              </div>
            </Card>
          ) : (
            categories.map((c) => (
              <Card key={c.id} className="border-border/60 hover:border-border/100 transition-colors shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c._count?.products ?? 0} {c._count?.products === 1 ? ro.common.product : ro.common.products}
                      </div>
                    </div>
                    {isPrivileged && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-1" aria-label="Open category actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-sm border-border/60">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => {
                              setEditingId(c.id);
                              form.setValue("name", c.name, { shouldValidate: true });
                              setAttrs(getCategoryAttributes(c));
                              setIsModalOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            {ro.common.edit}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setCategoryToDelete(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {ro.common.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {getCategoryAttributes(c).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {getCategoryAttributes(c).map((a) => (
                        <Badge key={a} variant="secondary" className="font-normal">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
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
                {editingId ? ro.categories.editCategory : ro.categories.createCategory}
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
                      <FormLabel className="text-[13px] font-medium">{ro.categories.nameLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={ro.categories.namePlaceholder} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />



                {/* Custom Attributes (Showcase only) */}
                <div className="grid gap-2">
                  <Label className="text-[13px] font-medium">{ro.categories.expectedAttrs}</Label>
                  <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                    {attrs.length === 0 ? (
                      <span className="text-xs text-muted-foreground/60 italic">{ro.categories.noAttrs}</span>
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
                      placeholder={ro.categories.attrPlaceholder}
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
                    {ro.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 flex-1"
                    disabled={isSubmitting || updateMutation.isPending || mutation.isPending || !activeAdminTenant}
                  >
                    {isSubmitting || updateMutation.isPending || mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {ro.common.saving}
                      </>
                    ) : editingId ? (
                      ro.common.saveChanges
                    ) : (
                      ro.categories.createCategory
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
              <AlertDialogTitle>{ro.categories.confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {ro.categories.confirmDesc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                {ro.common.cancel}
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
                {deleteMutation.isPending ? ro.common.deleting : ro.categories.deleteBtn}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
