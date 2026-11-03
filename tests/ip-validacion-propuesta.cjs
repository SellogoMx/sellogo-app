/**
 * Propuesta de validación de IP para SelloGo.
 * SOLO utilidades aisladas: no desplegar antes de verificar el gateway.
 *
 * Este módulo valida sintaxis. NO establece confianza en x-forwarded-for.
 * La selección de IP debe hacerla un gateway confiable.
 */
function validarIPv4(ip) {
  const partes = ip.split('.');
  return partes.length === 4 && partes.every(p =>
    /^(0|[1-9][0-9]{0,2})$/.test(p) && Number(p) <= 255
  );
}

function validarIPv6(ip) {
  if (!/^[0-9a-fA-F:.]+$/.test(ip) || !ip.includes(':')) return false;
  if (ip.includes(':::') || (ip.match(/::/g) || []).length > 1) return false;
  // Un solo ':' al principio o al final es inválido en IPv6.
  if (ip.startsWith(':') && !ip.startsWith('::')) return false;
  if (ip.endsWith(':') && !ip.endsWith('::')) return false;
  const doble = ip.includes('::');
  const grupos = ip.split(':').filter(Boolean);
  if (!grupos.every(g => /^[0-9a-fA-F]{1,4}$/.test(g))) return false;
  return doble ? grupos.length < 8 : grupos.length === 8;
}

function validarIp(ip) {
  return typeof ip === 'string' && ip.length <= 45 &&
    (validarIPv4(ip) || validarIPv6(ip));
}

function obtenerIpDesdeEncabezadoConfiable(valor) {
  if (typeof valor !== 'string' || valor.includes(',')) return null;
  const ip = valor.trim();
  return validarIp(ip) ? ip.toLowerCase() : null;
}

module.exports = { validarIPv4, validarIPv6, validarIp, obtenerIpDesdeEncabezadoConfiable };
