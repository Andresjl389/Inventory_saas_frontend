# Inventory SaaS — Frontend

Dashboard multi-empresa construido sobre la arquitectura de `FRONTEND.md`:
Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui, con TanStack Query
para el estado del servidor y Zustand para el de la interfaz.

> Estado: **completo contra la API actual**, y verificado contra ella.
>
> Empresa: panel, productos (con imagenes), categorias, bodegas, inventario,
> movimientos, clientes, proveedores, ventas, compras, informes, auditoria,
> importacion masiva, miembros, roles y notificaciones.
>
> Plataforma: resumen, supervision de empresas con metricas, ficha de empresa,
> carga inicial, usuarios, planes y auditoria global.

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
| `pnpm seed` | Siembra un entorno de demostracion (ver abajo) |

### Datos de demostracion

`scripts/seed-demo.mjs` deja la instalacion con dos empresas, cinco roles
distintos, catalogo, stock, compras, ventas y alertas de bajo minimo. Sirve
para ver como se comporta cada rol sin inventar datos a mano.

Siembra **por la API**, no por SQL. Cuesta mas, pero a cambio los datos salen
consistentes: el stock existe porque hay compras que lo entraron, los
movimientos cuadran con las ventas y la auditoria queda escrita. Un `INSERT`
directo deja una base que el backend nunca habria producido.

```bash
# 1. El super administrador no se puede crear por API (huevo y gallina)
cd ../backend && uv run python -m app.cli create-superuser \
  --email ops@demo.com --password plataforma-2026

# 2. El resto si
cd ../frontend && pnpm seed

# 3. Opcional: llena la campana de notificaciones
cd ../backend && make low-stock
```

Todas las cuentas usan la contrasena `demo-2026`:

| Cuenta | Rol | Empresa |
| --- | --- | --- |
| `ops@demo.com` | Plataforma (`plataforma-2026`) | ninguna, a proposito |
| `ada@demo.com` | OWNER | Ferreteria El Tornillo |
| `carlos@demo.com` | ADMIN | **las dos** (para el selector de empresa) |
| `diana@demo.com` | INVENTORY_MANAGER | Ferreteria El Tornillo |
| `esteban@demo.com` | SELLER | Ferreteria El Tornillo |
| `fabiola@demo.com` | SELLER | Ferreteria El Tornillo |
| `bruno@demo.com` | OWNER | Distribuidora La Sabana |

Es re-ejecutable: el catalogo que ya existe se reutiliza, y si la empresa ya
tiene compras, la parte operativa no se repite (duplicaria el historico y
volveria a subir el stock, dejando vacio el informe de bajo minimo). Para
sembrar de cero, borra la empresa desde `/admin` y vuelve a ejecutarlo.

Dos limites que conviene saber: las ventas y compras quedan con la fecha de
hoy, porque la API no acepta fechas retroactivas, asi que los informes por
periodo solo muestran el dia actual; y la empresa "El Tornillo" incluye un rol
propio, `CAJERO`, que existe para ejercitar el camino de los roles que no son
del sistema.

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

**No hay autoservicio.** Registrarse crea una cuenta y nada mas: `POST
/api/v1/companies` no existe (responde `405`). Las empresas las da de alta el
super administrador desde `/admin`, nombrando a su dueno en la misma llamada.
Por eso una cuenta recien creada cae en `/select-company` con `GET /companies`
vacio, y esa pantalla no ofrece crear nada: explica a quien pedir acceso.

Agregar a alguien al equipo (`POST /companies/current/members`) tampoco exige
que ya tenga cuenta. Si no la tiene, el backend responde
`ACCOUNT_DETAILS_REQUIRED` y el dialogo revela nombre, apellido y contrasena
para crearla en el mismo paso. Nadie puede cambiarse el rol ni desactivarse a
si mismo (`CANNOT_CHANGE_OWN_ROLE`, `CANNOT_DEMOTE_SELF`,
`CANNOT_DEACTIVATE_SELF`), asi que esas acciones no aparecen en la propia fila.

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

### Permisos

El backend esta migrando los roles de un enum fijo a filas en `roles`, con sus
permisos en `role_permissions`, y cada empresa puede definir los suyos encima de
los del sistema. Un mapa fijo en el frontend no puede conocer esos roles
propios, asi que `src/config/permissions.ts` funciona en este orden:

1. Si la sesion trae un conjunto de permisos del servidor, **manda ese** y nada
   mas. Un rol propio (`CAJERO`, por ejemplo) funciona sin tocar el frontend.
2. Si no lo trae y el rol permite leer `GET /roles`, manda lo que diga ese
   endpoint, que es lo mismo que aplica el backend. **Ojo con el orden:** la
   lista trae primero los roles del sistema, y una empresa puede definir uno
   propio **con el mismo codigo**. Gana el que tiene `company_id` no nulo.
3. Si el rol no puede leer `/roles` (ni SELLER ni INVENTORY_MANAGER tienen
   `roles.read`), cae en una copia local de los permisos de los cuatro roles
   del sistema. Son inmutables en el backend, asi que no se desincroniza; lo
   unico invisible ahi es un rol propio que pise uno del sistema.
4. Ante un rol desconocido sin permisos del servidor, no concede nada: es
   preferible a adivinar, porque el backend lo rechazaria igual.

`Membership` acepta el codigo del rol como `role` (contrato de hoy) o como
`role_code` (el que viene), asi que el cambio de contrato no obliga a tocar
ninguna pantalla.

Todo esto solo **oculta botones**. Un boton oculto no es seguridad:
`require_permission(...)` vuelve a comprobarlo todo, y RLS por debajo.

---

## 5. Estructura

```
src/
├── app/
│   ├── (auth)/            login, registro
│   ├── (dashboard)/       layout con AppShell + paginas de la empresa
│   ├── (platform)/        area de super administrador (/admin)
│   ├── api/
│   │   ├── auth/          login, register, logout, refresh  (escriben cookies)
│   │   ├── bff/[...path]/ proxy hacia FastAPI
│   │   └── session/       empresa activa
│   └── select-company/
│
├── features/              auth, companies, roles, dashboard, products,
│                          categories, warehouses, inventory, partners,
│                          customers, suppliers, sales, purchases, reports,
│                          audit, notifications, files, imports, platform
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

1. **Nombres junto a los ids.** `ProductStockDTO`, `StockMovementDTO`,
   `SaleItemDTO` y `PurchaseItemDTO` solo traen `product_id`; `SaleDTO` y
   `PurchaseDTO`, solo `customer_id` / `supplier_id`. El frontend los resuelve
   cargando una pagina del catalogo (`useProductDirectory`), lo que **se queda
   corto por encima de 100 productos** y lo avisa en pantalla. Incluir
   `product_name` y `product_sku` en esas respuestas haria innecesario ese
   hook. El informe de bajo minimo ya lo hace bien: trae los nombres.
2. **`is_superuser` en `/auth/me`.** Sin el, saber si alguien administra la
   plataforma exige sondear `/admin/stats` (seccion 10).
3. **Permisos de un rol propio.** `MembershipDTO` trae el codigo del rol pero
   no sus permisos, y `GET /roles` exige `roles.read`, que ni SELLER ni
   INVENTORY_MANAGER tienen. Para los roles del sistema no importa (son
   inmutables y hay copia local), pero **una empresa que cree su propio rol sin
   `roles.read` deja a esa gente sin menu**, y tampoco se ve un rol propio que
   pise el codigo de uno del sistema. Incluir `permissions` en `MembershipDTO`,
   o dejar que cualquiera lea su propio rol, lo cierra.
4. **Orden en el servidor.** Ningun listado acepta un parametro de orden, asi
   que las tablas ordenan solo las filas de la pagina visible.
5. **Metricas del panel.** "Productos por categoria" hace una consulta por
   categoria (tope de 8). Los informes ya salen de endpoints agregados; el
   panel podria hacer lo mismo.
6. **Editar la empresa desde dentro.** No existe `PATCH /companies/current`
   (si `PATCH /admin/companies/{id}`), asi que la ficha en Ajustes es de solo
   lectura.
7. **Marcar todas las notificaciones.** No hay endpoint para eso: el boton
   recorre las visibles una a una.
8. **Sin tiempo real.** Ni websockets ni SSE: las notificaciones se consultan
   cada 60 s y al volver a la pestana.
9. **Las cuotas de plan no bloquean.** `max_users`, `max_products` y
   `max_warehouses` se muestran en la ficha de empresa, pero el backend no
   impide pasarse. La interfaz informa; no miente diciendo que bloquea.
10. **Sin numeracion consecutiva.** Ventas y compras se identifican por UUID, y
   la interfaz muestra sus primeros ocho caracteres. No hay "Factura #0001".
11. **Logout del lado del servidor.** `POST /auth/logout` no revoca nada todavia
   (haria falta una denylist en Redis por `jti`); el frontend borra las cookies.
12. **E2E.** Hay una suite en `e2e/` que cubre login, cookies httpOnly,
   el bloqueo del proxy, la busqueda en servidor, el area de plataforma y el
   asistente de importacion (que se detiene en la simulacion, sin escribir). Se
   salta sola si faltan las credenciales, igual que los tests de integracion
   del backend se saltan sin PostgreSQL.
13. **Barra lateral plegada.** No se recuerda entre recargas a proposito: un
   `persist` de Zustand se rehidrata despues del HTML del servidor y provoca un
   salto visible. El sitio correcto seria una cookie que lea el layout.

---

## 10. Importacion masiva

El flujo mas complejo de la aplicacion, y **dos fases a proposito**: nada se
adivina en silencio.

```text
1. elegir entidad  →  descargar plantilla (el camino corto)
2. subir archivo   →  el backend propone un mapeo. NO escribe nada
3. ajustar mapeo   →  vista previa recalculada
4. simular         →  ejecuta de verdad y revierte
5. importar        →  la misma operacion, sin revertir
```

Tres decisiones que no son obvias:

- **`raw` y `value` van juntos en la vista previa.** Es donde el usuario ve que
  su `1.200` se leyo como 1200 y no como 1,2. Si solo se mostrara el valor
  interpretado, ese error aparece despues de cargar, y entonces ya duele. El
  original solo se pinta cuando difiere: si no, es ruido.
- **Guardar el mapeo y simular van encadenados.** El backend simula lo que
  tiene guardado, asi que lanzar `PATCH /mapping` y `POST /validate` a la vez
  validaria el mapeo anterior. El orquestador los espera en orden.
- **Los numeros de la simulacion no son una estimacion.** `validate` ejecuta la
  carga dentro de un savepoint y la revierte, asi que es exactamente lo que va
  a pasar. Por eso se pide confirmar.

El orden de entidades que ofrece la pantalla es el que impone el dominio: un
producto necesita su categoria y el stock necesita producto y bodega.

El tipo MIME lo valida el backend, y el navegador no siempre acierta con el de
un `.csv`, asi que en cliente se acepta tambien por extension y el backend
queda como ultima palabra.

---

## 11. Area de plataforma (super administrador)

Vive en `/admin`, fuera del grupo `(dashboard)`, y esa separacion no es
cosmetica: **quien opera el SaaS puede no pertenecer a ninguna empresa**. De
hecho el primer superusuario, el que crea `make superuser`, no pertenece a
ninguna. Por eso:

- `proxy.ts` exige sesion en `/admin`, pero **no** empresa activa. Sin esa
  excepcion, el administrador quedaria atrapado en `/select-company`.
- `/select-company` lo manda a `/admin` cuando no tiene ninguna membresia. El
  login decide a donde ir mirando `GET /companies`, que para el devuelve `[]`,
  asi que sin esto caeria en un selector sin nada que elegir. La sonda de
  `/admin/stats` solo corre en ese caso; quien administra la plataforma y
  ademas trabaja dentro de una empresa sigue viendo el selector.
- `SessionProvider` acepta sesiones **sin tenant**. Dentro de `/admin` no hay
  `TenantStoreProvider`, asi que `useTenant()` falla ahi a proposito: no hay
  empresa que devolver.
- El layout comprueba que sea administrador y, si no, manda a `/dashboard`.

### Como se sabe que alguien es administrador de plataforma

`UserDTO` no expone `is_superuser`, asi que la unica senal disponible es
preguntar por un endpoint de plataforma: si `GET /admin/stats` responde, lo es.
Es una sonda, no un dato: el dia que `/auth/me` incluya ese campo, sobra.

### Como distinguirlo de un vistazo

El area lleva `data-scope="platform"`, que cambia el acento a ambar y la luz
ambiental a tonos calidos. Confundir "estoy operando la plataforma" con "estoy
dentro de una empresa" es el error caro de esta pantalla, y un color se lee mas
rapido que un texto.

Lo que cubre: resumen de la instalacion, alta de empresas (con propietario y
plan en una sola llamada), suspender y reactivar, miembros y suscripcion de
cada empresa, cuentas de usuario (incluido conceder acceso de plataforma),
planes y la auditoria de todas las empresas.

La ficha de empresa tambien **agrega miembros y les cambia el rol**
(`POST`/`PATCH /admin/companies/{id}/members`). Es la via de reparacion para
una empresa que se quedo sin nadie que pueda administrarla: desde dentro no
habria forma de arreglarlo. Ahi solo se ofrecen roles del sistema, porque los
propios de la empresa salen de `GET /roles`, que necesita un tenant activo y el
super administrador no tiene ninguno.

---

## 12. Diseño: liquid glass

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
