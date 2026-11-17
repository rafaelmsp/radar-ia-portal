import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const url='http://127.0.0.1:4174/radar-ia-portal/';
const chrome=process.env.RADAR_CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4174','--strictPort'],{cwd:root,stdio:'ignore'});
let browser;
async function ready(){
 for(let i=0;i<60;i++){
  try{const r=await fetch(url);if(r.status===200)return}catch{}
  await new Promise(r=>setTimeout(r,250));
 }
 throw new Error('Prévia Vite não iniciou');
}
try{
 await ready();
 browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('.hero-copy h1').waitFor();
 assert.match(await page.locator('.hero-copy h1').innerText(),/Menos ruído/);
 const widths=await page.evaluate(()=>({viewport:innerWidth,body:document.body.scrollWidth,root:document.documentElement.scrollWidth}));
 assert.equal(widths.viewport,390);
 assert.ok(widths.body<=390 && widths.root<=390,'Página com rolagem horizontal no celular');
 console.log('OK: início carregado e layout móvel sem transbordamento');
 await page.getByRole('button',{name:/Explorar ferramentas/}).click();
 assert.match(await page.locator('.page-intro h1').innerText(),/IA na prática/);
 assert.equal(await page.locator('.guide-card').count(),4);
 console.log('OK: guias práticos acessíveis');
 await page.getByRole('tab',{name:/Conferir resposta da IA/}).click();
 assert.equal(await page.locator('.verification-list label').count(),6);
 await page.locator('.verification-list label').first().click();
 assert.match(await page.locator('.tool-progress').innerText(),/1 de 6/);
 console.log('OK: checklist interativo registra marcação');
 await page.getByRole('tab',{name:/Montar um prompt/}).click();
 await page.locator('#goal').fill('Organizar um documento fictício, sem dados pessoais');
 const generated=await page.locator('.prompt-preview pre').innerText();
 assert.match(generated,/Não invente decisões/);
 assert.match(generated,/Organizar um documento fictício/);
 await page.getByRole('button',{name:/Copiar prompt/}).click();
 await page.getByRole('button',{name:/Copiado/}).waitFor({timeout:4500});
 const copied=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(copied,/Organizar um documento fictício/);
 console.log('OK: gerador e cópia de prompt funcionam');
 await page.getByRole('tab',{name:/Guias rápidos/}).click();
 await page.locator('.guide-card').first().click();
 assert.equal(await page.locator('.step-list label').count(),5);
 await page.locator('.step-list label').first().click();
 assert.equal(await page.locator('.step-list label.done').count(),1);
 console.log('OK: guia passo a passo interativo');
 await page.locator('.bottom-nav').getByRole('button',{name:'Radar'}).click();
 assert.match(await page.locator('.page-intro h1').innerText(),/O que mudou/);
 await page.locator('.search-field input').fill('prompt');
 assert.ok((await page.locator('.filter-row').innerText()).includes('resultado'));
 console.log('OK: navegação e busca de atualizações');
 await page.locator('.bottom-nav').getByRole('button',{name:'Avisos'}).click();
 assert.match(await page.locator('.page-intro h1').innerText(),/Informes/);
 await page.locator('.bottom-nav').getByRole('button',{name:'Minha área'}).click();
 await page.locator('#login-email').waitFor({state:'visible',timeout:5000});
 console.log('OK: informes e formulário de login acessíveis');
 assert.deepEqual(errors,[],'Erros JavaScript na interface: '+errors.join(' | '));
 await context.close();
 const desktop=await browser.newContext({viewport:{width:1440,height:900}});
 const desktopPage=await desktop.newPage();
 await desktopPage.goto(url,{waitUntil:'domcontentloaded'});
 assert.equal(await desktopPage.locator('.desktop-links button').count(),4);
 assert.ok(await desktopPage.locator('.hero-feature').isVisible());
 console.log('OK: navegação desktop e destaque editorial');
 await desktop.close();
 console.log('SMOKE UI: SUCESSO');
}catch(e){
 console.error('FALHA UI:',e);
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 server.kill();
}
