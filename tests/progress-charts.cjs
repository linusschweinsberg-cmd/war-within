/* Fortschritt-Grafiken: Werte kommen nur aus echten Einträgen; leere Zustände ohne Fantasiezahlen. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('function loadState'));
const c=vm.createContext({window:{authApi:{}},React:{},htm:{bind:()=>()=>null},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>null},console});
for(const f of ['life-core.js','wisdom-core.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(script+';globalThis.a={progressData};',c);const LC=c.window.LC,a=c.a;
const t=(n,f)=>{f();console.log('PASS '+n)};
t('Empty life: no invented numbers',()=>{const S={life:LC.ensureLife({}).life||{}};S.life=S.life||{};const L=LC.newLife?LC.newLife():{};S.life={...L,d:3,log:[],stdLog:[],goals:[],actions:[],standards:{}};
 const P=a.progressData(S,Date.parse('2026-11-27T10:00Z'));assert.ok(P.days.every(x=>x.n===0));assert.ok(P.areas.every(x=>x.planned===0));assert.ok(P.weeks.every(x=>x.rate===null))});
t('Counts actions and standards per day of the current week only',()=>{const L={...(LC.newLife?LC.newLife():{}),d:9,goals:[],actions:[],standards:{},log:[{aid:'x',d:9,wk:1},{aid:'x',d:8,wk:1},{aid:'y',d:2,wk:0}],stdLog:[{area:'health',d:9,wk:1,kind:'std'}]};
 const P=a.progressData({life:L},Date.parse('2026-11-27T10:00Z'));const today=P.days.find(x=>x.today);assert.equal(today.n,2);assert.equal(P.days.length,7,'always seven days');assert.ok(!P.days.some(x=>x.d===2),'older than 7 days not shown');assert.equal(P.days.reduce((s,x)=>s+x.n,0),3)});
t('Wired at the top of Fortschritt',()=>{assert.ok(source.includes('<${PersonalSeasonCard} S=${c.S}/><${ProgressCharts} c=${c}/>'))});
t('Basis shows only the simple view (this week + goals); Erweitert keeps everything',()=>{assert.ok(source.includes('if(!adv)return html`<div className="screen px-4 pb-6">'));assert.ok(source.includes('<${SimpleProgress} c=${c}/>'));assert.ok(source.includes('data-simple-progress'))});
console.log('PASS progress-charts');
