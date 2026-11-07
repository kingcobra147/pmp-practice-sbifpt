import {test} from 'node:test';
import assert from 'node:assert/strict';
import {StudySync} from '../src/sync.mjs';
function fixture(overrides={}){
 let remote={state:{n:0},revision:0};const events=[],drafts=[];const engine=new StudySync({state:remote.state,revision:0,read:async()=>structuredClone(remote),write:async(state,revision)=>{if(revision!==remote.revision)throw Object.assign(Error('Conflict'),{status:409});remote={state,revision:revision+1};return {revision:remote.revision}},onStatus:s=>events.push(s),onSaved:()=>{},onConflict:()=>events.push('conflict'),persist:(...args)=>drafts.push(args),delay:60000,retryDelay:60000,...overrides});return {engine,events,drafts,getRemote:()=>remote,setRemote:r=>remote=r};
}
test('writes drafts immediately; flush includes the last change without waiting for debounce',async()=>{
 const f=fixture();try{f.engine.change({n:1});assert.equal(f.drafts.at(-1)[2],true);assert.equal(await f.engine.flush(),true);assert.deepEqual(f.getRemote(),{state:{n:1},revision:1});assert.equal(f.engine.dirty,false)}finally{f.engine.dispose()}
});
test('failed save retries without any further edits',async()=>{
 let offline=true;const f=fixture({write:async()=>{if(offline)throw Error('Offline');return {revision:1}}});try{f.engine.change({n:1});assert.equal(await f.engine.flush(),false);assert.ok(f.engine.dirty);offline=false;assert.equal(await f.engine.flush(),true);assert.equal(f.engine.revision,1)}finally{f.engine.dispose()}
});
test('lost PUT response reconciles a committed write, then saves more recent edits',async()=>{
 let remote={state:{n:0},revision:0},lost=true,writes=0;
 const f=fixture({read:async()=>remote,write:async(state,revision)=>{writes++;assert.equal(revision,remote.revision);remote={state,revision:revision+1};if(lost){lost=false;throw Error('Response lost')}return {revision:remote.revision}}});
 try{f.engine.change({n:1});await f.engine.flush();f.engine.change({n:2});assert.equal(await f.engine.flush(),true);assert.deepEqual(remote,{state:{n:2},revision:2});assert.equal(writes,2);assert.ok(!f.events.includes('conflict'))}finally{f.engine.dispose()}
});
test('conflicting devices block writes and preserve the local draft',async()=>{
 const f=fixture();try{f.setRemote({state:{n:99},revision:1});f.engine.change({n:1});assert.equal(await f.engine.flush(),false);assert.ok(f.engine.blocked);assert.ok(f.events.includes('conflict'));assert.deepEqual(f.engine.state,{n:1});assert.deepEqual(f.getRemote().state,{n:99})}finally{f.engine.dispose()}
});
test('updates during an in-flight request are serialized and never marked fully saved too soon',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);let writes=0;const f=fixture({write:async()=>{writes++;if(writes===1)await gate;return {revision:writes}}});
 try{f.engine.change({n:1});const first=f.engine.flush();f.engine.change({n:2});release();await first;assert.equal(f.engine.dirty,true);await f.engine.flush();assert.equal(f.engine.revision,2);assert.equal(f.engine.dirty,false)}finally{f.engine.dispose()}
});
test('validation errors and expired sessions stop retries without discarding data',async()=>{
 for(const status of [400,401,403,413]){const f=fixture({write:async()=>{throw Object.assign(Error('Rejected'),{status})}});try{f.engine.change({n:7});await f.engine.flush();assert.ok(f.engine.blocked);assert.deepEqual(f.engine.state,{n:7})}finally{f.engine.dispose()}}
});

test('transient failures retry automatically even when the user makes no more edits',async()=>{
 let calls=0,done;const saved=new Promise(resolve=>done=resolve);
 const f=fixture({delay:5,retryDelay:5,write:async()=>{if(++calls===1)throw Error('Temporarily offline');return {revision:1}},onSaved:()=>done()});
 let timeout;
 try{f.engine.change({n:3});await Promise.race([saved,new Promise((_,reject)=>timeout=setTimeout(()=>reject(Error('Automatic retry did not run')),2000))]);assert.equal(calls,2);assert.equal(f.engine.dirty,false)}finally{clearTimeout(timeout);f.engine.dispose()}
});
test('response reconciliation ignores object key ordering introduced by server validation',async()=>{
 let remote={state:{nested:{b:1,a:2}},revision:0};let first=true;
 const f=fixture({state:remote.state,read:async()=>remote,write:async(state)=>{remote={state:{nested:{a:state.nested.a,b:state.nested.b}},revision:1};if(first){first=false;throw Error('Lost response')}return {revision:1}}});
 try{f.engine.change({nested:{b:3,a:4}});await f.engine.flush();assert.equal(await f.engine.flush(),true);assert.ok(!f.events.includes('conflict'));assert.equal(f.engine.revision,1)}finally{f.engine.dispose()}
});
