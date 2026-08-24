#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || process.cwd();
const required = [
  'index.html','vercel.json','js/main.js','js/config.js','js/save.js','js/audio.js',
  'js/scene.js','js/models.js','js/traffic.js','js/particles.js','js/input.js',
  'js/social.js','js/ui.js','js/game.js','css/tokens.css','css/ui.css','css/responsive.css'
];
let bad = 0;
for(const f of required){
  if(!fs.existsSync(path.join(root,f))){ console.error('MISSING',f); bad++; }
}
const audio = fs.existsSync(path.join(root,'js/audio.js')) ? fs.readFileSync(path.join(root,'js/audio.js'),'utf8') : '';
if(audio.includes('export const Scene')) { console.error('BROKEN audio.js: contains Scene instead of Audio'); bad++; }
if(!/export\s+const\s+Audio\b/.test(audio)){ console.error('BROKEN audio.js: no Audio export'); bad++; }
if(!audio.includes('horn()') || !audio.includes('levelup()')){ console.error('BROKEN audio.js: enhanced SFX missing'); bad++; }
const main = fs.existsSync(path.join(root,'js/main.js')) ? fs.readFileSync(path.join(root,'js/main.js'),'utf8') : '';
if(main.includes("$('btnCopyPause').onclick")) { console.error('BROKEN main.js: btnCopyPause is referenced but absent from index.html'); bad++; }
const html = fs.existsSync(path.join(root,'index.html')) ? fs.readFileSync(path.join(root,'index.html'),'utf8') : '';
if(!html.includes('id="t-horn"')){ console.error('MISSING mobile horn control'); bad++; }
if(!html.includes('id="rankV"')){ console.error('MISSING live rank HUD'); bad++; }
if(html.includes('src="/three.min.js"') && !fs.existsSync(path.join(root,'three.min.js'))){
  console.error('MISSING three.min.js while index.html requires it'); bad++;
}
console.log(bad ? `FAILED: ${bad} issue(s)` : 'OK: required project links and critical module contracts are present');
process.exitCode = bad ? 1 : 0;
