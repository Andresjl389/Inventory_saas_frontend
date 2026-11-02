import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * El asistente de importacion tiene una garantia que conviene fijar: hasta el
 * ultimo paso **no se escribe nada**. Este test llega hasta la simulacion y se
 * detiene ahi a proposito, asi que se puede ejecutar contra datos reales sin
 * modificarlos.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, "Define E2E_EMAIL y E2E_PASSWORD para ejecutarlo.");

test("el asistente mapea columnas y simula sin escribir", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email as string);
  await page.getByLabel("Contrasena").fill(password as string);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(dashboard|select-company)/);

  await page.goto("/imports");
  await page.getByRole("button", { name: /Productos/ }).first().click();

  await page
    .locator('input[aria-label="Archivo a importar"]')
    .setInputFiles(path.join(__dirname, "fixtures", "productos.csv"));

  // El backend propone el mapeo: las columnas de la plantilla se reconocen solas.
  await expect(page.getByRole("heading", { name: /Asignar columnas/ })).toBeVisible();
  // El encabezado, no el boton "Actualizar vista previa".
  await expect(page.getByRole("heading", { name: /^Vista previa/ })).toBeVisible();
  // Y el valor leido aparece junto al original: es donde se ve un decimal mal.
  await expect(page.getByRole("cell", { name: "E2E-01" })).toBeVisible();

  await page.getByRole("button", { name: "Simular la importacion" }).click();

  /*
   * Que aparezca este boton ya prueba que la simulacion corrio y se revirtio:
   * solo se muestra con un resultado en `dry_run`, antes de escribir nada. El
   * test se detiene aqui a proposito.
   */
  await expect(page.getByRole("button", { name: "Importar de verdad" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("button", { name: "Volver al mapeo" })).toBeVisible();
});
