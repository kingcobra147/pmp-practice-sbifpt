import {existsSync} from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(existsSync('.env'))process.loadEnvFile('.env');
const {database}=await import('../lib/db.mjs');const db=await database();console.log('Database ready:',(await db.execute('SELECT COUNT(*) AS n FROM questions')).rows[0].n,'questions');db.close();
