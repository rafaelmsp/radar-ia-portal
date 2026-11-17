import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSafePrompt,guides,verificationChecks} from '../src/practiceContent.ts';

test('guias possuem passos verificáveis e título único',()=>{
 assert.equal(guides.length,4);
 assert.equal(new Set(guides.map(x=>x.id)).size,guides.length);
 for(const guide of guides){
  assert.ok(guide.steps.length>=4);
  assert.ok(guide.title.length>=12);
  assert.ok(guide.outcome.length>20);
 }
});
test('gerador de prompt inclui limites contra referências inventadas',()=>{
 const prompt=buildSafePrompt('revisao','Revisar texto fictício');
 assert.match(prompt,/Não invente decisões/);
 assert.match(prompt,/Revisar texto fictício/);
 assert.match(prompt,/revisão humana/i);
});
test('prompt é limitado em tamanho e nunca fabrica texto jurídico específico',()=>{
 const text='x'.repeat(2000);
 const prompt=buildSafePrompt('estrutura',text);
 assert.equal(prompt.includes('x'.repeat(351)),false);
 assert.match(prompt,/\[VERIFICAR\]/);
});
test('checklist tem passos suficientes',()=>{
 assert.equal(verificationChecks.length,6);
 assert.ok(verificationChecks.every(x=>x.length>25));
});
