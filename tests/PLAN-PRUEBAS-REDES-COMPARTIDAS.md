# SelloGo 4.0 — plan de pruebas de registro QR y redes compartidas

Estado: propuesta de pruebas, sin cambios de producción. No modificar cuotas ni desplegar Edge Functions hasta validar el gateway y los escenarios.

## Comportamiento actual documentado
- `tarjeta.html` emite tokens a través de `sellogo-tarjetas` y los conserva en `localStorage`.
- `cliente.html` registra mediante una RPC autenticada distinta.
- La cuota documentada de emisión privada es de 3 por identificador/hora y 500 por negocio/hora; el identificador se deriva de `slug:IP` con HMAC en la Edge Function.
- La lectura del primer valor de `x-forwarded-for` requiere comprobar que el gateway controla o sanea la cabecera. No asumir que es confiable.

## Matriz de pruebas en entorno aislado
1. Una IP, un negocio, tres emisiones nuevas: documentar códigos HTTP y tokens.
2. Cuarta emisión dentro de la hora: verificar respuesta 429 y mensaje comprensible.
3. Cuatro clientes distintos en el mismo Wi-Fi: medir bloqueos falsos y evaluar alternativa antes de cambiar la cuota.
4. Dos negocios bajo la misma IP: verificar aislamiento de cuotas por negocio.
5. IP compartida por operador móvil: verificar experiencia con múltiples usuarios.
6. Token guardado y consulta repetida: no debe consumir cuota de emisión.
7. Token perdido o almacenamiento borrado: definir recuperación segura y comportamiento del límite.
8. Cabecera `x-forwarded-for` ausente: observar IP efectiva en gateway y manejo de errores.
9. Cabecera `x-forwarded-for` falsificada o con múltiples IP: comprobar qué valor entrega el gateway realmente; no probar contra clientes reales.
10. IPv4 e IPv6 válidas, malformadas y normalizadas: verificar resultados consistentes.
11. 500 emisiones por negocio/hora: comprobar límite global sin afectar datos reales.
12. Solicitudes concurrentes: verificar que el bloqueo transaccional evita superar cuotas.
13. Negocio suspendido o inexistente: no emitir token.
14. Tokens inválidos, caducados por política o ajenos: no filtrar datos privados.
15. Intentos con distintos `slug` y una IP: verificar que no se puede evadir una protección global.
16. Respuestas 429: comprobar `Retry-After` si se implementa y mensajes no técnicos.
17. Comprobación de RLS y privilegios de RPC con cuentas ficticias de distintos negocios.

## Criterios antes de desplegar
- Confirmar con evidencia qué cabeceras de origen son controladas por el gateway de Supabase.
- Evitar depender exclusivamente de IP como identidad del cliente; considerar límites combinados, por negocio y señales de abuso.
- No registrar IP en texto claro en logs o analíticas salvo necesidad documentada y política de retención.
- Probar con usuarios ficticios y base de datos aislada; no generar emisiones reales para medir cuotas.
- Mantener operativos los QR existentes y las tarjetas ya emitidas; plan de reversión y monitoreo.
- Repetir pruebas automáticas y dinámicas tras cualquier modificación.

Este documento **no certifica** la seguridad del gateway, la base de datos o el sistema en producción.
