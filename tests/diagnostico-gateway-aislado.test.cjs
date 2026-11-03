const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'diagnostico-gateway-aislado.ts'), 'utf8');

test('diagnóstico no contiene conexiones ni escrituras a Supabase', () => {
  assert.doesNotMatch(source, /createClient|supabase\.rpc|SUPABASE_SECRET|service_role|\.insert\(|\.update\(|\.delete\(/i);
});

test('diagnóstico no imprime ni devuelve IP observada', () => {
  assert.doesNotMatch(source, /console\.(log|info|warn)\s*\(/);
  assert.match(source, /observedCandidateAsFirst:\s*first\s*===\s*candidate/);
  assert.doesNotMatch(source, /(?:observedIp|clientIp|rawIp)\s*:/);
});

test('diagnóstico no crea tarjetas ni cambia límites', () => {
  assert.doesNotMatch(source, /sellogo_emitir_tarjeta_interna|sellogo_cuotas_registro|supabase\.from\s*\(/);
});
