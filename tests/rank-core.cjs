/* Saisonrang, Tageslimit und Nebenplätze: Regeln, Migration und Einbindung in complete(). */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),c=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'rank-core.js'),'utf8'),c);
const RK=c.RK,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const t=(n,f)=>{f();console.log('PASS '+n)};

t('New player: Rekrut, one side slot, cap active from season 1',()=>{const S={season:1,day:0,seasonPts:0,prog:{v:1,slots:1,capFrom:1,day:null,n:0,up:null}};RK.ensure(S);
 assert.equal(RK.rank(S).name,'Rekrut');assert.equal(RK.slots(S),1);assert.equal(RK.capActive(S),true)});

t('Existing save keeps two slots and gets the cap only from the next season',()=>{const S={season:3,day:9,seasonPts:40};RK.ensure(S);
 assert.equal(RK.slots(S),2);assert.equal(RK.capActive(S),false);for(let i=0;i<10;i++)assert.equal(RK.canEarn(S,'3-9'),true);
 S.season=4;assert.equal(RK.capActive(S),true)});

t('Daily cap: three earning completions per day, resets the next day',()=>{const S={season:1,day:0,seasonPts:0,prog:{v:1,slots:1,capFrom:1,day:null,n:0,up:null}};RK.ensure(S);
 for(let i=0;i<3;i++){assert.equal(RK.canEarn(S,'1-0'),true);RK.afterAward(S,'1-0',true)}
 assert.equal(RK.canEarn(S,'1-0'),false);RK.afterAward(S,'1-0',false);assert.equal(RK.usedToday(S,'1-0'),3,'capped completions do not count');
 assert.equal(RK.canEarn(S,'1-1'),true)});

t('Ranks follow season points and reset with the season; unlocked slots stay',()=>{const S={season:1,day:0,seasonPts:0,prog:{v:1,slots:1,capFrom:1,day:null,n:0,up:null}};RK.ensure(S);
 S.seasonPts=59;assert.equal(RK.afterAward(S,'1-0',true),null);assert.equal(RK.slots(S),1);
 S.seasonPts=61;const up=RK.afterAward(S,'1-1',true);assert.equal(up.rank,'Hoplit');assert.equal(up.slots,2);assert.equal(RK.slots(S),2);
 assert.equal(RK.afterAward(S,'1-1',true),null,'unlock reported once');
 S.seasonPts=300;assert.equal(RK.afterAward(S,'1-2',true).slots,3);assert.equal(RK.rank(S).name,'Lochagos');
 S.season=2;S.seasonPts=0;assert.equal(RK.rank(S).name,'Rekrut');assert.equal(RK.slots(S),3,'unlocks persist across seasons');
 S.seasonPts=480;assert.equal(RK.rank(S).name,'Strategos');assert.equal(RK.rank(S).next,null);assert.equal(RK.rank(S).pct,1)});

t('Ensure is idempotent and survives JSON reload',()=>{const S={season:1,day:0,seasonPts:0,prog:{v:1,slots:1,capFrom:1,day:null,n:0,up:null}};RK.ensure(S);RK.afterAward(S,'1-0',true);
 const back=JSON.parse(JSON.stringify(S)),snap=JSON.stringify(back.prog);RK.ensure(back);assert.equal(JSON.stringify(back.prog),snap);
 const broken={season:2,day:3,seasonPts:5,prog:{v:1,slots:'x'}};RK.ensure(broken);assert.equal(broken.prog.slots,2)});

t('App wiring: capped completions award zero, record the day, side slots follow RK.slots',()=>{
 assert.ok(html.includes('const {award}=awardCompletion(n,m,reward)'));
 assert.ok(html.includes('window.RK.afterAward(S,dayKey(S),award>0)'));
 assert.match(html,/\.slice\(0,RK\.slots\(S\)\):\[\]/);
 assert.match(html,/RK\.ensure\(s\)/);
 assert.match(html,/<script src="rank-core\.js\?v=ww-v\d+"><\/script>/)});
console.log('PASS rank-core');
t('Task rows say "Ohne Punkte" once the daily limit is reached',()=>{assert.match(html,/dayFull=!done&&!RK\.canEarn\(S,dayKey\(S\)\)/);assert.match(html,/dayFull\?'Ohne Punkte \(Tageslimit\) · '/)});
t('Look unlocks: palette at Lochagos, engraving at Strategos, kept after the season resets',()=>{const S={season:1,day:0,seasonPts:0,prog:{v:1,slots:1,capFrom:1,day:null,n:0,up:null}};RK.ensure(S);
 assert.deepEqual({...RK.looks(S)},{palette:false,engrave:false});S.seasonPts=300;const up=RK.afterAward(S,'1-0',true);assert.match(up.text,/Farben/);assert.equal(RK.looks(S).palette,true);
 S.seasonPts=480;assert.match(RK.afterAward(S,'1-1',true).text,/Gravur/);S.season=2;S.seasonPts=0;assert.deepEqual({...RK.looks(S)},{palette:true,engrave:true})});

t('Legacy first-day save keeps two slots and current-season exemption',()=>{const S={season:1,day:0,seasonPts:0};RK.ensure(S);assert.equal(RK.slots(S),2);assert.equal(S.prog.capFrom,2);assert.equal(RK.capActive(S),false)});
t('Migrated rank unlocks survive a season reset without another completion',()=>{const S={season:2,day:27,seasonPts:480};RK.ensure(S);assert.equal(S.prog.slots,3);S.season++;S.seasonPts=0;assert.equal(RK.slots(S),3);assert.deepEqual({...RK.looks(S)},{palette:true,engrave:true})});
t('Undo snapshot restores the daily counter and earning capacity',()=>{let S={season:1,day:0,seasonPts:0,prog:{v:1,slots:1,capFrom:1,day:null,n:0,up:null}};RK.afterAward(S,'1-0',true);RK.afterAward(S,'1-0',true);const before=JSON.parse(JSON.stringify(S));RK.afterAward(S,'1-0',true);assert.equal(RK.canEarn(S,'1-0'),false);S=before;assert.equal(RK.usedToday(S,'1-0'),2);assert.equal(RK.canEarn(S,'1-0'),true)});
