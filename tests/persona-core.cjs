/* Zukunftscharakter: Auswahl, Werte ohne Überschreiben, Ziel nur als Idee, Migration und Einbindung. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),c=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'persona-core.js'),'utf8'),c);
const PC=c.PC,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const t=(n,f)=>{f();console.log('PASS '+n)};
const life=x=>({life:{values:[],goals:[],...x}});

t('Old saves have no persona: invite shown, nothing changed by ensure',()=>{const S=life({values:['Mut']});const snap=JSON.stringify(S);
 assert.equal(PC.ensure(S),null);assert.equal(JSON.stringify(S),snap);assert.equal(PC.invite(S),true);assert.equal(PC.chosen(S).length,0)});

t('Toggle allows at most two, no duplicates, unknown ids ignored',()=>{let ids=[];ids=PC.toggle(ids,'runner');ids=PC.toggle(ids,'runner');assert.equal(ids.length,0);
 ids=PC.toggle(PC.toggle(PC.toggle([],'runner'),'scroll'),'owl');assert.deepEqual([...ids],['runner','scroll']);assert.deepEqual([...PC.toggle(ids,'nope')],['runner','scroll'])});

t('Value suggestions merge without duplicates, at most three',()=>{const v=PC.suggestValues(['runner','column']);assert.deepEqual([...v],['Disziplin','Gesundheit','Mut']);assert.equal(PC.suggestValues(['star']).length,0)});

t('Adopting values only fills free places and never replaces',()=>{assert.deepEqual([...PC.valuesToAdd(['Mut'],['Mut','Neugier','Ehrlichkeit','Exzellenz'])],['Neugier','Ehrlichkeit']);
 assert.equal(PC.valuesToAdd(['A','B','C'],['D']).length,0);
 const S=life({values:['Integrität','Mut','Verantwortung']});const r=PC.choose(S,['scroll'],['Neugier'],true);assert.equal(r.added.length,0);assert.deepEqual([...S.life.values],['Integrität','Mut','Verantwortung']);
 const P=life({values:[]});assert.equal(PC.choose(P,['scroll'],['Neugier'],true,['Mut','Ehrlichkeit','Respekt']).added.length,0,'shown values (principles) are the source')});

t('Goal is only suggested where no active goal exists; choose never creates goals or actions',()=>{const S=life({goals:[{id:'g',area:'health',status:'active'}],actions:[]});
 assert.equal(PC.goalHint(S,['runner']),null);assert.equal(PC.goalHint(S,['scroll']).area,'growth');assert.equal(PC.goalHint(S,['star']),null);
 const before=JSON.stringify({g:S.life.goals,a:S.life.actions});PC.choose(S,['runner','scroll'],['Neugier'],false);assert.equal(JSON.stringify({g:S.life.goals,a:S.life.actions}),before)});

t('Choose, change, remove and later; persists through JSON and repairs bad data',()=>{const S=life({});PC.choose(S,['owl','owl','x','runner','scroll'],['Freiheit',' ',5],false,1);
 assert.deepEqual([...S.life.persona.ids],['owl','runner']);assert.deepEqual([...S.life.persona.values],['Freiheit']);assert.equal(S.life.persona.status,'set');assert.equal(PC.invite(S),false);
 const back=JSON.parse(JSON.stringify(S));assert.equal(PC.chosen(back).map(p=>p.name).join(','),'Eule,Läufer');
 PC.choose(S,[],[],false);assert.equal(S.life.persona.status,'later');assert.equal(PC.chosen(S).length,0);
 const L=life({});PC.later(L);assert.equal(PC.invite(L),false);assert.equal(L.life.persona.status,'later');
 const bad=life({persona:{v:9,ids:'x'}});PC.ensure(bad);assert.equal(bad.life.persona.v,1);assert.equal(bad.life.persona.ids.length,0);
 assert.deepEqual(JSON.parse(JSON.stringify(PC.forSync(S))),{v:1,ids:[],status:'later'})});

t('App wiring: script, ensure on load, sheet, card on Mein Leben, undo snapshot',()=>{
 assert.match(html,/<script src="persona-core\.js\?v=ww-v\d+"><\/script>/);assert.match(html,/PC\.ensure\(s\)/);
 assert.match(html,/case'persona':b=html`<\$\{PersonaSheet\}/);assert.match(html,/<\$\{PersonaCard\} c=\$\{c\}\/><\$\{CharacterInvite\}/);
 assert.ok(html.includes('mine=(S.principles||[]).map(p=>p.n),add=PC.valuesToAdd(mine,v)'));assert.ok(html.includes('r=PC.choose(n,ids,vals,addV,cur)'));
 assert.match(html,/const choosePersona=\(ids,vals,addV,goalArea\)=>\{const before=S;/);assert.match(html,/undo:\(\)=>setS\(syncCalendar\(structuredClone\(before\)\)\)/)});
console.log('PASS persona-core');
