/* THE WAR WITHIN – Saisonrang, Punkte-Tageslimit und Nebenplätze (window.RK)
   Konzept: docs/SPIELKONZEPT.md, Abschnitt 5. Reine Regeln, keine Darstellung.
   - Saisonrang aus S.seasonPts (setzt sich mit der Saison zurück, keine eigene Speicherung).
   - Nebenplätze: einmal erreicht, dauerhaft verfügbar (S.prog.slots). Mehr Plätze sind ein Angebot.
   - Tageslimit: Saisonpunkte für höchstens DAY_CAP Erledigungen pro Tag (Hauptschlacht + 2 Nebenplätze).
     Gilt für bestehende Spielstände erst ab der nächsten Saison (S.prog.capFrom). */
(function(G){
 'use strict';
 const V=1,DAY_CAP=3,MAX_SLOTS=3;
 const RANKS=[{min:0,name:'Rekrut',slots:1},{min:60,name:'Hoplit',slots:2},{min:160,name:'Veteran',slots:2},{min:300,name:'Lochagos',slots:3,look:'palette'},{min:480,name:'Strategos',slots:3,look:'engrave'}];
 const LOOK_TEXT={palette:'zwei neue Farben für deinen Charakter',engrave:'eine Gravur für dein Emblem'};
 const NEW_SLOT={2:'ein zweiter Nebenplatz',3:'ein dritter Nebenplatz'};

 /* Bestehende Spielstände: alles, was sie heute haben (2 Nebenplätze), Tageslimit erst ab nächster Saison. */
 function ensure(S){if(!S)return null;const p=S.prog;
  if(p&&p.v===V&&Number.isInteger(p.slots)&&Number.isInteger(p.capFrom))return p;
  const used=(S.seasonPts||0)>0||(S.day||0)>0||(S.season||1)>1;
  S.prog={v:V,slots:used?2:1,capFrom:(S.season||1)+(used?1:0),day:null,n:0,up:null};return S.prog}

 function rank(S){const pts=Math.max(0,S.seasonPts||0);let i=RANKS.length-1;while(i>0&&pts<RANKS[i].min)i--;
  const r=RANKS[i],nx=RANKS[i+1]||null;return{i,name:r.name,pts,min:r.min,next:nx,pct:nx?(pts-r.min)/(nx.min-r.min):1}}

 const slots=S=>Math.min(MAX_SLOTS,Math.max(ensure(S).slots,RANKS[rank(S).i].slots));
 const capActive=S=>(S.season||1)>=ensure(S).capFrom;
 const usedToday=(S,key)=>{const p=ensure(S);return p.day===key?p.n:0};
 const canEarn=(S,key)=>!capActive(S)||usedToday(S,key)<DAY_CAP;
 /* Optik-Freischaltungen: einmal erreicht, dauerhaft */
 const looks=S=>{const p=ensure(S),i=rank(S).i,has=k=>!!(p[k]||RANKS.slice(0,i+1).some(r=>r.look===k));return{palette:has('palette'),engrave:has('engrave')}};

 /* Nach einer Erledigung mit Punkten aufrufen. Gibt eine neue Freischaltung zurück (oder null). */
 function afterAward(S,key,earned,t=Date.now()){const p=ensure(S);
  if(earned){if(p.day!==key){p.day=key;p.n=0}p.n++}
  const r=rank(S),want=RANKS[r.i].slots;let up=null;if(want>p.slots){p.slots=want;up={rank:r.name,slots:want,text:NEW_SLOT[want],season:S.season,t}}
  RANKS.slice(0,r.i+1).forEach(x=>{if(x.look&&!p[x.look]){p[x.look]=true;up=up?{...up,text:up.text+' und '+LOOK_TEXT[x.look]}:{rank:r.name,slots:p.slots,text:LOOK_TEXT[x.look],season:S.season,t}}});
  if(up)p.up=up;return up}

 G.RK={V,DAY_CAP,RANKS,ensure,rank,slots,capActive,usedToday,canEarn,afterAward,looks};
})(typeof window!=='undefined'?window:globalThis);
