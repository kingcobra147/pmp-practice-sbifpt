import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
const temp=mkdtempSync(join(tmpdir(),'pmp-multiuser-'));process.env.TURSO_DATABASE_URL='file:'+join(temp,'test.db');process.env.APP_SIGNUP_CODE=randomBytes(20).toString('hex');delete process.env.VERCEL;
const {handle}=await import('../api/index.mjs');const {client}=await import('../lib/db.mjs');const base='http://localhost:3000';
// Keep request bodies explicit to exercise actual auth and state parsing.
async function call(route,opts={}){const {method='GET',body,cookie,userId,revision,origin}=opts;return handle(new Request(`${base}/api/${route}`,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(userId?{'X-User-ID':userId}:{}),...(revision!==undefined?{'If-Match':String(revision)}:{}),...(origin?{Origin:origin}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})}))}
const password=randomBytes(20).toString('hex'),state={bookmarks:['t2-q044'],wrong:['t1-q001'],attempts:[],run:null};
try{
 assert.equal((await call('bank')).status,401);assert.equal((await call('auth/me')).status,401);
 assert.equal((await call('auth/register',{method:'POST',body:{email:'a@example.com',name:'Person A',password,inviteCode:'wrong'}})).status,403);
 const signup=async(email,name)=>{const r=await call('auth/register',{method:'POST',body:{email,name,password,inviteCode:process.env.APP_SIGNUP_CODE}});assert.equal(r.status,200);const cookie=r.headers.get('Set-Cookie').split(';')[0];assert.ok(r.headers.get('Set-Cookie').includes('HttpOnly'));return {...await r.json(),cookie}};
 const a=await signup('a@example.com','Person A'),b=await signup('b@example.com','Person B');assert.notEqual(a.user.id,b.user.id);
 assert.equal((await call('auth/login',{method:'POST',body:{email:'a@example.com',password:'wrong'}})).status,401);
 const bank=(await(await call('bank',{cookie:a.cookie})).json()).questions;assert.equal(bank.length,1127);assert.equal(bank.filter(q=>q.status==='ready').length,1122);
 assert.equal((await call('state',{cookie:a.cookie,userId:b.user.id})).status,403);
 assert.equal((await call('state',{method:'PUT',cookie:a.cookie,userId:a.user.id,revision:0,body:state})).status,200);
 assert.equal((await call('state',{method:'PUT',cookie:a.cookie,userId:a.user.id,revision:0,body:state})).status,409);
 assert.equal((await call('state',{method:'PUT',cookie:a.cookie,userId:a.user.id,revision:1,origin:'https://other.example',body:state})).status,403);
 assert.deepEqual(await(await call('state',{cookie:b.cookie,userId:b.user.id})).json(),{});
 const getA=await call('state',{cookie:a.cookie,userId:a.user.id});assert.equal(getA.headers.get('ETag'),'1');assert.deepEqual(await getA.json(),state);
 const login=await call('auth/login',{method:'POST',body:{email:'A@example.com',password}});assert.equal(login.status,200);const secondCookie=login.headers.get('Set-Cookie').split(';')[0];assert.deepEqual(await(await call('state',{cookie:secondCookie,userId:a.user.id})).json(),state);
 const file=await call('file?kind=sources&name=part-1.pdf',{cookie:a.cookie});assert.equal(file.status,200);assert.ok((await file.arrayBuffer()).byteLength>1000);assert.equal((await call('file?kind=sources&name=part-1.pdf')).status,401);
 assert.equal((await call('file?kind=sources&name=../../.env',{cookie:a.cookie})).status,404);
 await call('auth/logout',{method:'POST',cookie:a.cookie});assert.equal((await call('state',{cookie:a.cookie,userId:a.user.id})).status,401);assert.equal((await call('state',{cookie:b.cookie,userId:b.user.id})).status,200);
 assert.equal((await call('state',{method:'PUT',cookie:secondCookie,userId:b.user.id,revision:0,body:state})).status,403);
 const db=client();const rows=await db.execute('SELECT * FROM users');assert.equal(rows.rows.length,2);assert.ok(rows.rows.every(u=>u.password_hash!==password));assert.equal((await db.execute('SELECT COUNT(*) AS n FROM study_state')).rows[0].n,1);
 console.log('PASS: registration, login, hashed passwords, 1127/1122 questions, isolated user state, multi-device sessions, conflict rejection, CSRF, private PDFs and logout.');
}finally{client().close();rmSync(temp,{recursive:true,force:true})}
