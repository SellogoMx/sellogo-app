# Auditoría de seguridad Supabase — SelloGo 4.0

Fecha de revisión: noviembre de 2026. Fuente: asesores oficiales de Supabase y lectura de definiciones SQL de funciones. **Sin cambios de producción.**

## Hallazgos prioritarios

### 1. Función `public.rls_auto_enable()` — advertencia de seguridad

Supabase informa que el rol anónimo puede ejecutar una función `SECURITY DEFINER`. La función devuelve `event_trigger` y se usa para activar RLS al crear tablas. No está diseñada para ser una RPC pública. La ejecución vía API podría fallar por su tipo de retorno, pero **no debe asumirse que ese comportamiento constituye una barrera de seguridad**.

**Corrección propuesta, NO ejecutada:** revisar dependencias del event trigger y restringir los privilegios EXECUTE de `PUBLIC`, `anon` y `authenticated`, conservando los permisos del propietario/administrador. Probar en un entorno aislado antes de aplicar.

Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

### 2. `public.sellogo_diseno_publico(p_slug text)` — acceso anónimo aparentemente intencional

La función solo devuelve atributos visuales de la tarjeta por slug: nombre del diseño, colores, URLs de logo/fondo, icono y tipografía. El acceso público puede ser necesario para tarjetas accesibles mediante QR. **No revocar sin probar primero el flujo de tarjeta pública.**

Revisar también que las URL de imágenes no contengan información privada y que no existan datos personales en las columnas devueltas.

### 3. Funciones `SECURITY DEFINER` para usuarios autenticados

El asesor informa múltiples funciones ejecutables por `authenticated`. Algunas, como `agregar_sello`, `canjear_recompensa` y `sellogo_retirar_sello`, validan pertenencia al negocio en su definición. Esto no prueba que todas las demás estén protegidas: auditar una por una las funciones administrativas, de registro y de propietarios.

### 4. Siete tablas con RLS sin políticas

`contactos_reportes`, `movimientos`, `propietarios_negocios`, `sellogo_accesos_tarjetas`, `sellogo_cuotas_registro`, `sellogo_limites_registro` y `solicitudes_negocios`. RLS sin políticas suele bloquear el acceso directo a roles de API; las RPC privilegiadas pueden seguir accediendo. **No crear políticas abiertas para silenciar el aviso.**

Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### 5. Rendimiento

El asesor informa seis claves foráneas sin índice de apoyo, tres índices sin uso observado y políticas SELECT permisivas múltiples en `clientes` y `tarjetas`. Revisar cargas y planes de consulta antes de añadir o quitar índices; no son una justificación para modificar la base en producción sin pruebas.

Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

## Reglas para corregir

1. Mantener intactos `tarjeta.html`, los QR y las tarjetas activas, especialmente Taller Automotriz Hernández.
2. No cambiar permisos de RPC públicas sin verificar qué páginas las llaman.
3. No ejecutar migraciones de prueba sobre la base de datos de producción.
4. Tras aplicar correcciones aprobadas, repetir los asesores de Supabase y pruebas de acceso con cuentas ficticias.
5. No considerar resuelta una advertencia hasta verificar la corrección real.

**Estado:** diagnóstico realizado; correcciones de base de datos pendientes.

## Revisión posterior: protección de contraseñas filtradas

El asesor de seguridad también reporta `auth_leaked_password_protection` (WARN, 1 hallazgo): la protección de Supabase Auth frente a contraseñas comprometidas no está habilitada.

**Acción recomendada, pendiente:** revisar en Supabase Dashboard → Authentication → Settings la opción de protección de contraseñas filtradas y habilitarla si el plan actual la ofrece, verificando el impacto en el inicio de sesión y los flujos de cambio de contraseña. No se modificó la configuración de Auth.

La revisión volvió a mostrar: 7 tablas con RLS sin políticas, 2 funciones SECURITY DEFINER accesibles a anon y 29 accesibles a authenticated. Los números son avisos de revisión, **no** 38 vulnerabilidades confirmadas. No revocar permisos masivamente: algunas funciones deben ser públicas o autenticadas para operar.

Referencia: https://supabase.com/docs/guides/auth/password-security

## Revisión de funciones administrativas — noviembre de 2026

Se leyeron directamente las definiciones SQL de cinco RPC `SECURITY DEFINER`. **Las cinco comprueban `auth.uid()` y pertenencia a `public.administradores` antes de acceder a datos o ejecutar modificaciones**:

- `sellogo_asignar_empleado`: valida rol (`empleado` o `administrador`), existencia de negocio y cuenta Auth.
- `sellogo_asignar_propietario`: valida negocio y cuenta Auth.
- `sellogo_cambiar_estado`: limita el estado a `activo`, `prueba` o `suspendido`.
- `sellogo_crear_negocio`: valida longitud de nombre y recompensa, slug y objetivo de sellos.
- `sellogo_listar_negocios`: solo devuelve resultados tras comprobar administración.

Las cinco usan `SECURITY DEFINER` y `SET search_path TO ''`; sus referencias a tablas se encuentran calificadas con esquema. Esto es **revisión estática del SQL**, no una prueba con credenciales de usuario. La advertencia del asesor por `EXECUTE` a `authenticated` sigue siendo válida como señal de revisión, pero estas funciones contienen autorización interna explícita. **No revocar permisos de forma masiva** ni cambiar la base de datos sin probar.

**Pendiente:** prueba negativa con cuenta no administradora y auditoría de las restantes RPC.

## Revisión de registro, tarjetas y propietarios — noviembre de 2026

Se leyeron las definiciones SQL de otras cuatro funciones `SECURITY DEFINER`:

- `sellogo_registrar_tarjeta(p_negocio_id)`: exige `auth.uid()`, verifica que el negocio esté habilitado mediante `sellogo_verificar_negocio_activo`, y usa `ON CONFLICT (negocio_id, cliente_id) DO UPDATE SET negocio_id = EXCLUDED.negocio_id`. **No reinicia los sellos ni las recompensas** al reencontrar una tarjeta existente.
- `sellogo_mis_tarjetas_cliente()`: exige sesión y filtra con `c.usuario_id = auth.uid()`.
- `sellogo_mis_negocios_propietario()`: filtra por `propietarios_negocios.usuario_id = auth.uid()`; no devuelve otros negocios en la consulta revisada.
- `sellogo_buscar_negocio_qr(p_slug)`: devuelve únicamente `id`, `nombre`, `slug` y `estado` de un negocio con estado `activo`. Es una búsqueda necesaria para el flujo de registro QR.

**Conclusión limitada:** las definiciones revisadas contienen restricciones razonables de identidad, pertenencia o estado. No son pruebas dinámicas de RLS ni de acceso entre usuarios. Queda pendiente verificar la función `sellogo_verificar_negocio_activo` y el comportamiento de errores y concurrencia.

No se ejecutaron modificaciones SQL.

## Validación del estado de negocios — noviembre de 2026

Se leyó la definición SQL de `public.sellogo_verificar_negocio_activo(p_negocio_id uuid)`. La función consulta `public.negocios.estado` y:

- Rechaza negocios inexistentes mediante `RAISE EXCEPTION 'Negocio no encontrado'`.
- Permite los estados `activo` y `prueba`.
- Rechaza otros estados (incluido `suspendido`) mediante una excepción.

La función es `SECURITY DEFINER` con `search_path TO ''`. Esta validación se invoca desde las funciones de registro y operación de sellos revisadas. **La validación de estado no sustituye la comprobación de identidad y pertenencia al negocio** que cada operación debe realizar.

**Estado:** revisión estática satisfactoria; sin pruebas dinámicas de cuentas ni modificaciones a producción.

## Revisión adicional de duplicados y abuso de registros — noviembre de 2026

Se volvió a leer `sellogo_registrar_tarjeta` y se inspeccionó `sellogo_current_client_id()`:

- `sellogo_registrar_tarjeta` usa `ON CONFLICT (usuario_id)` para reutilizar el cliente y `ON CONFLICT (negocio_id, cliente_id)` para reutilizar la tarjeta, sin restablecer sellos ni recompensas.
- `sellogo_current_client_id` devuelve el cliente vinculado a `auth.uid()`; está definida como `SECURITY DEFINER` con `row_security TO 'off'`, por lo que su filtro explícito de identidad es importante.
- Se buscaron las funciones `sellogo_verificar_cuota_registro`, `sellogo_validar_registro` y `sellogo_registrar_acceso_tarjeta`; no existen con esos nombres. **Esto no prueba que falten límites de registro**, pues pueden implementarse mediante triggers, otras funciones, tablas o la capa de aplicación.

**Pendiente:** inspeccionar triggers y cuotas reales, verificar con cuentas ficticias la resistencia a registros repetidos y revisar límites de frecuencia. Sin cambios en producción.

## Cuotas de emisión y tokens privados — noviembre de 2026

Inspección SQL de triggers, tablas, funciones y privilegios:

- No se encontraron triggers de usuario en `clientes`, `tarjetas`, `sellogo_cuotas_registro`, `sellogo_limites_registro` ni `sellogo_accesos_tarjetas`.
- `sellogo_emitir_tarjeta_interna` sí implementa cuotas mediante `sellogo_cuotas_registro`: máximo **3 emisiones por identificador y hora** y **500 por negocio y hora**. Bloquea la fila del negocio con `FOR UPDATE` para serializar la comprobación concurrente.
- Valida el formato del identificador como hash hexadecimal de 64 caracteres, exige negocio `activo`, genera token aleatorio de 32 bytes y guarda solo su SHA-256.
- `sellogo_consultar_tarjeta_privada` busca el hash SHA-256 del token recibido y solo devuelve datos de tarjetas de negocios `activo`.
- Consulta directa de `has_function_privilege`: **anon=false**, **authenticated=false**, **service_role=true** para ambas funciones. No están disponibles directamente a clientes públicos vía RPC.
- **Pendiente:** verificar qué servicio llama a estas funciones, cómo calcula el identificador, si aplica controles de frecuencia antes de invocar la función y cómo se gestionan tokens expuestos o perdidos. El límite por identificador puede evadirse si el emisor acepta identificadores arbitrarios; esta revisión SQL no prueba que ocurra.

No se ejecutaron escrituras SQL ni pruebas de emisión real.

## Auditoría de Edge Function `sellogo-tarjetas` — noviembre de 2026

Se inspeccionó el código desplegado de la Edge Function activa (versión 5), **sin desplegar cambios**:

- `verify_jwt=false`: endpoint público intencional para emisión/consulta de tarjetas; se debe proteger con controles de abuso independientes.
- Solo admite `POST` y preflight `OPTIONS`; valida acción `consultar` o `emitir`.
- Para consulta exige token hexadecimal de 64 caracteres y llama a `sellogo_consultar_tarjeta_privada`.
- Para emisión valida `slug`, exige `SELLOGO_RATE_LIMIT_SECRET`, calcula HMAC-SHA256 de `slug:ip` y llama a `sellogo_emitir_tarjeta_interna` con el identificador calculado en el servidor.
- Utiliza una clave interna `sb_secret_` del entorno para las RPC privadas; no se encontró exposición de esa clave en el cuerpo de respuesta.
- Traduce errores de cuota a HTTP 429.
- **Riesgo pendiente de verificar:** `identificarOrigen` usa el primer valor de `x-forwarded-for` sin comprobación explícita de la cadena de proxies. La seguridad del límite por identificador depende de que el gateway elimine o sobrescriba cabeceras de IP proporcionadas por el cliente. Verificar la política efectiva del gateway y, si corresponde, reforzar en el borde.
- **Otro punto:** el límite de 3 emisiones por IP y negocio por hora puede afectar a clientes legítimos que comparten red (por ejemplo, Wi-Fi del establecimiento). Evaluar experiencia de usuario antes de modificar cuotas.

No se realizaron peticiones de emisión de prueba, cambios en producción ni despliegues.

## Integración real de QR público y riesgo de Wi-Fi compartido — noviembre de 2026

Se inspeccionaron los archivos del repositorio:

- `tarjeta.html` utiliza `/functions/v1/sellogo-tarjetas` como endpoint público. Primero busca un token en `localStorage`; si no existe, llama a `accion=emitir` con `slug` y guarda el token recibido. Luego consulta con `accion=consultar`. Por tanto, **el límite de emisión sí afecta directamente a los QR públicos actuales**.
- `cliente.html` es un flujo distinto: llama a la RPC autenticada `sellogo_registrar_tarjeta`. No debe confundirse con el flujo de `tarjeta.html`.
- Con el límite de 3 emisiones por IP/negocio/hora de `sellogo_emitir_tarjeta_interna`, varios clientes nuevos compartiendo Wi-Fi o una IP de operador móvil pueden sufrir falsos bloqueos. El límite se aplica al hash `slug:IP` generado por el servicio.
- La Edge Function usa el primer valor de `x-forwarded-for` sin validar explícitamente un proxy confiable. **No se ha confirmado** si el gateway de Supabase sobrescribe cabeceras proporcionadas por el cliente; no afirmar que exista explotación hasta verificarlo.
- Recomendación de diseño: validar la IP en un borde confiable, combinar límite por IP con límite global y señales adicionales, y definir una política compatible con comercios de alto tráfico. Probar primero con escenarios controlados antes de desplegar.
- **No se modificó `tarjeta.html`, no se emitieron tarjetas ni se alteraron cuotas.**
