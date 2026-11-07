import http from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');if(existsSync('.env'))process.loadEnvFile('.env');
const {handle}=await import('../api/index.mjs');const dist=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{const origin=`http://${req.headers.host}`;const url=new URL(req.url,origin);let api=url.pathname.startsWith('/api/');
const m=/^\/(sources|downloads)\/([^/]+)$/.exec(url.pathname);if(m){url.pathname='/api/index';url.searchParams.set('route','file');url.searchParams.set('kind',m[1]);url.searchParams.set('name',m[2]);api=true}
if(api){const parts=[];let size=0;for await(const p of req){size+=p.length;if(size>1500000){res.writeHead(413);return res.end()}parts.push(p)}const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})});const r=await handle(request);res.writeHead(r.status,Object.fromEntries(r.headers));return res.end(Buffer.from(await r.arrayBuffer()))}
const file=resolve(dist,url.pathname==='/'?'index.html':'.'+decodeURIComponent(url.pathname));if(!file.startsWith(dist+sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));
}catch{res.writeHead(500);res.end('Server error')}});server.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:'+server.address().port));
