# SelloGo 4.0 — Plan de protección de emisión QR (sin costos extra)

Estado: propuesta técnica, **NO desplegada**. Mantener `tarjeta.html`, tokens y tarjetas actuales intactos.

## Hallazgos confirmados
- La Edge Function pública `sellogo-tarjetas` tiene `verify_jwt=false` y ofrece acciones `emitir` y `consultar`.
- Para emitir calcula HMAC-SHA256 de `slug:IP`, donde la IP es el primer valor de `x-forwarded-for`.
- La RPC `sellogo_emitir_tarjeta_interna` limita a **3 emisiones por identificador por hora** y **500 por negocio por hora**, con bloqueo de fila para concurrencia.
- El QR `tarjeta.html` reutiliza un token en `localStorage` y solo emite cuando no existe.
- Dos RPC internas no son ejecutables por `anon` ni `authenticated`, solo por `service_role`.
- **No está verificado** que el gateway sobrescriba un `x-forwarded-for` suministrado por el cliente.
- Clientes distintos en la misma red pueden compartir IP y agotar el límite de 3/hora.

## Cambios recomendados, pendientes de validar
1. **Validar procedencia de IP**: comprobar en un entorno controlado cómo Supabase Edge Functions recibe `x-forwarded-for` cuando el cliente envía ese encabezado. No aceptar el primer elemento como confiable sin verificar el comportamiento del gateway. Si no existe un identificador confiable, adoptar protección en un gateway verificado o un mecanismo alternativo.
2. **No aumentar todavía el límite de 3/hora**: hacerlo antes de corregir el origen de la IP puede facilitar abusos.
3. **Capacidad para Wi-Fi compartido**: una vez asegurada la IP, probar 5, 10 y 20 registros legítimos desde la misma red; evaluar límites globales y por IP y un mecanismo adicional contra automatización. Evitar depender únicamente de una IP, ya que puede ser compartida.
4. **Control del endpoint público**: medir respuestas 429 y 5xx sin registrar tokens privados, claves o direcciones IP completas. Evitar enviar detalles internos de errores al navegador.
5. **No romper tarjetas existentes**: mantener la consulta de tokens emitidos y no modificar el esquema de `sellogo_accesos_tarjetas` ni los QR impresos.

## Pruebas de aceptación antes de desplegar
- 10 clientes nuevos desde una misma red pueden registrarse bajo la política elegida, sin falsos bloqueos injustificados.
- Repetir el QR en el mismo navegador recupera la misma tarjeta sin crear otra.
- Solicitudes automatizadas excediendo el límite configurado reciben HTTP 429.
- Enviar cabeceras IP manipuladas no permite eludir el límite por origen.
- Un token inválido no revela información privada; un token válido conserva sus sellos.
- Un negocio suspendido no puede emitir tarjetas nuevas.
- El sistema conserva el acceso a los QR existentes de Taller Automotriz Hernández y demás negocios activos.
- Los cambios se prueban con negocios y cuentas ficticios, sin generar tarjetas reales en producción.

## Estado de verificación
Las 17 pruebas estáticas de `tests/seguridad-estatica.test.cjs` cubren regresiones del frontend, pero **no** validan el gateway, el rate limit real ni la concurrencia del backend. Requieren pruebas de integración controladas. No se ha aplicado ningún cambio de configuración o código al backend en esta etapa.
