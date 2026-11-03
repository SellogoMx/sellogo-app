# SelloGo 4.0 — Defensa por capas (propuesta, NO desplegada)

## Objetivo
Reducir altas automatizadas sin bloquear a clientes legítimos que comparten Wi-Fi y sin alterar tarjetas, sellos o recompensas existentes.

## Riesgos comprobados solo en simulación
- Una cuota de 3 altas/hora por IP puede bloquear a una cuarta persona en una red compartida.
- Si la IP proviene de una cabecera que el gateway no controla, un atacante podría rotarla.
- HMAC anonimiza el identificador, pero no autentica el origen de la IP.

## Diseño propuesto
1. **Gateway:** verificar mediante prueba controlada si x-forwarded-for se sobrescribe o conserva valores enviados por el visitante. No confiar en la primera entrada hasta tener evidencia.
2. **Cuota global:** mantener por ahora el límite existente por negocio; conservar transacciones atómicas en la base de datos.
3. **Cuota por origen:** no aumentar ni quitar el límite actual en producción hasta medir falsos positivos. Si el gateway no proporciona IP confiable, no usar esa cabecera como única defensa.
4. **Desafío adaptativo:** ante señales de abuso, evaluar un desafío gratuito con validación en servidor, sin obligar a todos los clientes a resolverlo. Investigar compatibilidad y límites antes de adoptar un proveedor.
5. **Identidad y duplicados:** evaluar comprobaciones mínimas por tarjeta y negocio sin almacenar datos sensibles innecesarios ni introducir identificadores fáciles de falsificar.
6. **Observabilidad:** medir rechazos 429 agregados por negocio y ventana; evitar guardar IP sin anonimizar en nuevos registros.
7. **Despliegue:** primero simulación, luego pruebas controladas sin clientes, revisión de impacto, respaldo y plan de reversión; no modificar Edge Function activa hasta superar los controles.

## Criterios de aceptación previos al despliegue
- Los clientes actuales pueden consultar tarjetas, sellar y canjear sin regresiones.
- No se expone service_role al navegador ni se concede EXECUTE público a RPC internas.
- La emisión concurrente respeta el límite global.
- Se documenta y mitiga el falso bloqueo por Wi-Fi compartido.
- La procedencia de la IP está verificada en el gateway real, no solo con pruebas locales.
- Se comprueba reversión sin pérdida de tarjetas o sellos.

**Estado:** documento de diseño exclusivamente. No se ha implementado ninguna defensa nueva en producción.
