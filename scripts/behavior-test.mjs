import assert from 'node:assert/strict';
import worker from '../worker.mjs';
let assetCalls=0;const env={ASSETS:{fetch:async()=>{assetCalls++;return new Response('missing',{status:404});}}};
for(const u of ['http://daejeonmarket.com/privacy/?q=1','https://www.daejeonmarket.com/privacy/?q=1']){const r=await worker.fetch(new Request(u),env);assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://daejeonmarket.com/privacy/?q=1');}
let r=await worker.fetch(new Request('https://daejeonmarket.com/cookies?q=1'),env);assert.equal(r.headers.get('location'),'https://daejeonmarket.com/cookies/?q=1');r=await worker.fetch(new Request('https://daejeonmarket.com/missing'),env);assert.equal(r.status,404);assert.equal(await r.text(),'missing');assert.match(r.headers.get('X-Robots-Tag'),/noindex/);assert.equal(assetCalls,1);
await import('./consent-test.mjs');
