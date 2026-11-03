# SelloGo 4.0 — plan de pruebas sin costo

**Alcance:** solo pruebas estáticas y consultas de solo lectura sobre producción. **No** registrar sellos, canjes, usuarios, negocios ni tarjetas ficticias en producción. **No** cambiar políticas RLS, datos de clientes o QR en el sitio activo.

## 1. Comprobaciones automatizadas

El flujo `.github/workflows/seguridad-estatica.yml` ejecuta:

```bash
node --test tests/seguridad-estatica.test.cjs
```

Estas pruebas detectan regresiones visibles en el frontend; **no prueban** los permisos reales de Supabase. Revisar que GitHub Actions marque el trabajo en verde antes de considerar que se ejecutó correctamente.

## 2. Matriz de pruebas de autorización (pendiente)

Solo realizar en un entorno aislado, con cuentas y tarjetas **de prueba** autorizadas, nunca con tarjetas de clientes reales.

| Caso | Identidad | Acción | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Anónimo | Invocar agregar_sello | Rechazo; sin movimiento |
| A2 | Cliente | Invocar agregar_sello | Rechazo; sin movimiento |
| A3 | Empleado negocio A | Agregar sello a tarjeta de negocio B | Rechazo; sin movimiento |
| A4 | Empleado negocio A | Canjear premio de negocio B | Rechazo; sin movimiento |
| A5 | Empleado negocio A | Retirar sello de negocio B | Rechazo; sin movimiento |
| A6 | Empleado negocio A | Operar negocio A suspendido | Rechazo; sin movimiento |
| A7 | Propietario negocio A | Estadísticas de negocio B | Rechazo |
| A8 | Empleado negocio A | Registrar un sello válido en A | Un sello o recompensa; un movimiento |
| A9 | Empleado negocio A | Canjear sin premios | Rechazo; sin saldo negativo |
| A10 | Empleado negocio A | Retirar sin sellos | Rechazo; sin saldo negativo |
| A11 | Empleado negocio A | Corrección sin motivo | Rechazo; sin movimiento |
| A12 | Dos empleados negocio A | Operar simultáneamente la misma tarjeta | Estado consistente; movimientos auditables |

**Condición de aprobación:** verificar el resultado y el estado final de la tarjeta, movimientos y saldos. Una pantalla de éxito no basta.

## 3. Respaldos y recuperación (pendiente)

- Confirmar en el panel de Supabase si el plan actual incluye respaldos programados y su retención.
- Confirmar si existe recuperación a un punto en el tiempo (PITR); no inferirlo a partir de `archive_mode=on`.
- Documentar un procedimiento de exportación y recuperación, **sin** exportar datos personales a un repositorio público.
- Hacer una restauración de prueba únicamente en un destino aislado autorizado.
- Documentar quién puede restaurar, el tiempo estimado y cómo se valida la integridad.

## 4. Reglas de publicación

1. No modificar `tarjeta.html`, enlaces QR ni datos de Taller Automotriz Hernández para probar cambios.
2. No añadir claves secretas, contraseñas ni exportaciones de base de datos al repositorio.
3. Exigir pruebas automáticas en verde y revisión visual antes de publicar cambios de interfaz.
4. Registrar resultados **reales** de las pruebas; no marcar pruebas pendientes como aprobadas.

**Estado al crear este documento:** pruebas estáticas añadidas; pruebas de autorización con cuentas ficticias y restauración de respaldos pendientes.
