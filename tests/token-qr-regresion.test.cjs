/** Reglas de regresión del token QR público. Lectura local, sin red. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'tarjeta.html'), 'utf8');

test('el QR público identifica negocio por slug, no por token en URL', () => {
  assert.match(source, /new URLSearchParams\(location\.search\)\.get\('negocio'\)/);
  assert.doesNotMatch(source, /new URLSearchParams\(location\.search\)\.get\(['"]token['"]\)/);
});
test('el token privado se conserva en almacenamiento por negocio', () => {
  assert.match(source, /const storageKey = `sellogo:tarjeta:v1:\$\{slug\}`/);
  assert.match(source, /localStorage\.getItem\(storageKey\)/);
  assert.match(source, /localStorage\.setItem\(storageKey,token\)/);
});
test('consulta y emisión usan POST con cuerpo JSON, no parámetros de URL', () => {
  assert.match(source, /fetch\(endpoint,\{method:'POST'/);
  assert.match(source, /body:JSON\.stringify\(\{accion,\.\.\.params\}\)/);
  assert.doesNotMatch(source, /endpoint\s*\+\s*['"]\?token/);
});
test('la página no incluye instrucciones explícitas de registrar o mostrar el token en consola', () => {
  assert.doesNotMatch(source, /console\.(?:log|info|debug|warn|error)\s*\([^\n]*\btoken\b/i);
  assert.doesNotMatch(source, /(?:alert|prompt)\s*\(\s*token\s*\)/);
});
test('la consulta reutiliza token y no emite otra tarjeta cuando existe', () => {
  assert.match(source, /let token=savedToken\(\)/);
  assert.match(source, /if\(!token\)\{/);
  assert.match(source, /call\('emitir',\{slug\}\)/);
  assert.match(source, /call\('consultar',\{token\}\)/);
});
