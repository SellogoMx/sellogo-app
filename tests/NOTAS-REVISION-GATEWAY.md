# Revisión de gateway y cuotas QR

Se comprobó por lectura que la función de emisión usa el primer valor de x-forwarded-for. No se ha comprobado que ese valor sea inalterable por clientes externos.

La validación sintáctica aislada no demuestra autenticidad del origen. Antes de desplegar una modificación, se necesita una prueba controlada del gateway con un entorno independiente.

No cambiar la cuota de 3 registros por identificador por hora ni la cuota global de 500 por negocio por hora sin comprobar la experiencia de usuarios en redes compartidas. Mantener la protección transaccional existente.

Este archivo es documentación, no una modificación de Supabase ni una prueba del gateway.
