import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../worker.mjs';
let assetCalls=0;const env={ASSETS:{fetch:async()=>{assetCalls++;return new Response('missing',{status:404});}}};
for(const u of ['http://daejeonmarket.com/privacy/?q=1','https://www.daejeonmarket.com/privacy/?q=1']){const r=await worker.fetch(new Request(u),env);assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://daejeonmarket.com/privacy/?q=1');}
let r=await worker.fetch(new Request('https://daejeonmarket.com/cookies?q=1'),env);assert.equal(r.headers.get('location'),'https://daejeonmarket.com/cookies/?q=1');r=await worker.fetch(new Request('https://daejeonmarket.com/missing'),env);assert.equal(r.status,404);assert.equal(await r.text(),'missing');assert.match(r.headers.get('X-Robots-Tag'),/noindex/);assert.equal(assetCalls,1);
const code=readFileSync('public/consent.js','utf8');
let raw=JSON.stringify({analytics:true}), writable=true, session={};
const storage={getItem:()=>raw,setItem:(k,v)=>{if(!writable)throw Error('blocked');if(k==='djcm-cookie-preferences')raw=v;},removeItem:()=>{if(!writable)throw Error('blocked');}};
const sessionStorage={getItem:k=>session[k]||null,setItem:(k,v)=>{session[k]=v},removeItem:k=>{delete session[k]}};
function page(name=''){const scripts=[];const window={name};const document={getElementById:id=>scripts.find(s=>s.id===id),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};vm.runInNewContext(code,{window,document,localStorage:storage,sessionStorage});return {window,scripts};}
let p=page();assert.equal(p.scripts.length,1);writable=false;assert.equal(p.window.djcmConsent.save(false),false);assert.equal(p.window['ga-disable-G-HXM22WWPKP'],true);
let next=page(p.window.name);assert.equal(next.scripts.length,0);assert.equal(next.window['ga-disable-G-HXM22WWPKP'],true);assert.equal(JSON.parse(raw).analytics,true);
// Even if session/name cannot carry the tombstone, blocked writes refuse a stale grant.
session={};next=page();assert.equal(next.scripts.length,0);assert.equal(next.window.djcmConsent.save(true),false);assert.equal(next.scripts.length,1);assert.equal(page().scripts.length,0);
writable=true;const chosen=page();chosen.window.djcmConsent.save(false);assert.equal(page(chosen.window.name).scripts.length,0);chosen.window.djcmConsent.save(true);assert.equal(page(chosen.window.name).scripts.length,1);
storage.getItem=()=>{throw Error('blocked read')};assert.equal(page().scripts.length,0);
console.log('PASS Worker 301/query/ASSETS404; consent immediate refusal, failed writes and stale grants across pages.');
// Refusal must survive same-tab navigation even when session storage is unavailable.
raw=JSON.stringify({analytics:true});writable=true;storage.getItem=()=>raw;
sessionStorage.getItem=()=>{throw Error('session blocked')};sessionStorage.setItem=()=>{throw Error('session blocked')};sessionStorage.removeItem=()=>{throw Error('session blocked')};
p=page();assert.equal(p.scripts.length,1);writable=false;p.window.djcmConsent.save(false);writable=true;next=page(p.window.name);assert.equal(next.scripts.length,0);assert.equal(next.window['ga-disable-G-HXM22WWPKP'],true);
console.log('PASS session-storage failure: window-name veto prevents stale-grant recovery in same tab.');
