/* Zukunfts-Ich „Ich zögere gerade“: Verdrahtung – node tests/future-self-hesitate.cjs */
const fs=require('fs'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');const ok=[];const t=(n,f)=>{f();ok.push(n)};
t('Panel startet mit „Ich zögere gerade“, die drei bisherigen Fragen bleiben erreichbar',()=>{assert.ok(html.includes("useState('hesitate')"));assert.match(html,/data-hesitate-btn>Ich zögere gerade</);assert.ok(html.includes('>Weitere Fragen</summary>'));for(const q of ['Konfrontiere mich','Was würde mein Zukunfts-Ich tun?','Mein Tagesurteil'])assert.ok(html.includes(q))});
t('Hesitate nutzt keine FS.respond-Antwort und speichert keinen Verlauf',()=>{assert.ok(html.includes("mode!=='hesitate'&&prefs.enabled?FS.respond"));const i=html.indexOf('function HesitateView'),j=html.indexOf('function FutureSelfPanel',i);assert.ok(j>i&&!html.slice(i,j).includes('FS.record'))});
t('Grund, kleinster Schritt (Minimum auch für verknüpfte Standards) und Wochenwirkung',()=>{const i=html.indexOf('function hesitateModel');const b=html.slice(i,i+2500);assert.ok(b.includes('f.identity')&&b.includes('L.why')&&b.includes('x.aid===a.id&&x.min'));assert.ok(html.includes('completePriority(c,h.minItem,null,\'min\')'));assert.ok(html.includes('Mit heute: <b>'))});
t('Ruhetag hat Vorrang',()=>{assert.ok(html.includes('Heute ist Ruhetag'))});
console.log(ok.map(n=>'PASS '+n).join('\n'));
