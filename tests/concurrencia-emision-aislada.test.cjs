/** Simulaciones de concurrencia SIN Supabase ni red. No prueban la RPC real. */
const test = require('node:test');
const assert = require('node:assert/strict');

async function emisionNoAtomica(estado, barrera) {
  const previo = estado.total;
  await barrera;
  if (previo >= 500) return false;
  estado.total = previo + 1;
  return true;
}

function emisionAtomicaSimulada(estado) {
  if (estado.total >= 500) return false;
  estado.total += 1;
  return true;
}

test('una comprobación no atómica puede aceptar dos altas en el último cupo', async () => {
  const estado = { total: 499 };
  const barrera = Promise.resolve();
  const resultados = await Promise.all([
    emisionNoAtomica(estado, barrera),
    emisionNoAtomica(estado, barrera),
  ]);
  assert.deepEqual(resultados, [true, true]);
  assert.equal(estado.total, 500); // escritura perdida; se aprobaron 501 emisiones lógicas
});

test('una sección crítica atómica simulada admite solo el último cupo', () => {
  const estado = { total: 499 };
  assert.deepEqual(
    [emisionAtomicaSimulada(estado), emisionAtomicaSimulada(estado)],
    [true, false]
  );
  assert.equal(estado.total, 500);
});

test('una ráfaga de 1000 intentos no supera 500 cupos en modelo atómico', () => {
  const estado = { total: 0 };
  const aceptados = Array.from({ length: 1000 }, () => emisionAtomicaSimulada(estado))
    .filter(Boolean).length;
  assert.equal(aceptados, 500);
  assert.equal(estado.total, 500);
});

test('el contador no se altera cuando se rechaza por límite', () => {
  const estado = { total: 500 };
  for (let i = 0; i < 100; i++) assert.equal(emisionAtomicaSimulada(estado), false);
  assert.equal(estado.total, 500);
});
