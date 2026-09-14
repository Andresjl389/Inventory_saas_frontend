"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { formatPercent, margin, toNumber } from "@/lib/format";
import { handleFormError } from "@/lib/forms";

import { useCreateProduct, useUpdateProduct } from "../hooks/use-product-mutations";
import {
  NO_CATEGORY,
  productSchema,
  type ProductFormValues,
  type ProductInput,
} from "../schemas/product.schema";
import type { Product } from "../types/product.types";

/** "10.5000" -> "10.5": lo que el backend guarda no es lo que da gusto editar. */
function toInputPrice(value: string | number): string {
  const parsed = toNumber(value);
  return String(parsed);
}

function toFormValues(product?: Product | null): ProductFormValues {
  if (!product) {
    return {
      name: "",
      sku: "",
      description: "",
      barcode: "",
      category_id: NO_CATEGORY,
      cost_price: "0",
      sale_price: "0",
    };
  }

  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    barcode: product.barcode ?? "",
    category_id: product.category_id ?? NO_CATEGORY,
    cost_price: toInputPrice(product.cost_price),
    sale_price: toInputPrice(product.sale_price),
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}) {
  const isEdit = Boolean(product);
  const categories = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const pending = createProduct.isPending || updateProduct.isPending;

  const form = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(product),
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = form;

  // El dialogo se reutiliza para crear y para editar cualquier producto.
  useEffect(() => {
    if (open) reset(toFormValues(product));
  }, [open, product, reset]);

  // `useWatch` en vez de `watch()`: devuelve un valor estable que el React
  // Compiler si puede memorizar.
  const categoryId = useWatch({ control, name: "category_id" }) ?? NO_CATEGORY;
  const costPrice = useWatch({ control, name: "cost_price" });
  const salePrice = useWatch({ control, name: "sale_price" });
  const currentMargin = margin(costPrice ?? 0, salePrice ?? 0);

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => handleFormError(error, setError),
    };

    if (product) {
      updateProduct.mutate({ productId: product.id, input: values }, options);
    } else {
      createProduct.mutate(values, options);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Los cambios se aplican de inmediato en el catalogo."
              : "El SKU debe ser unico dentro de tu empresa."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="product-name" label="Nombre" required error={errors.name?.message}>
                <Input
                  id="product-name"
                  autoFocus
                  aria-invalid={Boolean(errors.name)}
                  placeholder="Martillo de carpintero"
                  {...register("name")}
                />
              </FormField>

              <FormField id="product-sku" label="SKU" required error={errors.sku?.message}>
                <Input
                  id="product-sku"
                  aria-invalid={Boolean(errors.sku)}
                  placeholder="MAR-01"
                  className="font-mono"
                  {...register("sku")}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="product-category"
                label="Categoria"
                error={errors.category_id?.message}
              >
                <Select
                  value={categoryId}
                  onValueChange={(value) => setValue("category_id", value, { shouldDirty: true })}
                  disabled={categories.isLoading}
                >
                  <SelectTrigger id="product-category" className="w-full">
                    <SelectValue placeholder="Sin categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>Sin categoria</SelectItem>
                    {categories.data?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                id="product-barcode"
                label="Codigo de barras"
                error={errors.barcode?.message}
              >
                <Input
                  id="product-barcode"
                  aria-invalid={Boolean(errors.barcode)}
                  className="font-mono"
                  {...register("barcode")}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="product-cost"
                label="Precio de costo"
                required
                error={errors.cost_price?.message}
              >
                <Input
                  id="product-cost"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.cost_price)}
                  className="tnum"
                  {...register("cost_price")}
                />
              </FormField>

              <FormField
                id="product-sale"
                label="Precio de venta"
                required
                error={errors.sale_price?.message}
                description={
                  currentMargin === null
                    ? undefined
                    : `Margen: ${formatPercent(currentMargin)}`
                }
              >
                <Input
                  id="product-sale"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.sale_price)}
                  className="tnum"
                  {...register("sale_price")}
                />
              </FormField>
            </div>

            <FormField
              id="product-description"
              label="Descripcion"
              error={errors.description?.message}
            >
              <Textarea
                id="product-description"
                rows={3}
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
