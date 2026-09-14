import { describe, expect, it } from "vitest";

import { ApiError, errorMessage, toApiError } from "./errors";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("toApiError", () => {
  it("lee el formato de error del backend", async () => {
    const error = await toApiError(
      jsonResponse(409, {
        error: { code: "DUPLICATE_SKU", message: "SKU repetido", details: { sku: "MAR-01" } },
      }),
    );

    expect(error.status).toBe(409);
    expect(error.code).toBe("DUPLICATE_SKU");
    expect(error.details).toEqual({ sku: "MAR-01" });
  });

  it("cae en HTTP_ERROR cuando la respuesta no es JSON del backend", async () => {
    const error = await toApiError(new Response("<html>502</html>", { status: 502 }));
    expect(error.code).toBe("HTTP_ERROR");
    expect(error.status).toBe(502);
  });
});

describe("ApiError", () => {
  it("traduce los codigos conocidos", () => {
    const error = new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    expect(error.userMessage).toBe("Correo o contrasena incorrectos.");
    expect(error.isUnauthorized).toBe(true);
  });

  it("usa el mensaje del backend cuando el codigo es desconocido", () => {
    const error = new ApiError(422, "SOMETHING_NEW", "Regla rara del dominio");
    expect(error.userMessage).toBe("Regla rara del dominio");
  });

  it("convierte los errores de validacion de FastAPI en nombres de campo", () => {
    const error = new ApiError(422, "VALIDATION_ERROR", "Request validation failed", {
      fields: [
        { location: ["body", "sku"], message: "Field required", type: "missing" },
        { location: ["body", "cost_price"], message: "Input should be >= 0", type: "greater" },
      ],
    });

    expect(error.fieldErrors).toEqual({
      sku: "Field required",
      cost_price: "Input should be >= 0",
    });
  });

  it("devuelve un objeto vacio si el error no trae campos", () => {
    expect(new ApiError(500, "INTERNAL_ERROR", "boom").fieldErrors).toEqual({});
  });
});

describe("errorMessage", () => {
  it("no revienta con valores que no son errores", () => {
    expect(errorMessage("texto suelto")).toBe("Error inesperado del servidor. Intentalo de nuevo.");
  });
});
