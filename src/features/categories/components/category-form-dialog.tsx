"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { handleFormError } from "@/lib/forms";

import { useCreateCategory, useUpdateCategory } from "../hooks/use-category-mutations";
import {
  categorySchema,
  type CategoryFormValues,
  type CategoryInput,
} from "../schemas/category.schema";
import type { Category } from "../types/category.types";

function toFormValues(category?: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    description: category?.description ?? "",
  };
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}) {
  const isEdit = Boolean(category);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const pending = createCategory.isPending || updateCategory.isPending;

  const form = useForm<CategoryFormValues, unknown, CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: toFormValues(category),
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(toFormValues(category));
  }, [open, category, reset]);

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => handleFormError(error, setError),
    };

    if (category) {
      updateCategory.mutate({ categoryId: category.id, input: values }, options);
    } else {
      createCategory.mutate(values, options);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
          <DialogDescription>
            Las categorias agrupan el catalogo y sirven para filtrar productos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="category-name" label="Nombre" required error={errors.name?.message}>
              <Input
                id="category-name"
                autoFocus
                aria-invalid={Boolean(errors.name)}
                placeholder="Herramientas"
                {...register("name")}
              />
            </FormField>

            <FormField
              id="category-description"
              label="Descripcion"
              error={errors.description?.message}
            >
              <Textarea
                id="category-description"
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
              {isEdit ? "Guardar cambios" : "Crear categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
