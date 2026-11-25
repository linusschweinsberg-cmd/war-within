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
 assert.match(html,/case'persona':b=html`<\$\{PersonaSheet\}/);assert.ok(html.includes('<${PersonaCard} c=${c}/><${SkillsRow} c=${c}/><${CharacterInvite}'));
 assert.ok(html.includes('mine=(S.principles||[]).map(p=>p.n),add=PC.valuesToAdd(mine,v)'));assert.ok(html.includes('r=PC.choose(n,ids,vals,addV,cur)'));
 assert.match(html,/const choosePersona=\(ids,vals,addV,goalArea\)=>\{const before=S;/);assert.match(html,/undo:\(\)=>setS\(syncCalendar\(structuredClone\(before\)\)\)/)});
console.log('PASS persona-core');
t('Skills: add, no duplicates (case-insensitive), max twelve, trimmed, removable',()=>{const S=life({});
 assert.ok(PC.addSkill(S,'  Laufen  ',null,1));assert.equal(PC.addSkill(S,'laufen'),null);assert.equal(PC.skillList(S)[0].name,'Laufen');
 for(let i=0;i<20;i++)PC.addSkill(S,'F'+i,null,i+2);assert.equal(PC.skillList(S).length,12);
 assert.equal(PC.addSkill(S,'x'.repeat(40)),null);const id=PC.skillList(S)[0].id;assert.equal(PC.removeSkill(S,id),true);assert.equal(PC.skillList(S).length,11);
 assert.equal(PC.addSkill(S,'y'.repeat(40)).name.length,PC.SKILL_LEN)});
t('Skill hints from achieved goals and successful experiments, only until added or declined; reading never mutates',()=>{
 const S=life({goals:[{id:'g1',title:'5 km laufen',status:'achieved'},{id:'g2',title:'Sparen',status:'active'}],exps:[{id:'e1',label:'Früh aufstehen',status:'success'},{id:'e2',label:'Kalt duschen',status:'failed'}]});
 const snap=JSON.stringify(S);const h=PC.skillHints(S);assert.equal(JSON.stringify(S),snap,'render-safe');assert.deepEqual(Array.from(h,x=>x.src),['g:g1','e:e1']);
 PC.addSkill(S,h[0].name,h[0].src);PC.declineHint(S,'e:e1');assert.equal(PC.skillHints(S).length,0);
 const T=life({goals:[{id:'g',title:'Kochen',status:'achieved'}]});PC.addSkill(T,'kochen');assert.equal(PC.skillHints(T).length,0,'same name already owned')});
t('Skills survive season change data and JSON; broken data is repaired without loss',()=>{const S=life({skills:{v:0,list:[{name:'Musik',t:1},{name:'musik'},{name:''}]}});
 PC.skills(S);assert.deepEqual(Array.from(PC.skillList(S),x=>x.name),['Musik']);const back=JSON.parse(JSON.stringify(S));back.season=5;back.seasonPts=0;assert.equal(PC.skillList(back).length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(PC.skillsForSync(S))),{v:1,n:1},'sync carries no names')});
t('App wiring: skills row on Mein Leben, sheet, undo on remove',()=>{assert.ok(html.includes('<${PersonaCard} c=${c}/><${SkillsRow} c=${c}/>'));assert.ok(html.includes("case'skills':b=html`<${SkillsSheet} c=${c}/>`"));
 assert.ok(html.includes("const removeSkill=id=>{const before=S"))});
console.log('PASS skills');
t('Look: defaults from persona, locked colours and engraving refused until unlocked, invalid data falls back',()=>{const S=life({});PC.choose(S,['owl'],[],false);
 assert.equal(PC.look(S,{}).emb,'owl');assert.equal(PC.look(S,{}).set,false);
 assert.equal(PC.setLook(S,{fig:'helmet',col:'gold',emb:'star'},{}),false,'gold locked');assert.equal(PC.setLook(S,{fig:'helmet',col:'bronze',emb:'star',engrave:true},{}),true);
 assert.equal(S.life.persona.look.engrave,false,'engraving needs unlock');assert.equal(PC.look(S,{}).fig,'helmet');assert.equal(PC.look(S,{}).set,true);
 assert.equal(PC.setLook(S,{fig:'helmet',col:'gold',emb:'star',engrave:true},{palette:true,engrave:true}),true);assert.equal(PC.look(S,{}).col,'acc','locked colour hidden if unlock missing');
 PC.choose(S,['runner'],[],false);assert.equal(S.life.persona.look.fig,'helmet','changing persona keeps look');
 const B=life({persona:{v:1,ids:[],values:[],status:'later',look:{fig:'x',col:'y',emb:'z'}}});assert.deepEqual({...PC.look(B,{})},{fig:'aspis',col:'acc',emb:'star',engrave:false,set:true});
 const N=life({});assert.equal(PC.setLook(N,{fig:'column',col:'nem',emb:'spear'},{}),true);assert.equal(N.life.persona.status,'later','look alone does not count as chosen persona');assert.equal(PC.invite(N),false)});
t('App wiring: look sheet, avatar in header and persona row, undo',()=>{assert.ok(html.includes("case'look':b=html`<${LookSheet} c=${c}/>`"));assert.ok(html.includes('lk&&lk.set?html`<${CharAvatar} lk=${lk} size=${32}/>`'));assert.ok(html.includes("const saveLook=lk=>{const before=S;"))});
