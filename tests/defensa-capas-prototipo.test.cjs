/** Prototipo AISLADO de evaluación de riesgo; NO se usa en producción. */
const test = require('node:test');
const assert = require('node:assert/strict');

// No sustituye una cuota atómica de base de datos ni verifica IP de origen.
function evaluar({ totalNegocio, intentosOrigen, origenConfiable, desafioValidado }) {
  if (!Number.isSafeInteger(totalNegocio) || totalNegocio < 0 ||
      !Number.isSafeInteger(intentosOrigen) || intentosOrigen < 0) return 'rechazar';
  if (totalNegocio >= 500) return 'limite-negocio';
  if (!origenConfiable) return 'revisar-origen';
  if (intentosOrigen >= 3 && !desafioValidado) return 'desafio';
  return 'permitir';
}

test('el límite global prevalece incluso con desafío superado', () => {
  assert.equal(evaluar({totalNegocio:500,intentosOrigen:0,origenConfiable:true,desafioValidado:true}), 'limite-negocio');
});
test('IP no verificada nunca se considera confiable solo por su sintaxis', () => {
  assert.equal(evaluar({totalNegocio:1,intentosOrigen:0,origenConfiable:false,desafioValidado:false}), 'revisar-origen');
});
test('red compartida puede activar revisión sin denegación definitiva', () => {
  assert.equal(evaluar({totalNegocio:3,intentosOrigen:3,origenConfiable:true,desafioValidado:false}), 'desafio');
});
test('un desafío validado permitiría continuar sujeto a cuota global', () => {
  assert.equal(evaluar({totalNegocio:3,intentosOrigen:3,origenConfiable:true,desafioValidado:true}), 'permitir');
});
test('se rechazan contadores inválidos', () => {
  for (const n of [-1, NaN, 0.5, Infinity]) {
    assert.equal(evaluar({totalNegocio:n,intentosOrigen:0,origenConfiable:true,desafioValidado:false}), 'rechazar');
  }
});
test('bajo riesgo no requiere desafío', () => {
  assert.equal(evaluar({totalNegocio:10,intentosOrigen:1,origenConfiable:true,desafioValidado:false}), 'permitir');
});
