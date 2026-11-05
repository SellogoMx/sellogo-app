# Preparación Google Wallet — SelloGo

Estado: solicitud de acceso a publicación en revisión. Esta rama NO emite pases y NO altera producción.

## Diseño
- Tipo: loyalty pass de Google Wallet, un objeto por cliente y comercio; clase por comercio o esquema según revisión técnica.
- Branding: nombre y arte autorizados de cada negocio, sin sustituirlos por SelloGo automáticamente.
- Mostrar nombre del negocio, identificador de fidelidad, sellos actuales, meta y recompensa.
- Código de barras/QR: token opaco y revocable emitido por backend; nunca usar credenciales ni datos personales dentro del QR.
- Identidad visual real: utilizar logotipos aprobados, no inventar ni copiar logotipos de otros clientes.

## Arquitectura segura pendiente
1. Obtener issuer ID del entorno Google Wallet, configurar proyecto Google Cloud y habilitar Google Wallet API.
2. Crear cuenta de servicio con permisos mínimos y autorizarla en Wallet Console; mantener claves en gestor de secretos, nunca en GitHub Pages, HTML, JS ni repositorio.
3. Backend autenticado valida negocio y cliente y genera JWT firmado para 'Add to Google Wallet'. No generar JWT desde el navegador.
4. Mapear identificadores internos a objetos Wallet sin exponer datos personales.
5. En cada sello confirmado, actualizar objeto Wallet con API REST desde backend; reintentos idempotentes y trazabilidad.
6. Controlar revocación y reconciliación; probar solo con tarjetas de demostración antes de habilitar comercios reales.
7. Solicitar autorización expresa antes de desplegar cambios a tarjeta.html o a datos de clientes.

## Protección de clientes
- No modificar Taller Automotriz Hernández ni otros negocios existentes durante la preparación.
- No crear nuevos sellos, pedidos ni alterar registros.
- Vista previa wallet-vista-previa.html es completamente estática y separada.

## Pendientes
- Issuer ID y aprobación de publicación.
- Definir proveedor de backend y secretos; validación de costos y permisos.
- Arte oficial y configuración por negocio.
- Pruebas funcionales y seguridad con cuenta de demostración.
