/** Pruebas de modelo de amenazas. Simulación sin red ni datos reales. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');

function clave(slug, ip) {
  return createHmac('sha256', 'clave-ficticia-local').update(slug + ':' + ip).digest('hex');
}
function cuota() {
  const vistos = new Map();
  return (slug, ip) => {
    const id = clave(slug, ip);
    const n = vistos.get(id) || 0;
    if (n >= 3) return false;
    vistos.set(id, n + 1);
    return true;
  };
}
test('una IP compartida bloquea al cuarto usuario legítimo: limitación conocida', () => {
  const emitir = cuota();
  const usuarios = ['ana', 'beto', 'carla', 'diego'];
  assert.deepEqual(usuarios.map(() => emitir('cafeteria', '198.51.100.20')),
    [true, true, true, false]);
});
test('si se confía en cabecera falsificable, rotar IP elude cuota por IP', () => {
  const emitir = cuota();
  const resultados = Array.from({ length: 12 }, (_, i) =>
    emitir('cafeteria', '198.51.100.' + (i + 1)));
  assert.equal(resultados.every(Boolean), true);
});
test('HMAC oculta la IP pero no valida la procedencia del encabezado', () => {
  assert.match(clave('cafeteria', '198.51.100.10'), /^[a-f0-9]{64}$/);
  assert.notEqual(clave('cafeteria', '198.51.100.10'), clave('cafeteria', '198.51.100.11'));
});
