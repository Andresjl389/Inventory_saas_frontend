import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchInput } from "./search-input";

/**
 * Se usa `fireEvent` en vez de `user-event`: este ultimo espera a timers
 * reales y se cuelga cuando el test los simula.
 */
describe("SearchInput", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("solo avisa al padre cuando el usuario deja de escribir", async () => {
    const onChange = vi.fn();
    render(<SearchInput onChange={onChange} label="Buscar productos" />);

    // Primer aviso del montaje: lo descartamos para medir solo la escritura.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    onChange.mockClear();

    const input = screen.getByRole("searchbox", { name: "Buscar productos" });
    for (const value of ["m", "ma", "mar", "mart"]) {
      fireEvent.change(input, { target: { value } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
    }

    // Cuatro pulsaciones seguidas, ninguna peticion todavia.
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("mart");
  });

  it("ofrece un boton accesible para limpiar la busqueda", async () => {
    const onChange = vi.fn();
    render(<SearchInput onChange={onChange} defaultValue="martillo" />);

    fireEvent.click(screen.getByRole("button", { name: "Limpiar busqueda" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});
