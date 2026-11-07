import {createClient} from '@libsql/client';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
let connection,initialization;
export const bank=JSON.parse(readFileSync(resolve('data/questions.json'),'utf8'));
const revision=createHash('sha256').update(JSON.stringify(bank)).digest('hex');
export function client(){
 if(!connection){const url=process.env.TURSO_DATABASE_URL;if(!url)throw new Error('Cần cấu hình TURSO_DATABASE_URL và TURSO_AUTH_TOKEN trên server.');if(process.env.VERCEL&&url.startsWith('file:'))throw new Error('Vercel cần database Turso từ xa.');connection=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});}
 return connection;
}
export async function database(){
 if(!initialization)initialization=initialize().catch(e=>{initialization=null;throw e});
 await initialization;return client();
}
async function initialize(){
 const db=client();await db.batch([
 'CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,salt TEXT NOT NULL,created_at INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL)',
 'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
 'CREATE TABLE IF NOT EXISTS study_state(user_id TEXT PRIMARY KEY,payload TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS questions(id TEXT PRIMARY KEY,test INTEGER NOT NULL,number INTEGER NOT NULL,payload TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS auth_limits(key TEXT PRIMARY KEY,window INTEGER NOT NULL,count INTEGER NOT NULL)'
 ],'write');
 const row=await db.execute({sql:'SELECT value FROM metadata WHERE key=?',args:['bank_revision']});
 if(row.rows[0]?.value!==revision){await db.batch([...bank.map(q=>({sql:'INSERT INTO questions(id,test,number,payload) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET test=excluded.test,number=excluded.number,payload=excluded.payload',args:[q.id,q.test,q.number,JSON.stringify(q)]})),{sql:'INSERT INTO metadata(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',args:['bank_revision',revision]}],'write');}
}
