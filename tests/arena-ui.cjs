/* Arena-Einstieg: drei Schritte „So geht's“, direkte Aktion „Liga erstellen“ (auch für Gäste), gekürzte Regeln. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const ui=fs.readFileSync(path.join(__dirname,'..','arena-ui.js'),'utf8');
const t=(n,f)=>{f();console.log('PASS '+n)};
t('Three short steps explain the game',()=>{assert.ok(ui.includes('data-arena-how'));for(const s of['Liga erstellen und bis zu 7 Freunde','Jeden Tag melden','Nach vier Wochen gewinnt'])assert.ok(ui.includes(s),s)});
t('Create a league is the first action, for guests and signed-in users',()=>{assert.ok(ui.includes('data-arena-guest'));assert.ok(ui.includes('data-arena-actions'));assert.ok(ui.indexOf('data-arena-actions')<ui.indexOf('Meine Ligen'),'Aktion vor der Liste');assert.ok(!ui.includes('Auch zu dritt eine volle Runde'))});
t('Rules are short, behind „Alle Regeln“, and keep the privacy promise',()=>{const r=ui.slice(ui.indexOf('data-arena-rules'),ui.indexOf('</details>',ui.indexOf('data-arena-rules')));assert.ok(r.length<1600,'Regeln kurz: '+r.length);assert.ok(r.includes('nie übertragen'));assert.ok(!ui.includes('So wird gespielt</summary>'))});
console.log('PASS arena-ui');
