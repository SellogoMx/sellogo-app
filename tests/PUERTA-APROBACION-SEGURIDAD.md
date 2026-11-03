# Puerta de aprobación para seguridad de SelloGo 4.0

Estado: pendiente de pruebas reales. Este documento no activa cambios.

## Requisitos antes de desplegar
- [x] Pruebas locales de cuotas y redes compartidas incorporadas a CI.
- [x] Prototipo aislado de decisión por riesgo.
- [ ] Comprobar en un entorno controlado si el gateway sustituye cabeceras IP aportadas por el visitante.
- [ ] Revisar y respaldar las definiciones actuales de las funciones de emisión y consulta.
- [ ] Ensayar registro, consulta, sellos y canjes con datos de prueba.
- [ ] Ensayar solicitudes simultáneas y reversión sin perder registros.
- [ ] Confirmar que no hay costos adicionales.

## Condición de bloqueo
Si falta cualquiera de las verificaciones pendientes, no cambiar la función activa de registro QR ni las cuotas de la base de datos.

## Plan de reversión
Guardar antes de cualquier despliegue una versión revisada del código y las definiciones de base de datos. Si aparecen fallos, detener el despliegue y restaurar la versión previamente validada; comprobar consultas, sellos y canjes. No eliminar ni reiniciar datos de clientes.

## Límite de la evidencia
Las pruebas locales comprueban modelos y reglas de decisión, no la autenticidad de la IP observada por el gateway real.
