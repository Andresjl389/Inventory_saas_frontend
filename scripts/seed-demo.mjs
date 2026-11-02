#!/usr/bin/env node
/**
 * Siembra un entorno de demostracion completo **por la API**, no por SQL.
 *
 * Hacerlo por la API cuesta mas que un `INSERT`, pero a cambio los datos salen
 * consistentes: el stock existe porque hay compras que lo entraron, los
 * movimientos cuadran con las ventas, y la auditoria queda escrita. Sembrar por
 * SQL deja una base que el backend nunca habria producido.
 *
 * Es re-ejecutable: lo que ya existe se reutiliza en vez de fallar.
 *
 *   node scripts/seed-demo.mjs
 *   API=http://localhost:8001/api/v1 node scripts/seed-demo.mjs
 *
 * El super administrador NO se puede crear por API (huevo y gallina), asi que
 * hay que crearlo antes desde el backend:
 *
 *   cd ../backend && uv run python -m app.cli create-superuser \
 *     --email ops@demo.com --password plataforma-2026
 */

const API = process.env.API ?? "http://localhost:8001/api/v1";
const PLATFORM_EMAIL = process.env.PLATFORM_EMAIL ?? "ops@demo.com";
const PLATFORM_PASSWORD = process.env.PLATFORM_PASSWORD ?? "plataforma-2026";

// Una sola contrasena para todas las cuentas de demo: esto no es produccion.
const PASSWORD = "demo-2026";

const log = (...args) => console.log(...args);
const step = (title) => log(`\n\x1b[1m${title}\x1b[0m`);

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(`${status} ${code}: ${message}`);
    this.status = status;
    this.code = code;
    this.details = details ?? {};
  }
}

async function call(method, path, { token, companyId, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(companyId ? { "X-Company-ID": companyId } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error ?? {};
    throw new HttpError(response.status, error.code ?? "HTTP_ERROR", error.message ?? "", error.details);
  }
  return payload;
}

/** Crea el recurso, y si ya existia lo busca en el listado en vez de reventar. */
async function ensure(label, create, find, duplicateCodes) {
  try {
    const created = await create();
    log(`  + ${label}`);
    return created;
  } catch (error) {
    const duplicate =
      error instanceof HttpError &&
      (duplicateCodes.includes(error.code) || error.status === 409);
    if (!duplicate) throw error;

    const existing = await find();
    if (!existing) throw error;
    log(`  = ${label} (ya existia)`);
    return existing;
  }
}

async function login(email, password) {
  const tokens = await call("POST", "/auth/login", { body: { email, password } });
  return tokens.access_token;
}

// ---------------------------------------------------------------- plataforma

async function provisionCompany(token, spec) {
  const companies = () => call("GET", "/admin/companies", { token });

  const result = await ensure(
    `empresa ${spec.name}`,
    () =>
      call("POST", "/admin/companies", {
        token,
        body: {
          name: spec.name,
          legal_name: spec.legal_name,
          document_type: "NIT",
          document_number: spec.nit,
          email: spec.email,
          phone: spec.phone,
          plan_code: spec.plan,
          owner_email: spec.owner.email,
          owner_password: PASSWORD,
          owner_first_name: spec.owner.first_name,
          owner_last_name: spec.owner.last_name,
        },
      }),
    async () => {
      const page = await companies();
      const match = page.items.find((item) => item.name === spec.name);
      return match ? { company: match } : null;
    },
    ["COMPANY_ALREADY_EXISTS", "DUPLICATE_COMPANY_DOCUMENT", "EMAIL_ALREADY_REGISTERED"],
  );

  return result.company;
}

async function addMember(token, companyId, person) {
  return ensure(
    `${person.role.padEnd(18)} ${person.email}`,
    () =>
      call("POST", `/admin/companies/${companyId}/members`, {
        token,
        body: {
          email: person.email,
          role: person.role,
          password: PASSWORD,
          first_name: person.first_name,
          last_name: person.last_name,
        },
      }),
    async () => {
      const members = await call("GET", `/admin/companies/${companyId}/members`, { token });
      return members.find((member) => member.email === person.email) ?? null;
    },
    ["MEMBERSHIP_ALREADY_EXISTS", "ACCOUNT_DETAILS_REQUIRED"],
  );
}

// ------------------------------------------------------------------- catalogo

async function seedCatalog(ctx, spec) {
  const { token, companyId } = ctx;
  const at = { token, companyId };

  step(`Catalogo de ${spec.name}`);

  const categories = {};
  for (const category of spec.categories) {
    const created = await ensure(
      `categoria ${category.name}`,
      () => call("POST", "/categories", { ...at, body: category }),
      async () => {
        const list = await call("GET", "/categories", at);
        return list.find((item) => item.name === category.name) ?? null;
      },
      ["DUPLICATE_CATEGORY_NAME"],
    );
    categories[category.name] = created.id;
  }

  const warehouses = {};
  for (const warehouse of spec.warehouses) {
    const created = await ensure(
      `bodega ${warehouse.name}`,
      () => call("POST", "/warehouses", { ...at, body: warehouse }),
      async () => {
        const list = await call("GET", "/warehouses", at);
        return list.find((item) => item.name === warehouse.name) ?? null;
      },
      ["DUPLICATE_WAREHOUSE_NAME"],
    );
    warehouses[warehouse.name] = created.id;
  }

  const products = {};
  for (const product of spec.products) {
    const created = await ensure(
      `producto ${product.sku.padEnd(10)} ${product.name}`,
      () =>
        call("POST", "/products", {
          ...at,
          body: { ...product, category_id: categories[product.category] ?? null, category: undefined },
        }),
      async () => {
        const page = await call("GET", `/products?search=${encodeURIComponent(product.sku)}&size=5`, at);
        return page.items.find((item) => item.sku === product.sku) ?? null;
      },
      ["DUPLICATE_SKU", "DUPLICATE_BARCODE"],
    );
    products[product.sku] = created.id;
  }

  return { categories, warehouses, products };
}

async function seedPartners(ctx, spec) {
  const { token, companyId } = ctx;
  const at = { token, companyId };

  step(`Clientes y proveedores de ${spec.name}`);

  const customers = {};
  for (const customer of spec.customers) {
    const created = await ensure(
      `cliente ${customer.name}`,
      () => call("POST", "/customers", { ...at, body: customer }),
      async () => {
        const page = await call("GET", `/customers?search=${encodeURIComponent(customer.name)}`, at);
        return page.items.find((item) => item.name === customer.name) ?? null;
      },
      ["DUPLICATE_CUSTOMER_DOCUMENT"],
    );
    customers[customer.name] = created.id;
  }

  const suppliers = {};
  for (const supplier of spec.suppliers) {
    const created = await ensure(
      `proveedor ${supplier.name}`,
      () => call("POST", "/suppliers", { ...at, body: supplier }),
      async () => {
        const page = await call("GET", `/suppliers?search=${encodeURIComponent(supplier.name)}`, at);
        return page.items.find((item) => item.name === supplier.name) ?? null;
      },
      ["DUPLICATE_SUPPLIER_DOCUMENT"],
    );
    suppliers[supplier.name] = created.id;
  }

  return { customers, suppliers };
}

// -------------------------------------------------------------- operacion

/**
 * El stock entra por compras, no por ajustes. Un ajuste de entrada dejaria el
 * inventario cuadrado pero sin coste ni proveedor detras, y los informes de
 * valoracion quedarian contando humo.
 */
async function seedPurchases(ctx, refs, spec) {
  const at = { token: ctx.token, companyId: ctx.companyId };
  step(`Compras de ${spec.name}`);

  const created = [];
  for (const purchase of spec.purchases) {
    const result = await call("POST", "/purchases", {
      ...at,
      body: {
        warehouse_id: refs.warehouses[purchase.warehouse],
        supplier_id: refs.suppliers[purchase.supplier] ?? null,
        notes: purchase.notes ?? null,
        complete: purchase.complete ?? true,
        update_product_costs: true,
        items: purchase.items.map((item) => ({
          product_id: refs.products[item.sku],
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      },
    });
    created.push(result);
    log(`  + compra ${result.id.slice(0, 8)} ${purchase.items.length} lineas -> ${purchase.warehouse}`);
  }
  return created;
}

async function seedSales(ctx, refs, spec) {
  const at = { token: ctx.token, companyId: ctx.companyId };
  step(`Ventas de ${spec.name}`);

  const created = [];
  for (const sale of spec.sales) {
    let result;
    try {
      result = await call("POST", "/sales", {
        ...at,
        body: {
          warehouse_id: refs.warehouses[sale.warehouse],
          customer_id: refs.customers[sale.customer] ?? null,
          notes: sale.notes ?? null,
          complete: sale.complete ?? true,
          items: sale.items.map((item) => ({
            product_id: refs.products[item.sku],
            quantity: item.quantity,
            discount: item.discount ?? 0,
          })),
        },
      });
    } catch (error) {
      if (error instanceof HttpError && error.code === "INSUFFICIENT_STOCK") {
        log(`  ! venta omitida por falta de stock (${JSON.stringify(error.details)})`);
        continue;
      }
      throw error;
    }

    // Una venta anulada y una devuelta: los estados tambien son datos de prueba.
    if (sale.then === "cancel") await call("POST", `/sales/${result.id}/cancel`, at);
    if (sale.then === "refund") await call("POST", `/sales/${result.id}/refund`, at);

    created.push(result);
    log(`  + venta ${result.id.slice(0, 8)} ${sale.items.length} lineas${sale.then ? ` -> ${sale.then}` : ""}`);
  }
  return created;
}

async function seedMovements(ctx, refs, spec) {
  const at = { token: ctx.token, companyId: ctx.companyId };
  step(`Traslados y ajustes de ${spec.name}`);

  for (const transfer of spec.transfers ?? []) {
    try {
      await call("POST", "/inventory/transfers", {
        ...at,
        body: {
          product_id: refs.products[transfer.sku],
          source_warehouse_id: refs.warehouses[transfer.from],
          destination_warehouse_id: refs.warehouses[transfer.to],
          quantity: transfer.quantity,
          notes: transfer.notes ?? null,
        },
      });
      log(`  + traslado ${transfer.sku} ${transfer.from} -> ${transfer.to} x${transfer.quantity}`);
    } catch (error) {
      if (error instanceof HttpError && error.code === "INSUFFICIENT_STOCK") {
        log(`  ! traslado omitido por falta de stock: ${transfer.sku}`);
        continue;
      }
      throw error;
    }
  }

  for (const adjustment of spec.adjustments ?? []) {
    await call("POST", "/inventory/adjustments", {
      ...at,
      body: {
        product_id: refs.products[adjustment.sku],
        warehouse_id: refs.warehouses[adjustment.warehouse],
        quantity_delta: adjustment.delta,
        notes: adjustment.notes,
      },
    });
    log(`  + ajuste ${adjustment.sku} ${adjustment.delta > 0 ? "+" : ""}${adjustment.delta} (${adjustment.notes})`);
  }
}

/**
 * Un rol propio de la empresa. Importa mas de lo que parece: el frontend
 * resuelve los permisos de un rol del sistema con una copia local, pero uno
 * propio solo se conoce preguntando a `GET /roles`.
 */
async function seedCustomRole(ctx, spec) {
  if (!spec.customRole) return;
  const at = { token: ctx.token, companyId: ctx.companyId };
  step(`Rol propio de ${spec.name}`);

  await ensure(
    `rol ${spec.customRole.code}`,
    () => call("POST", "/roles", { ...at, body: spec.customRole }),
    async () => {
      const roles = await call("GET", "/roles", at);
      return roles.find((role) => role.code === spec.customRole.code && role.company_id) ?? null;
    },
    ["DUPLICATE_ROLE_CODE"],
  );
}

// ------------------------------------------------------------------- datos

const money = (value) => value;

const TORNILLO = {
  name: "Ferreteria El Tornillo",
  legal_name: "Ferreteria El Tornillo S.A.S.",
  nit: "901456789",
  email: "contacto@eltornillo.com.co",
  phone: "6015551234",
  plan: "STANDARD",
  owner: { email: "ada@demo.com", first_name: "Ada", last_name: "Rojas" },
  team: [
    { email: "carlos@demo.com", first_name: "Carlos", last_name: "Mejia", role: "ADMIN" },
    { email: "diana@demo.com", first_name: "Diana", last_name: "Quintero", role: "INVENTORY_MANAGER" },
    { email: "esteban@demo.com", first_name: "Esteban", last_name: "Lozano", role: "SELLER" },
    { email: "fabiola@demo.com", first_name: "Fabiola", last_name: "Nieto", role: "SELLER" },
  ],
  customRole: {
    code: "CAJERO",
    name: "Cajero",
    description: "Vende y consulta, pero no toca el catalogo ni el inventario.",
    permissions: ["sales.create", "sales.read", "products.read", "customers.read", "inventory.read"],
  },
  categories: [
    { name: "Herramienta manual", description: "Lo que se usa con la mano y no lleva motor." },
    { name: "Herramienta electrica", description: "Taladros, pulidoras y afines." },
    { name: "Tornilleria", description: "Tornillos, tuercas, chazos." },
    { name: "Pinturas", description: "Vinilos, esmaltes y disolventes." },
    { name: "Electricidad", description: "Cable, tomas, interruptores." },
    { name: "Plomeria", description: "Tuberia PVC y accesorios." },
  ],
  warehouses: [
    { name: "Bodega principal", address: "Calle 13 # 27-45, Bogota" },
    { name: "Punto de venta Chapinero", address: "Carrera 13 # 60-20, Bogota" },
    { name: "Deposito Fontibon", address: "Calle 17 # 96-30, Bogota" },
  ],
  products: [
    { sku: "MAR-001", name: "Martillo de una libra", category: "Herramienta manual", cost_price: 18500, sale_price: 32900, min_stock: 10, barcode: "7701234000011" },
    { sku: "DES-001", name: "Destornillador de estrella 6\"", category: "Herramienta manual", cost_price: 6200, sale_price: 12500, min_stock: 20 },
    { sku: "DES-002", name: "Destornillador de pala 6\"", category: "Herramienta manual", cost_price: 6000, sale_price: 12000, min_stock: 20 },
    { sku: "LLA-001", name: "Llave expansiva 10\"", category: "Herramienta manual", cost_price: 24000, sale_price: 41900, min_stock: 8 },
    { sku: "ALI-001", name: "Alicate universal 8\"", category: "Herramienta manual", cost_price: 15800, sale_price: 27900, min_stock: 12 },
    { sku: "MET-001", name: "Metro de 5 metros", category: "Herramienta manual", cost_price: 9500, sale_price: 18900, min_stock: 15 },
    { sku: "TAL-001", name: "Taladro percutor 650W", category: "Herramienta electrica", cost_price: 168000, sale_price: 259900, min_stock: 4, barcode: "7701234000028" },
    { sku: "PUL-001", name: "Pulidora angular 4 1/2\"", category: "Herramienta electrica", cost_price: 142000, sale_price: 219900, min_stock: 4 },
    { sku: "SIE-001", name: "Sierra caladora 500W", category: "Herramienta electrica", cost_price: 158000, sale_price: 244900, min_stock: 3 },
    { sku: "TOR-001", name: "Tornillo drywall 1\" (caja x 1000)", category: "Tornilleria", cost_price: 28000, sale_price: 45900, min_stock: 25 },
    { sku: "TOR-002", name: "Tornillo lamina 1/2\" (caja x 500)", category: "Tornilleria", cost_price: 16000, sale_price: 27900, min_stock: 25 },
    { sku: "CHA-001", name: "Chazo plastico #8 (bolsa x 100)", category: "Tornilleria", cost_price: 7200, sale_price: 14500, min_stock: 30 },
    { sku: "TUE-001", name: "Tuerca hexagonal 1/4\" (bolsa x 100)", category: "Tornilleria", cost_price: 9800, sale_price: 18900, min_stock: 20 },
    { sku: "PIN-001", name: "Vinilo blanco tipo 1 (galon)", category: "Pinturas", cost_price: 52000, sale_price: 84900, min_stock: 10 },
    { sku: "PIN-002", name: "Esmalte sintetico negro (1/4)", category: "Pinturas", cost_price: 18900, sale_price: 32900, min_stock: 12 },
    { sku: "PIN-003", name: "Thinner corriente (galon)", category: "Pinturas", cost_price: 24000, sale_price: 39900, min_stock: 8 },
    { sku: "BRO-001", name: "Brocha de 3\"", category: "Pinturas", cost_price: 5400, sale_price: 11900, min_stock: 20 },
    { sku: "CAB-001", name: "Cable encauchetado 2x14 (metro)", category: "Electricidad", cost_price: 3800, sale_price: 6900, min_stock: 100 },
    { sku: "TOM-001", name: "Toma doble con polo a tierra", category: "Electricidad", cost_price: 7900, sale_price: 15900, min_stock: 25 },
    { sku: "INT-001", name: "Interruptor sencillo", category: "Electricidad", cost_price: 5200, sale_price: 10900, min_stock: 25 },
    { sku: "BOM-001", name: "Bombillo LED 9W", category: "Electricidad", cost_price: 6800, sale_price: 13900, min_stock: 40 },
    { sku: "TUB-001", name: "Tubo PVC 1/2\" x 6m", category: "Plomeria", cost_price: 14500, sale_price: 24900, min_stock: 15 },
    { sku: "COD-001", name: "Codo PVC 1/2\" 90 grados", category: "Plomeria", cost_price: 1200, sale_price: 2900, min_stock: 50 },
    { sku: "SIF-001", name: "Sifon para lavaplatos", category: "Plomeria", cost_price: 12800, sale_price: 23900, min_stock: 10 },
  ].map((product) => ({ ...product, cost_price: money(product.cost_price), sale_price: money(product.sale_price) })),
  customers: [
    { name: "Constructora Andina S.A.S.", document_type: "NIT", document_number: "900876543", email: "compras@andina.com.co", phone: "6012223344", address: "Av. Suba # 100-20" },
    { name: "Remodelaciones Bogota Ltda.", document_type: "NIT", document_number: "901223344", email: "pedidos@rembogota.co", phone: "6013334455" },
    { name: "Juan Pablo Herrera", document_type: "CC", document_number: "79456123", phone: "3105551212" },
    { name: "Marcela Ospina", document_type: "CC", document_number: "52789456", phone: "3128889090" },
    { name: "Edificio Los Cerezos PH", document_type: "NIT", document_number: "900334455", email: "administracion@loscerezos.co" },
    { name: "Ferreteria La Esquina", document_type: "NIT", document_number: "901556677", phone: "6014445566" },
    { name: "Hernan Dario Sepulveda", document_type: "CC", document_number: "16789012", phone: "3011234567" },
    { name: "Colegio San Bartolome", document_type: "NIT", document_number: "860012345", email: "mantenimiento@sanbartolome.edu.co" },
  ],
  suppliers: [
    { name: "Importaciones Herramex S.A.", document_type: "NIT", document_number: "800123456", email: "ventas@herramex.com.co", phone: "6015556677" },
    { name: "Distribuidora Tornisur", document_type: "NIT", document_number: "830456789", email: "pedidos@tornisur.co" },
    { name: "Pinturas del Norte Ltda.", document_type: "NIT", document_number: "811223344", phone: "6017778899" },
    { name: "Electricos Andinos S.A.S.", document_type: "NIT", document_number: "901889900", email: "contacto@electricosandinos.co" },
  ],
  purchases: [
    {
      warehouse: "Bodega principal", supplier: "Importaciones Herramex S.A.", notes: "Pedido mensual de herramienta",
      items: [
        { sku: "MAR-001", quantity: 40, unit_cost: 18500 },
        { sku: "LLA-001", quantity: 25, unit_cost: 24000 },
        { sku: "ALI-001", quantity: 30, unit_cost: 15800 },
        { sku: "MET-001", quantity: 35, unit_cost: 9500 },
        { sku: "DES-001", quantity: 60, unit_cost: 6200 },
        { sku: "DES-002", quantity: 60, unit_cost: 6000 },
      ],
    },
    {
      warehouse: "Bodega principal", supplier: "Importaciones Herramex S.A.", notes: "Herramienta electrica",
      items: [
        { sku: "TAL-001", quantity: 12, unit_cost: 168000 },
        { sku: "PUL-001", quantity: 10, unit_cost: 142000 },
        { sku: "SIE-001", quantity: 6, unit_cost: 158000 },
      ],
    },
    {
      warehouse: "Bodega principal", supplier: "Distribuidora Tornisur",
      items: [
        { sku: "TOR-001", quantity: 80, unit_cost: 28000 },
        { sku: "TOR-002", quantity: 80, unit_cost: 16000 },
        { sku: "CHA-001", quantity: 90, unit_cost: 7200 },
        { sku: "TUE-001", quantity: 60, unit_cost: 9800 },
      ],
    },
    {
      warehouse: "Bodega principal", supplier: "Pinturas del Norte Ltda.",
      items: [
        { sku: "PIN-001", quantity: 30, unit_cost: 52000 },
        { sku: "PIN-002", quantity: 36, unit_cost: 18900 },
        { sku: "PIN-003", quantity: 20, unit_cost: 24000 },
        { sku: "BRO-001", quantity: 50, unit_cost: 5400 },
      ],
    },
    {
      warehouse: "Bodega principal", supplier: "Electricos Andinos S.A.S.",
      items: [
        { sku: "CAB-001", quantity: 400, unit_cost: 3800 },
        { sku: "TOM-001", quantity: 70, unit_cost: 7900 },
        { sku: "INT-001", quantity: 70, unit_cost: 5200 },
        { sku: "BOM-001", quantity: 120, unit_cost: 6800 },
      ],
    },
    {
      warehouse: "Deposito Fontibon", supplier: "Distribuidora Tornisur", notes: "Plomeria para el deposito",
      items: [
        { sku: "TUB-001", quantity: 45, unit_cost: 14500 },
        { sku: "COD-001", quantity: 200, unit_cost: 1200 },
        { sku: "SIF-001", quantity: 25, unit_cost: 12800 },
      ],
    },
    {
      warehouse: "Bodega principal", supplier: "Importaciones Herramex S.A.",
      notes: "Pedido en transito: queda en borrador a proposito",
      complete: false,
      items: [
        { sku: "TAL-001", quantity: 8, unit_cost: 168000 },
        { sku: "MAR-001", quantity: 20, unit_cost: 18500 },
      ],
    },
  ],
  transfers: [
    { sku: "MAR-001", from: "Bodega principal", to: "Punto de venta Chapinero", quantity: 12, notes: "Surtido del punto" },
    { sku: "DES-001", from: "Bodega principal", to: "Punto de venta Chapinero", quantity: 20 },
    { sku: "BOM-001", from: "Bodega principal", to: "Punto de venta Chapinero", quantity: 40 },
    { sku: "PIN-002", from: "Bodega principal", to: "Punto de venta Chapinero", quantity: 10 },
    { sku: "TOR-001", from: "Bodega principal", to: "Deposito Fontibon", quantity: 25 },
  ],
  adjustments: [
    { sku: "COD-001", warehouse: "Deposito Fontibon", delta: -14, notes: "Rotura en el estante" },
    { sku: "BRO-001", warehouse: "Bodega principal", delta: -6, notes: "Muestras para clientes" },
    { sku: "CAB-001", warehouse: "Bodega principal", delta: 8, notes: "Sobrante del conteo fisico" },
  ],
  sales: [
    { warehouse: "Bodega principal", customer: "Constructora Andina S.A.S.", notes: "Obra Calle 100", items: [{ sku: "TOR-001", quantity: 20 }, { sku: "CHA-001", quantity: 15 }, { sku: "TAL-001", quantity: 2 }] },
    { warehouse: "Bodega principal", customer: "Remodelaciones Bogota Ltda.", items: [{ sku: "PIN-001", quantity: 8, discount: 20000 }, { sku: "BRO-001", quantity: 12 }] },
    { warehouse: "Punto de venta Chapinero", customer: "Juan Pablo Herrera", items: [{ sku: "MAR-001", quantity: 1 }, { sku: "DES-001", quantity: 2 }] },
    { warehouse: "Punto de venta Chapinero", customer: "Marcela Ospina", items: [{ sku: "BOM-001", quantity: 6 }] },
    { warehouse: "Bodega principal", customer: "Edificio Los Cerezos PH", items: [{ sku: "CAB-001", quantity: 120 }, { sku: "TOM-001", quantity: 14 }, { sku: "INT-001", quantity: 14 }] },
    { warehouse: "Bodega principal", customer: "Ferreteria La Esquina", notes: "Venta al por mayor", items: [{ sku: "TOR-002", quantity: 30 }, { sku: "TUE-001", quantity: 20 }, { sku: "CHA-001", quantity: 25 }] },
    { warehouse: "Deposito Fontibon", customer: "Colegio San Bartolome", items: [{ sku: "TUB-001", quantity: 18 }, { sku: "COD-001", quantity: 60 }, { sku: "SIF-001", quantity: 8 }] },
    { warehouse: "Punto de venta Chapinero", customer: "Hernan Dario Sepulveda", items: [{ sku: "PIN-002", quantity: 3 }] },
    { warehouse: "Bodega principal", customer: "Constructora Andina S.A.S.", items: [{ sku: "PUL-001", quantity: 3 }, { sku: "SIE-001", quantity: 2 }] },
    { warehouse: "Bodega principal", customer: "Marcela Ospina", notes: "Se arrepintio", items: [{ sku: "ALI-001", quantity: 1 }], then: "refund" },
    { warehouse: "Bodega principal", customer: "Juan Pablo Herrera", notes: "Pedido equivocado", items: [{ sku: "MET-001", quantity: 1 }], then: "cancel" },
    { warehouse: "Bodega principal", customer: null, notes: "Venta de mostrador", items: [{ sku: "LLA-001", quantity: 1 }, { sku: "MET-001", quantity: 1 }] },
  ],
};

const SABANA = {
  name: "Distribuidora La Sabana",
  legal_name: "Distribuidora La Sabana S.A.S.",
  nit: "901998877",
  email: "info@lasabana.com.co",
  phone: "6018889900",
  plan: "FREE",
  owner: { email: "bruno@demo.com", first_name: "Bruno", last_name: "Castillo" },
  team: [
    // Carlos trabaja en las dos empresas: asi el selector tiene algo que hacer.
    { email: "carlos@demo.com", first_name: "Carlos", last_name: "Mejia", role: "ADMIN" },
  ],
  categories: [
    { name: "Aseo", description: "Productos de limpieza." },
    { name: "Desechables", description: "Vasos, platos, servilletas." },
  ],
  warehouses: [{ name: "Bodega unica", address: "Autopista Norte km 19, Chia" }],
  products: [
    { sku: "ASE-001", name: "Limpiador multiusos (galon)", category: "Aseo", cost_price: 14500, sale_price: 24900, min_stock: 20 },
    { sku: "ASE-002", name: "Jabon en polvo 5kg", category: "Aseo", cost_price: 32000, sale_price: 49900, min_stock: 15 },
    { sku: "ASE-003", name: "Escoba de cerda suave", category: "Aseo", cost_price: 9800, sale_price: 18900, min_stock: 25 },
    { sku: "DES-101", name: "Vaso desechable 7oz (paquete x 50)", category: "Desechables", cost_price: 4200, sale_price: 8900, min_stock: 40 },
    { sku: "DES-102", name: "Servilleta paquete x 100", category: "Desechables", cost_price: 3100, sale_price: 6900, min_stock: 40 },
  ],
  customers: [
    { name: "Restaurante La Fonda", document_type: "NIT", document_number: "901112233", phone: "6015554433" },
    { name: "Cafeteria El Roble", document_type: "NIT", document_number: "901445566" },
  ],
  suppliers: [{ name: "Quimicos Sabana Ltda.", document_type: "NIT", document_number: "830998877" }],
  purchases: [
    {
      warehouse: "Bodega unica", supplier: "Quimicos Sabana Ltda.",
      items: [
        { sku: "ASE-001", quantity: 60, unit_cost: 14500 },
        { sku: "ASE-002", quantity: 40, unit_cost: 32000 },
        { sku: "ASE-003", quantity: 50, unit_cost: 9800 },
        { sku: "DES-101", quantity: 100, unit_cost: 4200 },
        { sku: "DES-102", quantity: 100, unit_cost: 3100 },
      ],
    },
  ],
  sales: [
    { warehouse: "Bodega unica", customer: "Restaurante La Fonda", items: [{ sku: "ASE-001", quantity: 12 }, { sku: "DES-101", quantity: 30 }] },
    { warehouse: "Bodega unica", customer: "Cafeteria El Roble", items: [{ sku: "DES-102", quantity: 25 }, { sku: "ASE-003", quantity: 4 }] },
  ],
  /*
   * Deja varios productos por debajo del minimo: es lo que alimenta el informe
   * de bajo stock y, con `make low-stock`, la campana de notificaciones.
   */
  adjustments: [
    { sku: "ASE-002", warehouse: "Bodega unica", delta: -32, notes: "Averia en bodega" },
    { sku: "DES-102", warehouse: "Bodega unica", delta: -50, notes: "Conteo fisico" },
  ],
};

// -------------------------------------------------------------------- main

async function seedCompany(platformToken, spec) {
  step(`Empresa: ${spec.name}`);
  const company = await provisionCompany(platformToken, spec);

  for (const person of spec.team) {
    await addMember(platformToken, company.id, person);
  }

  // A partir de aqui se trabaja como el propietario, no como super admin: asi
  // la auditoria refleja a un usuario real de la empresa.
  const token = await login(spec.owner.email, PASSWORD);
  const ctx = { token, companyId: company.id };

  await seedCustomRole(ctx, spec);
  const catalog = await seedCatalog(ctx, spec);
  const partners = await seedPartners(ctx, spec);
  const refs = { ...catalog, ...partners };

  /*
   * El catalogo se puede re-crear sin consecuencias, pero una compra o una
   * venta no: repetirlas duplicaria el historico y volveria a subir el stock,
   * dejando el informe de bajo minimo vacio. Si ya hay movimiento, se para
   * aqui. Para sembrar de cero, borra la empresa y vuelve a ejecutar.
   */
  const existing = await call("GET", "/purchases?size=1", { token, companyId: company.id });
  if (existing.total > 0) {
    log(`\n  La empresa ya tiene ${existing.total} compras: no se repite la operacion.`);
    return { company, ctx };
  }

  await seedPurchases(ctx, refs, spec);
  await seedMovements(ctx, refs, spec);
  await seedSales(ctx, refs, spec);

  return { company, ctx };
}

async function summarize(ctx, spec) {
  const at = { token: ctx.token, companyId: ctx.companyId };
  const [stock, lowStock, sales, valuation] = await Promise.all([
    call("GET", "/inventory/stock?size=1", at),
    call("GET", "/reports/low-stock", at),
    call("GET", "/reports/sales", at),
    call("GET", "/reports/inventory-valuation", at),
  ]);

  const cop = (value) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
      .format(Number(value ?? 0));

  log(`\n  ${spec.name}`);
  log(`    lineas de stock     ${stock.total}`);
  log(`    bajo minimo         ${lowStock.total}`);
  log(`    ventas              ${sales.summary.sales_count} por ${cop(sales.summary.revenue)}`);
  log(`    valor del stock     ${cop(valuation.total_cost_value)} al costo`);
}

async function main() {
  step("Plataforma");
  let platformToken;
  try {
    platformToken = await login(PLATFORM_EMAIL, PLATFORM_PASSWORD);
    log(`  = sesion de plataforma: ${PLATFORM_EMAIL}`);
  } catch (error) {
    log(`\n  No se pudo entrar como ${PLATFORM_EMAIL}.`);
    log("  El super administrador se crea por CLI, no por API:");
    log("\n    cd ../backend && uv run python -m app.cli create-superuser \\");
    log(`      --email ${PLATFORM_EMAIL} --password ${PLATFORM_PASSWORD}\n`);
    throw error;
  }

  const results = [];
  for (const spec of [TORNILLO, SABANA]) {
    results.push({ spec, ...(await seedCompany(platformToken, spec)) });
  }

  step("Resumen");
  for (const { ctx, spec } of results) {
    await summarize(ctx, spec);
  }

  step("Cuentas (todas con la contrasena " + PASSWORD + ")");
  log(`  ${PLATFORM_EMAIL.padEnd(22)} plataforma        contrasena: ${PLATFORM_PASSWORD}`);
  for (const spec of [TORNILLO, SABANA]) {
    log(`  ${spec.owner.email.padEnd(22)} OWNER             ${spec.name}`);
    for (const person of spec.team) {
      log(`  ${person.email.padEnd(22)} ${person.role.padEnd(17)} ${spec.name}`);
    }
  }
  log("");
}

main().catch((error) => {
  console.error(`\n\x1b[31m${error.message}\x1b[0m`);
  if (error.details && Object.keys(error.details).length > 0) {
    console.error(JSON.stringify(error.details, null, 2));
  }
  process.exit(1);
});
