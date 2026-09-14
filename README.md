# Inventory SaaS — Frontend

Dashboard multi-empresa construido sobre la arquitectura de `FRONTEND.md`:
Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui, con TanStack Query
para el estado del servidor y Zustand para el de la interfaz.

> Estado: **Fase 1 completa + los modulos que el backend ya expone**.
> Implementado: autenticacion, shell del dashboard, selector de empresa,
> productos, categorias, miembros y panel.
> Pendiente (no hay endpoints todavia): bodegas, inventario, clientes,
> proveedores, ventas y compras.

---

## 1. Arranque rapido

```bash
cp .env.example .env.local     # apunta API_URL a tu FastAPI
pnpm install
pnpm dev                       # http://localhost:3000
```

El backend debe estar corriendo en `http://localhost:8000` y tener
`http://localhost:3000` en su `CORS_ORIGINS` (aunque, como se explica abajo, el
navegador nunca llama directamente a la API, asi que CORS rara vez entra en
juego).

### Comandos

| Comando | Que hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de produccion |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (reglas de Next + React Compiler) |
| `pnpm test` | Vitest (unitarios y de componente) |
| `pnpm test:e2e` | Playwright (ver `e2e/README.md`; se salta sin credenciales) |

---

## 2. Como viaja una peticion

```
Navegador
   │  fetch("/api/bff/products?page=1")     mismo origen, sin tokens en JS
   ▼
Route Handler  /api/bff/[...path]
   │  lee cookies httpOnly
   │  añade Authorization: Bearer <access>
   │  añade X-Company-ID: <inv_cid>
   │  si el backend responde 401 -> refresca y reintenta UNA vez
   ▼
FastAPI  /api/v1/products
   │  get_current_user  -> valida el JWT
   │  get_tenant_context -> valida la membresia, SET LOCAL app.current_company_id
   │  require_permission -> rol -> permisos
   ▼
PostgreSQL con RLS
```

Los Server Components (el layout del dashboard) se saltan el proxy y llaman a
FastAPI directamente con `serverApi()`, porque ya estan en el servidor y pueden
leer las cookies.

---

## 3. Decisiones de autenticacion

**Los tokens viven en cookies httpOnly, no en `localStorage`.**

| | Cookie | httpOnly | Por que |
| --- | --- | --- | --- |
| Access token | `inv_at` | si | Un XSS no puede robarlo |
| Refresh token | `inv_rt` | si | Idem, y dura 14 dias |
| Empresa activa | `inv_cid` | no | El layout en servidor la necesita; no es un secreto |

Consecuencias:

- El navegador **nunca** conoce la URL de la API ni los tokens.
- `/api/bff/auth/login`, `/auth/register` y `/auth/refresh` estan **bloqueados**
  en el proxy: si se pudieran alcanzar por ahi, el token acabaria en JavaScript
  y las cookies httpOnly no servirian de nada. Cada uno tiene su Route Handler
  propio, que es quien escribe las cookies.
- Un Server Component no puede escribir cookies. Por eso `proxy.ts` (el antiguo
  `middleware.ts`) decodifica el `exp` del JWT **sin verificar la firma** y, si
  esta vencido, redirige a `/api/auth/refresh?next=...` antes de renderizar. La
  firma la sigue validando el backend: aqui solo se decide a donde navegar.

---

## 4. Multi-tenant

El frontend **propone** la empresa; el backend la **acepta o no**.

- `inv_cid` -> cabecera `X-Company-ID` -> `get_tenant_context` comprueba que
  exista una membresia activa -> `SET LOCAL app.current_company_id` -> RLS.
- Conocer un UUID de empresa no da acceso a nada.
- El store del tenant (`src/stores/tenant.store.tsx`) se crea **por peticion**,
  no a nivel de modulo: un store global en Node filtraria el tenant de un
  usuario al render de otro.
- Todas las query keys de datos del tenant empiezan por el `companyId`:

  ```ts
  productKeys.list(companyId, filters)   // ["products", companyId, "list", {...}]
  categoryKeys.list(companyId)           // ["categories", companyId, "list"]
  ```

- Cambiar de empresa hace una **recarga completa** (`window.location.assign`)
  en vez de invalidar queries una a una. Invalidar deja una ventana en la que
  algo puede pintar datos de la empresa anterior; recargar no.

Los permisos (`src/config/permissions.ts`) son un espejo de `ROLE_PERMISSIONS`
del backend y solo sirven para **ocultar botones**. Un boton oculto no es
seguridad: `require_permission(...)` vuelve a comprobarlo todo.

---

## 5. Estructura

```
src/
├── app/
│   ├── (auth)/            login, registro
│   ├── (dashboard)/       layout con AppShell + paginas
│   ├── api/
│   │   ├── auth/          login, register, logout, refresh  (escriben cookies)
│   │   ├── bff/[...path]/ proxy hacia FastAPI
│   │   └── session/       empresa activa
│   └── select-company/
│
├── features/              auth, companies, products, categories, dashboard
│   └── <feature>/
│       ├── api/           llamadas + query keys
│       ├── components/
│       ├── hooks/         useQuery / useMutation
│       ├── schemas/       Zod
│       └── types/
│
├── components/
│   ├── ui/                shadcn/ui (generado)
│   └── shared/            app-shell, data-table, estados, formularios
│
├── lib/       api (cliente, errores), auth (cookies, sesion), format, forms
├── config/    env, navegacion, permisos
├── providers/ query, theme, session
├── stores/    tenant (por peticion), ui
└── proxy.ts   enrutado de sesion (Next 16 renombro middleware -> proxy)
```

Regla: **una feature es dueña de su logica**; lo de `components/shared` se
mantiene generico y sin conocimiento del dominio.

---

## 6. Estado: quien guarda que

| Tipo | Donde | Ejemplo |
| --- | --- | --- |
| Estado del servidor | TanStack Query | productos, categorias, miembros |
| Estado de UI | Zustand | barra lateral plegada, menu movil |
| Estado del tenant | Zustand por peticion | empresa activa, rol |
| Estado de formulario | React Hook Form + Zod | alta de producto |

Zustand **nunca** guarda datos del backend.

---

## 7. Errores

El backend responde siempre igual:

```json
{ "error": { "code": "DUPLICATE_SKU", "message": "...", "details": {} } }
```

`src/lib/api/errors.ts` lo convierte en un `ApiError` con:

- `userMessage`: el codigo traducido al español.
- `fieldErrors`: `location: ["body","sku"]` -> `{ sku: "..." }`, listo para
  React Hook Form.

`handleFormError()` coloca el error en el campo correcto, incluso cuando el
backend no lo dice (un 409 `DUPLICATE_SKU` aterriza en el input del SKU). Si no
hay campo al que asociarlo, sale un toast.

Un 401 en cualquier query lleva a `/login`; un `INVALID_MEMBERSHIP` a
`/select-company`.

---

## 8. Rendimiento

- Paginacion, busqueda y filtros de productos se resuelven **en el servidor**.
- La busqueda tiene debounce de 350 ms: una peticion por busqueda, no por tecla.
- Los contadores del panel usan `size=1` y leen solo `total`: cuenta PostgreSQL,
  no el navegador.
- `keepPreviousData` mantiene la tabla mientras llega la pagina siguiente.

---

## 9. Limites conocidos

Cosas que dependen del backend y estan marcadas en el codigo:

1. **Orden en el servidor.** `GET /products` no acepta un parametro de orden,
   asi que la tabla ordena solo las filas de la pagina visible. Cuando el
   backend acepte `sort`/`order`, hay que moverlo a los filtros.
2. **Metricas del panel.** "Productos por categoria" hace una consulta por
   categoria (tope de 8). Con un endpoint tipo `GET /dashboard/metrics` se
   reduce a una sola llamada.
3. **Editar la empresa.** No existe `PATCH /companies/current`, asi que la
   ficha de la empresa es de solo lectura.
4. **Cambiar el rol o quitar a un miembro.** El backend solo expone alta y
   listado de miembros.
5. **Logout del lado del servidor.** `POST /auth/logout` no revoca nada todavia
   (haria falta una denylist en Redis por `jti`); el frontend borra las cookies.
6. **E2E.** Hay una suite minima en `e2e/` que cubre login, cookies httpOnly,
   el bloqueo del proxy y la busqueda en servidor. Se salta sola si faltan
   `E2E_EMAIL` y `E2E_PASSWORD`, igual que los tests de integracion del backend
   se saltan sin PostgreSQL.
7. **Barra lateral plegada.** No se recuerda entre recargas a proposito: un
   `persist` de Zustand se rehidrata despues del HTML del servidor y provoca un
   salto visible. El sitio correcto seria una cookie que lea el layout.

---

## 10. Diseño: liquid glass

Tres capas, y ese orden importa:

1. **Luz ambiental.** El `body` lleva cuatro focos radiales muy abiertos (azul,
   cian y un apunte violeta) sobre un gris frio, con `background-attachment:
   fixed`. Sin esta capa el cristal no tendria nada que refractar y las
   superficies translucidas se verian simplemente grises.
2. **Superficies translucidas.** Tres utilidades en `globals.css` marcan la
   jerarquia del material: `glass-thin` (filas, chips), `glass` (tarjetas,
   paneles) y `glass-thick` (dialogos, menus). `glass-nav` es la variante oscura
   de la barra lateral. Cada una combina un color con alfa, `backdrop-filter`
   con desenfoque y saturacion, y su propio nivel de sombra.
3. **Borde especular.** Un reflejo interior de 1 px arriba y una sombra interior
   abajo. Es el detalle que hace que se lea como cristal y no como una caja
   borrosa. Encima, `GlassPanel` mueve un brillo radial que **sigue al puntero**,
   escribiendo variables CSS en el nodo (nunca estado de React, que
   re-renderizaria en cada pixel del raton).

La barra lateral y la cabecera **flotan**: van redondeadas y separadas de los
bordes, para que se vea la luz pasar por detras.

Todo sale de variables en `:root` y `.dark`. Ningun componente lleva un color
fijo: para cambiar la identidad visual se tocan los tokens, nada mas.

### Movimiento

Con `motion` (antes Framer Motion) y una sola curva compartida,
`cubic-bezier(0.16, 1, 0.3, 1)`: salida rapida, frenada larga.

| Donde | Que hace |
| --- | --- |
| Entrada de pagina | Contenido nuevo entra y el anterior sale (`AnimatePresence` por ruta) |
| Metricas y filas | Escalonadas, no todas a la vez |
| Cifras del panel | Cuentan hasta su valor |
| Item activo del menu | Un unico indicador que **se desliza** entre secciones (`layoutId`) |
| Barras por categoria | Crecen desde cero, escalonadas |
| Botones y tarjetas | Se hunden al pulsar, se elevan al pasar el puntero |
| Esqueletos de carga | Un reflejo recorre la superficie (`shimmer`) |

`MotionConfig reducedMotion="user"` y un bloque
`@media (prefers-reduced-motion: reduce)` desactivan el movimiento para quien lo
pide: se conserva el diseño, desaparece el desplazamiento.

### El grafico del panel

"Por categoria" es **una sola medida** repartida entre categorias, asi que todas
las barras llevan el mismo azul: pintar cada categoria de un color distinto
sugeriria series independientes que no existen. Sin leyenda (el titulo ya nombra
la medida), con el valor en la punta de cada barra en lugar de un eje, y sin
barras cuando solo hay una categoria (comparar una cosa con nada no aporta: la
cifra es el grafico).

El azul es el primario de la aplicacion, comprobado a >= 3:1 de contraste sobre
la superficie de cristal en modo claro y oscuro.

### Accesibilidad del cristal

El material translucido baja el contraste, asi que el texto nunca se apoya solo
en el: las superficies de contenido mantienen alfa alta, los estados usan texto
ademas de color, y los focos siguen siendo visibles sobre cualquier fondo.

Hay modo claro, oscuro y automatico. La interfaz funciona desde 400 px de ancho.
