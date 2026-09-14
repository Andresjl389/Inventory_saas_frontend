# Pruebas E2E

Necesitan tres cosas a la vez: FastAPI corriendo, el frontend corriendo y un
usuario que exista de verdad en la base de datos.

```bash
# terminal 1
cd ../backend && make run

# terminal 2
pnpm dev

# terminal 3
E2E_EMAIL=tu@correo.com E2E_PASSWORD=tu-contrasena pnpm test:e2e
```

Sin `E2E_EMAIL` y `E2E_PASSWORD` los tests se saltan en vez de fallar, para que
`pnpm test:e2e` no rompa una pipeline que no tiene backend.
