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
