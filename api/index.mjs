import {randomBytes,randomUUID,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {database,bank} from '../lib/db.mjs';
import {normalizeState,MAX_STATE_BYTES} from '../shared/study.mjs';
const scrypt=promisify(scryptCallback),age=30*24*60*60;
const hash=s=>createHash('sha256').update(s).digest('hex');
function equal(a,b){return timingSafeEqual(Buffer.from(hash(a),'hex'),Buffer.from(hash(b),'hex'))}
function json(value,status=200,headers={}){return Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}})}
function token(req){const match=(req.headers.get('cookie')||'').match(/(?:^|;\s*)pmp_session=([^;]+)/);return match?match[1]:null}
function cookie(req,value,ttl=age){return `pmp_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}${process.env.VERCEL||new URL(req.url).protocol==='https:'?'; Secure':''}`}
async function body(req){const raw=await req.text();if(Buffer.byteLength(raw)>MAX_STATE_BYTES)throw Object.assign(Error('Dữ liệu quá lớn'),{status:413});try{return JSON.parse(raw)}catch{throw Object.assign(Error('JSON không hợp lệ'),{status:400})}}
async function user(req){const value=token(req);if(!value||value.length!==64)return null;const db=await database();const result=await db.execute({sql:'SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',args:[hash(value),Date.now()]});return result.rows[0]||null}
async function session(req,person){const value=randomBytes(32).toString('hex');const db=await database();await db.execute({sql:'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',args:[hash(value),person.id,Date.now()+age*1000]});return json({user:{id:person.id,email:person.email,name:person.name}},200,{'Set-Cookie':cookie(req,value)})}
async function rateLimit(req,email){
 const ip=(req.headers.get('x-forwarded-for')||'local').split(',')[0].trim();const bucket=Math.floor(Date.now()/900000);const db=await database();
 for(const key of ['ip:'+hash(ip),'email:'+hash(email)]){
 const row=await db.execute({sql:'INSERT INTO auth_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count',args:[key,bucket]});
 if(Number(row.rows[0].count)>30)throw Object.assign(Error('Thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.'),{status:429});
 }
}
export async function handle(req){
 try{
 const url=new URL(req.url);const route=(url.searchParams.get('route')||url.pathname.replace(/^\/api\/?/,'')).replace(/\/+$/,'');const method=req.method;
 if(!['GET','HEAD'].includes(method)){
  const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Yêu cầu khác nguồn bị từ chối'},403);
 }
 if(route==='auth/me'&&method==='GET'){const person=await user(req);return person?json({user:person}):json({user:null},401)}
 if(['auth/login','auth/register'].includes(route)&&method==='POST'){
  const input=await body(req);if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'Dữ liệu đăng nhập không hợp lệ'},400);const email=String(input.email||'').trim().toLowerCase();const password=String(input.password||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length>256)return json({error:'Email hoặc mật khẩu không hợp lệ'},400);
  await rateLimit(req,email);const db=await database();
  if(route==='auth/register'){
   const code=process.env.APP_SIGNUP_CODE;if(!code)return json({error:'Đăng ký hiện đang đóng. Liên hệ người quản trị.'},403);
   if(!equal(String(input.inviteCode||''),code))return json({error:'Mã tham gia không đúng'},403);
   const name=String(input.name||'').trim();if(name.length<2||name.length>80||password.length<12)return json({error:'Tên dài 2–80 ký tự, mật khẩu tối thiểu 12 ký tự.'},400);
   const salt=randomBytes(16).toString('hex'),passwordHash=(await scrypt(password,salt,64)).toString('hex');const person={id:randomUUID(),email,name};
   try{await db.execute({sql:'INSERT INTO users(id,email,name,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)',args:[person.id,email,name,passwordHash,salt,Date.now()]})}catch(e){if(String(e.code).includes('CONSTRAINT'))return json({error:'Không tạo được tài khoản với email này. Thử đăng nhập hoặc liên hệ quản trị.'},409);throw e}
   return session(req,person);
  }
  const row=(await db.execute({sql:'SELECT * FROM users WHERE email=?',args:[email]})).rows[0];const candidate=(await scrypt(password,row?.salt||'00000000000000000000000000000000',64)).toString('hex');if(!row||!equal(candidate,String(row.password_hash)))return json({error:'Email hoặc mật khẩu không đúng'},401);
  return session(req,row);
 }
 const person=await user(req);if(!person)return json({error:'Vui lòng đăng nhập'},401);const db=await database();
 if(route==='auth/logout'&&method==='POST'){await db.execute({sql:'DELETE FROM sessions WHERE token_hash=?',args:[hash(token(req)||'')]});return json({ok:true},200,{'Set-Cookie':cookie(req,'',0)})}
 if(route==='bank'&&method==='GET'){const result=await db.execute('SELECT payload FROM questions ORDER BY test,number');return json({questions:result.rows.map(r=>JSON.parse(String(r.payload)))})}
 if(route==='state'){
  if(req.headers.get('x-user-id')!==person.id)return json({error:'Phiên đăng nhập đã thay đổi. Hãy tải lại trang.'},403);
  if(method==='GET'){const row=(await db.execute({sql:'SELECT payload,revision FROM study_state WHERE user_id=?',args:[person.id]})).rows[0];return json(row?JSON.parse(String(row.payload)):{},200,{'ETag':String(row?.revision||0)})}
  if(method==='PUT'){
   const state=normalizeState(await body(req),bank);
   const revision=Number(req.headers.get('if-match'));if(!req.headers.has('if-match')||!Number.isSafeInteger(revision)||revision<0)return json({error:'Thiếu phiên bản dữ liệu'},400);
   const args=[JSON.stringify(state),revision+1,Date.now(),person.id,revision];
   const result=revision===0?await db.execute({sql:'INSERT INTO study_state(payload,revision,updated_at,user_id) VALUES(?,?,?,?) ON CONFLICT(user_id) DO NOTHING',args:args.slice(0,4)}):await db.execute({sql:'UPDATE study_state SET payload=?,revision=?,updated_at=? WHERE user_id=? AND revision=?',args});
   if(!result.rowsAffected)return json({error:'Tiến độ đã thay đổi trên thiết bị hoặc tab khác. Tải lại trang để tiếp tục.'},409);
   return json({ok:true,revision:revision+1});
  }
 }
 if(route==='file'&&['GET','HEAD'].includes(method)){
  const kind=url.searchParams.get('kind'),name=url.searchParams.get('name');const allowed={sources:['part-1.pdf','part-2.pdf','part-3.pdf','part-4.pdf'],downloads:['pmp-question-bank.sqlite','questions.json']};
  if(!allowed[kind]?.includes(name))return json({error:'Không tìm thấy file'},404);
  const file=readFileSync(resolve('server-assets',kind,name));const headers={'Content-Type':name.endsWith('.pdf')?'application/pdf':name.endsWith('.json')?'application/json':'application/vnd.sqlite3','Cache-Control':'private, no-store','Accept-Ranges':'bytes'};if(kind==='downloads')headers['Content-Disposition']=`attachment; filename="${name}"`;
  let start=0,end=file.length-1,status=200;const range=req.headers.get('range');if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${file.length}`}});start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;if(start>end||start>=file.length)return new Response(null,{status:416});status=206;headers['Content-Range']=`bytes ${start}-${end}/${file.length}`}
  headers['Content-Length']=String(end-start+1);return new Response(method==='HEAD'?null:file.subarray(start,end+1),{status,headers});
 }
 return json({error:'Không tìm thấy API'},404);
 }catch(e){if(!e.status||e.status>=500)console.error('PMP API:',e.code||e.name);return json({error:e.status?e.message:'Không kết nối được database. Kiểm tra cấu hình server hoặc thử lại.'},e.status||503)}
}
export default {fetch:handle};
