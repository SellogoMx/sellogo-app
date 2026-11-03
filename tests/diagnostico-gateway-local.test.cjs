const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Simulación LOCAL del handler; no envía solicitudes ni contacta a Supabase.
const source = fs.readFileSync(path.join(__dirname, 'diagnostico-gateway-aislado.ts'), 'utf8')
  .replace('async (req: Request)', 'async (req)');
let handler;
vm.runInNewContext(source, {
  Deno: { serve: fn => { handler = fn; } },
  Response,
});
async function invoke(method, candidate, forwarded) {
  const headers = new Headers();
  if (forwarded !== undefined) headers.set('x-forwarded-for', forwarded);
  const req = { method, headers, json: async () => candidate };
  const response = await handler(req);
  return { status: response.status, body: await response.json() };
}
test('GET es rechazado sin leer datos', async () => {
  assert.equal((await invoke('GET', {})).status, 405);
});
test('candidato ausente o inválido se rechaza', async () => {
  assert.equal((await invoke('POST', {})).status, 400);
  assert.equal((await invoke('POST', { candidate: 'a,b' })).status, 400);
});
test('sin cabecera IP no hay coincidencia', async () => {
  const r = await invoke('POST', { candidate: '198.51.100.77' });
  assert.equal(r.body.observedCandidateAsFirst, false);
  assert.equal(r.body.forwardedPresent, false);
});
test('cabecera simulada idéntica coincide; no prueba gateway real', async () => {
  const r = await invoke('POST', { candidate: '198.51.100.77' }, '198.51.100.77');
  assert.equal(r.body.observedCandidateAsFirst, true);
  assert.equal(JSON.stringify(r.body).includes('198.51.100.77'), false);
});
test('cabecera con múltiples entradas solo compara la primera', async () => {
  const r = await invoke('POST', { candidate: '198.51.100.77' }, '203.0.113.10, 198.51.100.77');
  assert.equal(r.body.observedCandidateAsFirst, false);
  assert.equal(r.body.forwardedEntries, 2);
});
