import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(
  !email || !password,
  "Define E2E_EMAIL y E2E_PASSWORD (y ten el backend levantado) para ejecutarlos.",
);

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email as string);
  await page.getByLabel("Contrasena").fill(password as string);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(dashboard|select-company)/);
});

test("el panel se pinta con la empresa activa", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hola");
  await expect(page.getByText("Productos activos")).toBeVisible();
});

test("los tokens no son accesibles desde JavaScript", async ({ page }) => {
  const cookies = await page.evaluate(() => document.cookie);
  expect(cookies).not.toContain("inv_at");
  expect(cookies).not.toContain("inv_rt");
  // La empresa activa si es legible: no es un secreto.
  expect(cookies).toContain("inv_cid");
});

test("el proxy no expone el endpoint de login", async ({ page }) => {
  const status = await page.evaluate(async () => {
    const response = await fetch("/api/bff/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@y.com", password: "x" }),
    });
    return response.status;
  });
  expect(status).toBe(404);
});

test("la busqueda de productos filtra en el servidor", async ({ page }) => {
  await page.goto("/products");
  const search = page.getByRole("searchbox", { name: "Buscar productos" });

  const request = page.waitForRequest(
    (req) => req.url().includes("/api/bff/products") && req.url().includes("search=zzz"),
  );
  await search.fill("zzz");
  await request;

  await expect(page.getByText("Ningun producto coincide")).toBeVisible();
});
