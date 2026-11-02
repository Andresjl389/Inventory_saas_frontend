import { expect, test } from "@playwright/test";

/**
 * El alta de miembro ya no exige que la persona tenga cuenta: si el correo no
 * existe, el backend responde `ACCOUNT_DETAILS_REQUIRED` y el dialogo pide los
 * datos para crearla. Este test llega justo hasta ahi y se detiene, asi que
 * **no escribe nada**: el primer envio es el que falla a proposito.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, "Define E2E_EMAIL y E2E_PASSWORD para ejecutarlo.");

test("agregar a alguien sin cuenta revela los campos para crearla", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email as string);
  await page.getByLabel("Contrasena").fill(password as string);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(dashboard|select-company)/);

  await page.goto("/settings");
  await page.getByRole("button", { name: "Agregar" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Nombre")).toHaveCount(0);

  // Un correo que no puede existir: el dialogo tiene que pedir los datos.
  await dialog
    .getByLabel("Correo")
    .fill(`sin-cuenta-${Date.now()}@example.com`);
  await dialog.getByRole("button", { name: "Agregar" }).click();

  await expect(dialog.getByLabel("Nombre")).toBeVisible();
  await expect(dialog.getByLabel("Apellido")).toBeVisible();
  await expect(dialog.getByLabel("Contrasena inicial")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Crear cuenta y agregar" })).toBeVisible();
});

test("nadie puede cambiarse el rol a si mismo", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email as string);
  await page.getByLabel("Contrasena").fill(password as string);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(dashboard|select-company)/);

  await page.goto("/settings");

  // La propia fila se marca y se queda sin menu de acciones.
  const self = page.getByRole("listitem").filter({ hasText: email as string });
  await expect(self.getByText("Tu", { exact: true })).toBeVisible();
  await expect(self.getByRole("button", { name: /Acciones/ })).toHaveCount(0);
});
