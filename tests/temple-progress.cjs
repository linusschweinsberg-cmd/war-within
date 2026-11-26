/* Fortschritt › Tempel: TempleProgress muss L definieren (milestoneEvidence) – node tests/temple-progress.cjs */
const fs=require('fs'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const i=html.indexOf('function TempleProgress'),body=html.slice(i,html.indexOf('\nfunction ',i+10));
assert.ok(body.includes('milestoneEvidence(L,'),'nutzt L');assert.match(body.slice(0,200),/const L=S\.life/,'definiert L');
console.log('PASS TempleProgress definiert L');
