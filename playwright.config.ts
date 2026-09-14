import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo. Necesitan el backend levantado y un usuario
 * real, asi que se saltan solas si faltan las variables (misma convencion que
 * los tests de integracion del backend).
 */
export default defineConfig({
  testDir: "./e2e",
  /*
   * En serie a proposito. Contra `next dev`, la primera visita a cada ruta la
   * compila al vuelo: varios workers golpeando rutas frias a la vez se pasaban
   * del timeout de forma intermitente. Son cuatro tests (~8 s); el paralelismo
   * no compensa la inestabilidad.
   */
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  /*
   * Margen amplio a proposito: contra un servidor de desarrollo, la primera
   * visita a cada ruta la compila al vuelo, y varios workers golpeando rutas
   * frias a la vez se pasaban del timeout por defecto.
   */
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
