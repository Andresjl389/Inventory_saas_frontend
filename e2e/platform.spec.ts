import { expect, test } from "@playwright/test";

/**
 * El area de plataforma tiene una regla que es facil romper sin darse cuenta:
 * su administrador puede no pertenecer a ninguna empresa, asi que `/admin` no
 * puede exigir una empresa activa. Estos tests la fijan.
 */
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const userEmail = process.env.E2E_EMAIL;
const userPassword = process.env.E2E_PASSWORD;

test.skip(
  !adminEmail || !adminPassword,
  "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD (un superusuario) para ejecutarlos.",
);

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(dashboard|select-company|admin)/);
}

test("un administrador sin empresa entra a /admin sin pasar por el selector", async ({ page }) => {
  await login(page, adminEmail as string, adminPassword as string);

  // Sin membresias, `GET /companies` devuelve `[]` y el login lo mandaria al
  // selector: una pantalla que le pide elegir entre nada. Tiene que acabar en
  // `/admin` por su cuenta, sin que nadie escriba la URL.
  await expect(page).not.toHaveURL(/\/select-company/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("plataforma");
});

test("las secciones de plataforma cargan", async ({ page }) => {
  await login(page, adminEmail as string, adminPassword as string);

  for (const [path, heading] of [
    ["/admin/companies", "Empresas"],
    ["/admin/users", "Usuarios"],
    ["/admin/plans", "Planes"],
    ["/admin/audit", "Auditoria"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
  }
});

test("un usuario normal no puede entrar a /admin", async ({ page }) => {
  test.skip(!userEmail || !userPassword, "Hace falta tambien una cuenta normal.");

  await login(page, userEmail as string, userPassword as string);
  await page.goto("/admin");

  // El layout lo rebota al panel de su empresa.
  await expect(page).toHaveURL(/\/dashboard/);
});
