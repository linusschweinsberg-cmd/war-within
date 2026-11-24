/* Validate actual release worker offline plus upgrade from a legacy cache-first worker. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const origin='https://test.invalid',toURL=x=>new URL(typeof x==='string'?x:x.url,origin+'/').href;
const handlers={},buckets=new Map(),network=[];let offline=false;
const response=url=>({ok:true,url,clone(){return response(url)}});
const cache={async put(req,res){this.data.set(toURL(req),res)},async addAll(urls){for(const u of urls)this.data.set(toURL(u),response(toURL(u)))}};
const caches={async open(name){if(!buckets.has(name))buckets.set(name,{...cache,data:new Map()});return buckets.get(name)},async keys(){return [...buckets.keys()]},async delete(name){return buckets.delete(name)},async match(req){for(const b of buckets.values()){const hit=b.data.get(toURL(req));if(hit)return hit}}};
const fetch=async req=>{if(offline)throw Error('offline');const url=toURL(req);network.push(url);return response(url)};
vm.runInNewContext(sw,{URL,caches,fetch,self:{location:{origin},addEventListener:(n,f)=>handlers[n]=f,skipWaiting(){},clients:{claim:async()=>{}}}});
const event=async name=>{let task;handlers[name]({waitUntil:p=>task=p});await task};
(async()=>{const old=await caches.open('ww-v43');for(const f of ['auth.js','life-core.js','wisdom-core.js'])await old.put('./'+f,response('OLD:'+f));
 const scripts=[...html.matchAll(/<script src="(?!https?:)([^"]+)"/g)].map(x=>x[1]);assert.equal(scripts.length,8);
 for(const src of scripts){assert.match(src,/\?v=ww-v74$/);assert.ok(sw.includes("'./"+src+"'"),'precache exact versioned URL');const result=await caches.match(src)||await fetch(src);assert.ok(!result.url.startsWith('OLD:'),'legacy worker bypassed');}
 await event('install');await event('activate');assert.ok(!buckets.has('ww-v43'));offline=true;
 for(const src of ['./',...scripts]){let task;handlers.fetch({request:{url:toURL(src),method:'GET',mode:src==='./'?'navigate':'cors'},respondWith:p=>task=p});const r=await task;assert.ok(r&&r.ok,'offline cache hit '+src)}
 console.log('PASS service worker: legacy upgrade uses new scripts, exact precache, full origin offline shell and scripts');
})().catch(e=>{console.error(e);process.exitCode=1});
