# Auditoría inicial de SelloGo — 1 de noviembre de 2026

**Alcance:** inspección estática del repositorio `SellogoMx/sellogo-app` (rama main), especialmente `config.js`, `admin.html`, `tarjeta.html` y `sellogo-studio-2-prueba.html`. No se han ejecutado operaciones de escritura contra Supabase ni cambiado los datos de clientes.

## Resultado preliminar

- **Separación de secretos:** `config.js` exporta una clave `sb_publishable_...`, no una `service_role` en el archivo revisado. Esto es lo correcto para una web pública, pero NO demuestra que la base de datos esté protegida.
- **Autorización administrativa:** `admin.html` comprueba al usuario autenticado con `supabase.auth.getUser()` y consulta la tabla `administradores`. **No basta como control de seguridad**: cada función RPC y política RLS debe validar autorización en el servidor.
- **Operaciones de riesgo:** el panel invoca RPCs para `sellogo_cambiar_estado`, `sellogo_guardar_diseno`, `sellogo_editar_promocion`, `sellogo_crear_negocio`, `sellogo_asignar_empleado`, `sellogo_asignar_propietario`, `sellogo_retirar_propietario`, `sellogo_autorizar_whatsapp_reporte`, `sellogo_resolver_solicitud`. Revisar definiciones, permisos EXECUTE y políticas; **no se puede confirmar su seguridad desde HTML**.
- **Identificadores de tarjetas:** `tarjeta.html` usa almacenamiento local y un endpoint de Edge Functions. Confirmar que los identificadores no autorizan por sí solos operaciones de canje o entrega de sellos.
- **Redirección Google:** el login en `admin.html` utiliza `new URL('admin.html', window.location.href)`. En archivos Studio de prueba puede redirigir al panel original; comprobar si es intencional.
- **Historial y copias de seguridad:** el HTML contempla estadísticas y reportes; esto no demuestra la existencia de un registro de auditoría inmutable ni de respaldos restaurables.
- **Supabase conectado a esta sesión:** únicamente aparece el proyecto `refaccionaria-el-tapatio`. La web SelloGo apunta a otro proyecto mediante `config.js`; por tanto, **no se ha podido auditar el proyecto de base de datos SelloGo**. No confundirlos ni modificar el de la refaccionaria.

## Bloqueantes antes de producción

1. Conectar el proyecto Supabase de **SelloGo** (el que utiliza `config.js`) para inspeccionar RLS, grants, RPCs, Edge Functions y backups.
2. Probar roles separados: visitante, cliente, empleado, propietario de otro negocio y administrador.
3. Verificar que ninguna operación de sello/canje pueda repetirse, suplantarse ni ejecutarse sin permisos.
4. Asegurar trazabilidad: operación, negocio, actor autenticado, tarjeta, fecha y motivo; evitar escrituras directas desde el navegador.
5. Probar restauración de respaldo en entorno aislado antes de declarar recuperación garantizada.
6. Validar el flujo completo de los QR ya impresos de El Tapatío y Taller Hernández.
7. Corregir y probar Studio en una rama/archivo separado antes de tocar `admin.html` o `tarjeta.html`.

## Política de cambios

- No modificar enlaces `tarjeta.html?negocio=...` existentes.
- No cambiar saldos, tokens, recompensas, datos ni permisos en producción sin pruebas y aprobación.
- No desplegar automáticamente cambios visuales o de seguridad.
- Preparar propuestas en rama separada y revisarlas antes de fusionar.

**Estado:** auditoría inicial de frontend realizada; auditoría de seguridad backend pendiente de acceso al proyecto Supabase correcto.
