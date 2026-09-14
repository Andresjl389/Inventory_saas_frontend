import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "@/components/ui/input";

import { FormField } from "./form-field";

describe("FormField", () => {
  it("asocia la etiqueta con el control", () => {
    render(
      <FormField id="sku" label="SKU">
        <Input id="sku" />
      </FormField>,
    );

    expect(screen.getByLabelText("SKU")).toBeInTheDocument();
  });

  it("anuncia el error con role=alert", () => {
    render(
      <FormField id="sku" label="SKU" error="Ya existe un producto con ese SKU">
        <Input id="sku" aria-invalid />
      </FormField>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Ya existe un producto con ese SKU");
  });
});
