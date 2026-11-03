/** Pruebas aisladas de límites QR. No acceden a Supabase. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { validarIp, obtenerIpDesdeEncabezadoConfiable } = require('./ip-validacion-propuesta.cjs');

function identificador(slug, ip, secreto = 'secreto-solo-pruebas') {
  return createHmac('sha256', secreto).update(slug + ':' + ip).digest('hex');
}
function emitir(estado, slug, ip, hora) {
  const clave = identificador(slug, ip);
  const ventana = Math.floor(hora / 3600000);
  const k = clave + ':' + ventana;
  const negocio = slug + ':' + ventana;
  if ((estado.ip.get(k) || 0) >= 3 || (estado.negocio.get(negocio) || 0) >= 500) return 429;
  estado.ip.set(k, (estado.ip.get(k) || 0) + 1);
  estado.negocio.set(negocio, (estado.negocio.get(negocio) || 0) + 1);
  return 200;
}
const nuevoEstado = () => ({ ip: new Map(), negocio: new Map() });

test('tres emisiones permitidas y cuarta bloqueada en misma IP y negocio', () => {
  const e = nuevoEstado();
  assert.deepEqual(Array.from({ length: 4 }, () => emitir(e, 'cafe', '198.51.100.1', 0)), [200, 200, 200, 429]);
});
test('una IP compartida por cuatro personas puede producir falso bloqueo', () => {
  const e = nuevoEstado();
  const resultados = Array.from({ length: 4 }, () => emitir(e, 'cafe', '198.51.100.2', 0));
  assert.equal(resultados[3], 429);
});
test('negocios distintos tienen cuotas separadas', () => {
  const e = nuevoEstado();
  for (let i = 0; i < 3; i++) assert.equal(emitir(e, 'cafe', '198.51.100.3', 0), 200);
  assert.equal(emitir(e, 'barberia', '198.51.100.3', 0), 200);
});
test('la ventana horaria reinicia el contador simulado', () => {
  const e = nuevoEstado();
  for (let i = 0; i < 3; i++) emitir(e, 'cafe', '198.51.100.4', 0);
  assert.equal(emitir(e, 'cafe', '198.51.100.4', 3600000), 200);
});
test('el identificador HMAC cambia con negocio o IP', () => {
  assert.notEqual(identificador('cafe', '198.51.100.1'), identificador('cafe', '198.51.100.2'));
  assert.notEqual(identificador('cafe', '198.51.100.1'), identificador('barberia', '198.51.100.1'));
  assert.match(identificador('cafe', '198.51.100.1'), /^[0-9a-f]{64}$/);
});
test('cabecera con múltiples valores no es una IP única confiable', () => {
  assert.equal(obtenerIpDesdeEncabezadoConfiable('203.0.113.1, 198.51.100.2'), null);
});
test('rechaza IP sintácticamente inválida', () => {
  for (const ip of ['999.2.3.4', 'texto', '1.2.3', '2001:::1']) assert.equal(validarIp(ip), false);
});
test('acepta IPv4 e IPv6 válidas', () => {
  assert.equal(validarIp('203.0.113.5'), true);
  assert.equal(validarIp('2001:db8::5'), true);
});
test('el límite global simulado bloquea emisión 501 entre IP distintas', () => {
  const e = nuevoEstado();
  for (let i = 0; i < 500; i++) assert.equal(emitir(e, 'cafe', 'ip-simulada-' + i, 0), 200);
  assert.equal(emitir(e, 'cafe', 'ip-simulada-501', 0), 429);
});
test('consultar token no consume cuota de emisión simulada', () => {
  const e = nuevoEstado();
  const consultar = () => 200;
  for (let i = 0; i < 10; i++) assert.equal(consultar(), 200);
  assert.equal(emitir(e, 'cafe', '198.51.100.8', 0), 200);
});
