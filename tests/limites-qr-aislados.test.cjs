/**
 * SelloGo 4.0 — pruebas aisladas del algoritmo actual de selección de IP.
 * NO llama a Supabase, NO genera tarjetas y NO modifica producción.
 * Ejecutar: node --test tests/limites-qr-aislados.test.cjs
 *
 * IMPORTANTE: simula únicamente la lógica del código desplegado.
 * NO demuestra qué cabeceras permite o sobrescribe el gateway de Supabase.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

function elegirIpActual(xForwardedFor) {
  return xForwardedFor?.split(',')[0]?.trim() || undefined;
}

test('selecciona una IP cuando el encabezado tiene un solo valor', () => {
  assert.equal(elegirIpActual('198.51.100.7'), '198.51.100.7');
});

test('selecciona el primer valor cuando el encabezado tiene varios', () => {
  assert.equal(elegirIpActual('203.0.113.9, 198.51.100.7'), '203.0.113.9');
});

test('un primer valor distinto cambia el identificador de origen seleccionado', () => {
  const original = elegirIpActual('198.51.100.7');
  const cambiado = elegirIpActual('203.0.113.9, 198.51.100.7');
  assert.notEqual(original, cambiado);
  // Riesgo CONDICIONAL: solo sería explotable si el gateway deja al cliente
  // influir en el primer valor del encabezado recibido por la Edge Function.
});

test('rechaza la ausencia de IP en la lógica del servicio', () => {
  assert.equal(elegirIpActual(null), undefined);
  assert.equal(elegirIpActual(''), undefined);
});

test('la selección actual no valida sintaxis IP', () => {
  assert.equal(elegirIpActual('no-es-una-ip'), 'no-es-una-ip');
});
