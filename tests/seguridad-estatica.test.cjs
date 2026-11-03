/**
 * SelloGo 4.0 — pruebas de regresión gratuitas y SIN conexión a producción.
 * Ejecutar: node --test tests/seguridad-estatica.test.cjs
 * Estas pruebas son estáticas: NO sustituyen pruebas RLS con cuentas de prueba.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const employee = read('index.html');
const admin = read('admin.html');
const owner = read('propietario.html');
const card = read('tarjeta.html');
const config = read('config.js');

test('los paneles usan configuración compartida', () => {
  for (const [name, html] of [['empleados', employee], ['administración', admin], ['propietarios', owner]]) {
    assert.match(html, /config\.js/, name);
    assert.match(html, /auth\.getUser\(/, name);
  }
});

test('las operaciones del empleado pasan por RPC y no modifican tarjetas directamente', () => {
  for (const fn of ['agregar_sello', 'canjear_recompensa', 'sellogo_retirar_sello']) {
    assert.ok(employee.includes("rpc('" + fn + "'"), 'RPC requerida: ' + fn);
  }
  assert.doesNotMatch(employee, /\.from\(['"]tarjetas['"]\)\.update\(/);
});

test('bloqueo de operaciones simultáneas y cambio de negocio', () => {
  assert.match(employee, /if\(!selected\|\|!negocioId\|\|busy\)return/);
  assert.match(employee, /business-select['"]\)\.disabled=busy/);
  assert.match(employee, /if\(busy\)return/);
  assert.ok(employee.includes("if(busy){e.target.value=negocioId||'';return;}"), 'bloquear cambio de negocio');
  assert.ok(employee.includes("if(busy){msg('Espera a que termine la operación antes de cerrar sesión.');return;}"), 'bloquear cierre de sesión');
});

test('el canje requiere premio disponible y confirmación', () => {
  assert.match(employee, /recompensas_disponibles/);
  assert.match(employee, /window\.confirm\(/);
});

test('la corrección solicita motivo y usa RPC auditada', () => {
  assert.match(employee, /correction-reason/);
  assert.match(employee, /p_motivo:reason/);
});

test('propietarios consultan estadísticas con RPC específica', () => {
  assert.match(owner, /sellogo_analytics_propietario/);
});

test('administración usa RPC para consultar negocios', () => {
  assert.match(admin, /sellogo_listar_negocios/);
});

test('no hay secretos de servidor conocidos en archivos públicos', () => {
  for (const [name, source] of [['index.html',employee],['admin.html',admin],['propietario.html',owner],['tarjeta.html',card],['config.js',config]]) {
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|sb_secret_[A-Za-z0-9_-]+|sk_live_[A-Za-z0-9]+/i, name);
  }
});

test('se conserva la página de tarjeta pública', () => {
  assert.ok(card.length > 1000);
  assert.match(card, /negocio/);
});
