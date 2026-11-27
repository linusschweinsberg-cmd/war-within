/* Heute-Seite: Verdrahtung des Kopfes und der zugeklappten Bereiche – node tests/home-pass.cjs */
const fs=require('fs'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const ok=[];const t=(n,f)=>{f();ok.push(n)};

t('Kopf bekommt die Hauptschlacht als Eigenschaft (sonst ReferenceError beim Rendern)',()=>{
 assert.match(html,/function TodayHero\(\{c,ini,rings,battle\}\)/);assert.match(html,/<\$\{TodayHero\} c=\$\{c\} ini=\$\{ini\} rings=\$\{rings\} battle=\$\{battle\}\/>/)});
t('Zweck-Satz folgt dem Stand der Hauptschlacht',()=>{assert.ok(html.includes("battle?battle.done?'Hauptschlacht gewonnen. Alles Weitere ist Zugabe.':'Deine Hauptschlacht wartet.':'Wähle, was heute am meisten zählt.'"))});
t('Zugeklappte Bereiche stehen in einer Karte; Standards nur, wenn es welche gibt',()=>{assert.match(html,/data-today-more/);assert.ok(html.includes("hidden=${S.ui!=='adv'&&!Object.values(S.life.standards||{}).some(x=>x.std&&x.status!=='paused')}"))});
t('Im Blick: Name oben, Zeit darunter',()=>{assert.ok(html.includes("tile('owl','Tagesrückblick',r?'erledigt':'ab 18:00',false,"));assert.ok(!html.includes("tile('owl',r?'Erledigt':'ab 18:00'"))});

console.log(ok.map(n=>'PASS '+n).join('\n'));

/* Tempel: schlichte Säulen statt Zeichnung auf Mein Leben und Fortschritt; TempleProgress definiert L (vorher ReferenceError, sobald Bausteine existieren). */
{const ok2=[];const t2=(n,f)=>{f();ok2.push(n)};
 t2('Tempel: TemplePlain auf beiden Seiten, Stufen statt Namen',()=>{assert.equal((html.match(/<\$\{TemplePlain\} /g)||[]).length,2);assert.ok(!html.includes('${col.stageName}'),'keine Stufennamen in den Details')});
 t2('TempleProgress definiert L für milestoneEvidence',()=>{const i=html.indexOf('function TempleProgress');assert.ok(html.slice(i,i+200).includes('const L=S.life'))});
 console.log(ok2.map(n=>'PASS '+n).join('\n'))}
{const ok3=[];const t3=(n,f)=>{f();ok3.push(n)};
 t3('Tempel-Segmente folgen den Bausteinen; leere Säule ist leer',()=>{assert.ok(html.includes("const E=[1,...LC.STAGES.slice(1).map(x=>x.min)]"));assert.ok(html.includes("c.pts?'Stufe '+c.stage+'/5':'noch leer'"))});
 t3('Tempel-Karte ruhig: Dach = Warum, Fundament = Werte, keine Kacheln und Erklärzeilen',()=>{assert.ok(html.includes('data-temple-roof'));assert.ok(html.includes('data-temple-base'));assert.ok(!html.includes('Heute danach gehandelt?'));assert.ok(!html.includes('data-temple-explain'))});
 console.log(ok3.map(n=>'PASS '+n).join('\n'))}
{const names=[...html.matchAll(/^function ([A-Za-z0-9_]+)\(/gm)].map(m=>m[1]),dup=names.filter((n,i)=>names.indexOf(n)!==i);assert.deepEqual(dup,[],'keine doppelten Funktionsnamen (eine spätere Deklaration überschreibt still die frühere)');
 assert.ok(html.includes('function InfoNote({head,label,children'));console.log('PASS keine doppelten Funktionsnamen; Erklärungen hinter Info-Symbol')}
