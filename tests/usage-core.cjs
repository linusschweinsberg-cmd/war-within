/* Nutzungszählung: nur Codes und Zahlen, eigener Speicher, Tage richtig gezählt, Einbindung. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),mem={};const c=vm.createContext({localStorage:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)}}});
vm.runInContext(fs.readFileSync(path.join(root,'usage-core.js'),'utf8'),c);const UC=c.UC,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const t=(n,f)=>{f();console.log('PASS '+n)};const D=s=>Date.parse(s+'T10:00:00');
t('Counts hits and distinct days, keeps only codes',()=>{UC.reset(D('2026-11-01'));UC.hit('tab:life',D('2026-11-01'));UC.hit('tab:life',D('2026-11-01'));UC.hit('tab:life',D('2026-11-03'));UC.hit('sheet:goal <b>Privat</b>',D('2026-11-03'));
 const x=UC.load();assert.equal(x.days,2);assert.equal(x.ev['tab:life'].n,3);assert.equal(x.ev['tab:life'].d,2);assert.ok(x.ev['sheet:goalbPrivatb'],'Sonderzeichen entfernt');assert.ok(!JSON.stringify(x).includes('<'));assert.ok(mem[UC.KEY],'eigener Speicher')});
t('Summary sorts by days and lists never-used known codes; text export has numbers only',()=>{const s=UC.summary(['tab:life','tab:stats']);assert.equal(s.rows[0].k,'tab:life');assert.deepEqual([...s.never],['tab:stats']);assert.match(UC.asText(['tab:stats']),/Nie genutzt: tab:stats/)});
t('Broken storage falls back; reset clears',()=>{mem[UC.KEY]='{kaputt';assert.equal(Object.keys(UC.load().ev).length,0);UC.hit('do:undo');UC.reset();assert.equal(Object.keys(UC.load().ev).length,0)});
t('Not in the game state or backup; wired to tabs, sheets, complete, undo, info',()=>{assert.ok(!html.includes('S.usage'));assert.ok(html.includes("useEffect(()=>{uhit('tab:'+tab)},[tab])"));assert.ok(html.includes("if(o&&o.t)uhit('sheet:'+o.t)"));assert.ok(html.includes("uhit('do:complete')"));assert.ok(html.includes("uhit('do:undo')"));assert.ok(html.includes('<${UsageCard} c=${c}/>'))});
console.log('PASS usage-core');

t('Valid JSON with broken event values cannot crash the overview or leak extra fields',()=>{
 mem[UC.KEY]=JSON.stringify({v:1,since:{private:'secret'},days:'secret',lastDay:'secret',ev:{'tab:home':null,'tab:life':{n:2,d:1,last:'2026-11-27',private:'secret'},'sheet:goal':{n:'secret',d:1,last:'2026-11-27'}}});
 assert.doesNotThrow(()=>UC.asText([]));UC.hit('tab:stats',D('2026-11-27'));
 const saved=JSON.parse(mem[UC.KEY]);assert.equal(saved.ev['tab:life'].n,2);assert.equal(saved.ev['tab:stats'].n,1);assert.ok(!JSON.stringify(saved).includes('secret'));
 mem[UC.KEY]=JSON.stringify({v:1,ev:[]});assert.equal(UC.summary([]).rows.length,0);
});
