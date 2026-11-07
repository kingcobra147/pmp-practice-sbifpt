import {existsSync} from 'node:fs';
import {randomBytes,scrypt as scryptCallback} from 'node:crypto';
import {promisify} from 'node:util';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(!process.env.RESET_USER_EMAIL||!process.env.RESET_NEW_PASSWORD||process.env.RESET_NEW_PASSWORD.length<12)throw new Error('Đặt RESET_USER_EMAIL và RESET_NEW_PASSWORD (ít nhất 12 ký tự) trong môi trường tạm thời. Không đưa mật khẩu vào lệnh hoặc Git.');
const {database}=await import('../lib/db.mjs');const db=await database();const row=(await db.execute({sql:'SELECT id FROM users WHERE email=?',args:[process.env.RESET_USER_EMAIL.trim().toLowerCase()]})).rows[0];if(!row)throw new Error('Không tìm thấy tài khoản.');const salt=randomBytes(16).toString('hex');const hashed=(await promisify(scryptCallback)(process.env.RESET_NEW_PASSWORD,salt,64)).toString('hex');await db.batch([{sql:'UPDATE users SET password_hash=?,salt=? WHERE id=?',args:[hashed,salt,row.id]},{sql:'DELETE FROM sessions WHERE user_id=?',args:[row.id]}],'write');db.close();console.log('Đã đặt lại mật khẩu và thu hồi các phiên cũ.');
