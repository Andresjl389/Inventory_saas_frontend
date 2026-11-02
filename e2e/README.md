# Pruebas E2E

Necesitan tres cosas a la vez: FastAPI corriendo, el frontend corriendo y un
usuario que exista de verdad en la base de datos.

```bash
# terminal 1
cd ../backend && make run

# terminal 2
pnpm dev

# terminal 3
E2E_EMAIL=tu@correo.com E2E_PASSWORD=tu-contrasena \
E2E_ADMIN_EMAIL=ops@example.com E2E_ADMIN_PASSWORD=tu-contrasena \
  pnpm test:e2e
```

Sin esas variables los tests se saltan en vez de fallar, para que
`pnpm test:e2e` no rompa una pipeline que no tiene backend.

`E2E_ADMIN_*` tiene que ser un superusuario; se crea con
`cd ../backend && make superuser email=ops@example.com`. Los tests de
plataforma comprueban lo que es facil romper sin darse cuenta: que `/admin` no
exige empresa activa, y que un usuario normal no entra.

**Ninguno escribe en la base.** `imports.spec.ts` se detiene en la simulacion,
y `members.spec.ts` envia a proposito un correo que no existe: el backend
responde `ACCOUNT_DETAILS_REQUIRED` y el test comprueba que el dialogo pide los
datos de la cuenta, sin llegar a crearla.
