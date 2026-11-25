/* Exercise the actual notification callback and undo expiry with a controlled clock. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const callback=source.split(/\r?\n/).find(x=>x.includes('const toast=useCallback('));
const expiry=source.split(/\r?\n/).find(x=>x.includes('if(!undo)return;const t=setTimeout'));
assert.ok(callback&&expiry,'actual App notification lifecycle found');
let notice=null,toasts=[],seq=0,score=10,restored=0;const timers=[];
const c=vm.createContext({
 useCallback:f=>f,useEffect:f=>f(),uid:()=>++seq,
 setUndo:f=>{notice=typeof f==='function'?f(notice):f},setToasts:f=>{toasts=f(toasts)},
 setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout:()=>{}
});
vm.runInContext(callback+';globalThis.notify=toast;',c);
c.notify('Network unavailable','warn');
c.notify('Earlier success','good');
c.notify('Erledigt: Lesen','good',{detail:'Umsetzung 1/3 diese Woche',undo:()=>{score=0;restored++}});
assert.equal(toasts.length,1,'completion does not stack a second success message');
assert.equal(toasts[0].kind,'warn','network errors stay visible');
assert.equal(notice.msg,'Erledigt: Lesen');assert.equal(notice.detail,'Umsetzung 1/3 diese Woche');
c.currentUndo=notice;vm.runInContext('{const undo=currentUndo;'+expiry+'}',c);
const first=timers.at(-1);assert.equal(first.ms,5000,'five full seconds to undo');
notice.restore();assert.equal(score,0);assert.equal(restored,1);
for(const text of ['Standard notiert.','Erster Schritt erledigt.','Sicherung wiederhergestellt.']){
 c.notify(text,'good',{undo:()=>{restored++}});assert.equal(notice.msg,text);assert.equal(toasts.length,1);
}
const latest=notice;first.fn();assert.equal(notice,latest,'an old expiry cannot dismiss the newest undo');
c.currentUndo=notice;vm.runInContext('{const undo=currentUndo;'+expiry+'}',c);
timers.at(-1).fn();assert.equal(notice,null,'current undo expires');
console.log('PASS action feedback: one undo notice, errors preserved, all snapshot actions, five seconds, safe replacement');
