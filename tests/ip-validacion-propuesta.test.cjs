const test = require('node:test');
const assert = require('node:assert/strict');
const { validarIp, obtenerIpDesdeEncabezadoConfiable } = require('./ip-validacion-propuesta.cjs');

test('acepta IPv4 válida', () => {
  assert.equal(validarIp('192.0.2.10'), true);
  assert.equal(validarIp('0.0.0.0'), true);
});
test('rechaza IPv4 fuera de rango o malformada', () => {
  for (const ip of ['999.1.1.1', '01.2.3.4', 'abc', '192.0.2']) {
    assert.equal(validarIp(ip), false, ip);
  }
});
test('acepta IPv6 básica y comprimida', () => {
  assert.equal(validarIp('2001:db8::1'), true);
  assert.equal(validarIp('2001:0db8:0000:0000:0000:0000:0000:0001'), true);
});
test('rechaza IPv6 malformada', () => {
  for (const ip of ['2001:::1', '2001:db8::1::2', 'gggg::1', '1:2:3:4:5:6:7:8:', ':1:2:3:4:5:6:7:8']) {
    assert.equal(validarIp(ip), false, ip);
  }
});
test('rechaza lista de proxies en encabezado de IP única', () => {
  assert.equal(obtenerIpDesdeEncabezadoConfiable('203.0.113.2, 198.51.100.7'), null);
});
test('normaliza IPv6 válida sin modificar IPv4', () => {
  assert.equal(obtenerIpDesdeEncabezadoConfiable('2001:DB8::A'), '2001:db8::a');
  assert.equal(obtenerIpDesdeEncabezadoConfiable('198.51.100.7'), '198.51.100.7');
});
