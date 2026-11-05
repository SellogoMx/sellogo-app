const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','tarjeta.html'),'utf8');
test('layouts premium solo con activación explícita',()=>{
 assert.match(source,/typeof d\.diseno_layout==='string'\?d\.diseno_layout:''/);
 assert.match(source,/layout==='centered'\|\|layout==='editorial'/);
 assert.match(source,/delete app\.dataset\.cardLayout/);
});
test('Taller Automotriz Hernández excluido de composiciones nuevas',()=>{
 assert.match(source,/slug==='taller-automotriz-hernandez'/);
 assert.match(source,/!protectedBusiness &&/);
});
test('composiciones encapsuladas en tarjeta pública',()=>{
 assert.match(source,/\.app\[data-card-layout="centered"\]/);
 assert.match(source,/\.app\[data-card-layout="editorial"\]/);
 assert.doesNotMatch(source,/\.app\[data-card-layout="classic"\]/);
});

test('consulta composición pública con endpoint válido y sin alterar diseños heredados',()=>{
 assert.match(source,/rpc\/sellogo_composicion_publica/);
 assert.match(source,/await cargarComposicion\(\)/);
 assert.match(source,/if\(!r\.ok\)return/);
 assert.match(source,/if\(slug!=='taller-automotriz-hernandez'/);
 assert.doesNotMatch(source,/SUPABASE_URL\.replace\(\/\\\\\/\$\//);
});
