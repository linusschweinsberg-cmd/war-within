/* Gewohnheitsspur und „nie zweimal auslassen“: node tests/habit-loop.cjs */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const dir=require('path').join(__dirname,'..');
const c=vm.createContext({console});vm.runInContext(fs.readFileSync(dir+'/life-core.js','utf8'),c);
const LC=c.LC;const html=fs.readFileSync(dir+'/index.html','utf8');
const ok=[];const t=(n,f)=>{f();ok.push(n)};
const life=(per,extra={})=>({d:10,standards:{health:{area:'health',std:{text:'Laufen',perWeek:per},min:{text:'10 Min. gehen'},...extra}},stdLog:[],log:[]});

t('Spur: sieben Tage, voll und Minimum getrennt, heute zuletzt',()=>{const L=life(3);L.stdLog.push({area:'health',d:10,kind:'std'},{area:'health',d:8,kind:'min'},{area:'health',d:3,kind:'std'});
 const tr=LC.standardTrace(L,'health');assert.equal(tr.length,7);assert.equal(tr[6].d,10);assert.equal(tr[6].k,'std');assert.equal(tr[4].k,'min');assert.equal(tr[0].d,4);assert.equal(tr.filter(x=>x.k).length,2,'Tag 3 liegt außerhalb')});

t('Verknüpfter Standard zählt über seine Zielhandlung',()=>{const L=life(3,{aid:'a1'});L.log.push({aid:'a1',d:9});assert.equal(LC.standardDayOn(L,'health',9),'std');assert.equal(LC.standardGap(L,'health'),1)});

t('Lücke: heute zählt nicht, nie ausgeführt ergibt null',()=>{const L=life(3);assert.equal(LC.standardGap(L,'health'),null);L.stdLog.push({area:'health',d:10,kind:'std'});assert.equal(LC.standardGap(L,'health'),null,'nur heute');L.stdLog.push({area:'health',d:7,kind:'std'});assert.equal(LC.standardGap(L,'health'),3)});

t('Nie zweimal auslassen: Grenze richtet sich nach der Häufigkeit',()=>{
 const daily=life(7);daily.stdLog.push({area:'health',d:9,kind:'std'});assert.equal(LC.standardSlipping(daily,'health'),null,'gestern gemacht');
 daily.stdLog=[{area:'health',d:8,kind:'std'}];assert.deepEqual({...LC.standardSlipping(daily,'health')},{gap:2,limit:2},'täglich: zwei Tage Lücke');
 const three=life(3);three.stdLog=[{area:'health',d:7,kind:'std'}];assert.equal(LC.standardSlipping(three,'health'),null,'3×/Woche: drei Tage sind normal');
 three.stdLog=[{area:'health',d:6,kind:'min'}];assert.equal(LC.standardSlipping(three,'health').gap,4,'Minimum zählt als Ausführung');
 const weekly=life(1);weekly.stdLog=[{area:'health',d:3,kind:'std'}];assert.equal(LC.standardSlipping(weekly,'health'),null,'1×/Woche: sieben Tage sind normal');
 weekly.stdLog=[{area:'health',d:2,kind:'std'}];assert.ok(LC.standardSlipping(weekly,'health'))});

t('Kein Hinweis heute erledigt, pausiert oder ohne Verlauf',()=>{const L=life(7);L.stdLog=[{area:'health',d:5,kind:'std'},{area:'health',d:10,kind:'min'}];assert.equal(LC.standardSlipping(L,'health'),null);
 const P=life(7,{status:'paused'});P.stdLog=[{area:'health',d:5,kind:'std'}];assert.equal(LC.standardSlipping(P,'health'),null);assert.equal(LC.standardSlipping(life(7),'health'),null)});

t('Nur Codes und Spieltage, keine Texte; Spielstand unverändert',()=>{const L=life(3);L.stdLog=[{area:'health',d:8,kind:'std'}];const before=JSON.stringify(L);LC.standardTrace(L,'health');LC.standardSlipping(L,'health');assert.equal(JSON.stringify(L),before);
 assert.ok(!JSON.stringify(LC.standardTrace(L,'health')).includes('Laufen'))});

t('Oberfläche: Spur, Hinweis und Identitätsstimme verdrahtet',()=>{assert.match(html,/data-std-trace/);assert.match(html,/data-std-slip/);assert.match(html,/const identityVote=S=>/);
 assert.equal((html.match(/identityVote\((S|before)\)/g)||[]).length,2,'Ziel-Handlung und Standard')});

console.log(ok.map(n=>'PASS '+n).join('\n'));
