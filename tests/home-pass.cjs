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
