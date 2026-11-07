import {useState,useEffect,useRef,useCallback} from 'react';
import {normalizeState,emptyState,MAX_STATE_BYTES,stableStringify} from '../shared/study.mjs';
import {StudySync} from './sync.mjs';
const getJSON=async(url:string,options:any={})=>{const r=await fetch(url,options);const body=await r.json();if(!r.ok)throw Object.assign(Error(body.error||'Không kết nối được dữ liệu'),{status:r.status});return {body,revision:Number(r.headers.get('ETag')||0)}};
export function useStudyState(userId:string){
 const [data,render]=useState<any>(emptyState),[bank,setBank]=useState<any[]>([]),[ready,setReady]=useState(false),[error,setError]=useState(''),[sync,setSync]=useState('Đang kết nối…'),[conflict,setConflict]=useState(false),[recovery,setRecovery]=useState<any>(null),[storageError,setStorageError]=useState(''),[conflictReason,setConflictReason]=useState('');
 const current=useRef<any>(emptyState()),engine=useRef<any>(null),bankRef=useRef<any[]>([]),alive=useRef(true),key=useRef('');
 const persist=useCallback((state:any,revision:number,dirty:boolean)=>{try{localStorage.setItem(key.current,JSON.stringify({state,revision,dirty,savedAt:Date.now()}));localStorage.setItem(`pmp-last-draft:${userId}`,key.current);setStorageError('')}catch{setStorageError('Bộ nhớ trên máy không khả dụng hoặc đã đầy. Giữ trang mở đến khi đồng bộ, hoặc tải bản sao JSON.')}},[userId]);
 const read=useCallback(async()=>{const r=await getJSON('/api/state',{headers:{'X-User-ID':userId}});return {state:normalizeState(Object.keys(r.body).length?r.body:emptyState(),bankRef.current),revision:r.revision}},[userId]);
 const attach=useCallback((state:any,revision:number,dirty=false,remoteState=state)=>{
  engine.current?.dispose();current.current=state;render(state);
  const e=new StudySync({state:remoteState,revision,read,write:async(state:any,revision:number)=>{if(new TextEncoder().encode(JSON.stringify(state)).length>MAX_STATE_BYTES)throw Object.assign(Error('Tiến độ vượt giới hạn 4 MB. Hãy tải bản sao JSON và giảm lịch sử hoặc ghi chú.'),{status:413});const r=await getJSON('/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-User-ID':userId,'If-Match':String(revision)},body:JSON.stringify(state)});return r.body},persist,onStatus:(s:string)=>{if(alive.current)setSync(s)},onSaved:()=>{},onConflict:(_remote:any,e:any)=>{if(alive.current){setConflict(true);setConflictReason(e?.message||'Dữ liệu trên máy chủ khác bản nháp.')}}});
  engine.current=e;if(dirty)e.change(state);else {persist(state,revision,false);setSync('Đã đồng bộ')}
 },[read,persist,userId]);
 useEffect(()=>{
  alive.current=true;let cancelled=false;
  try {let tab=sessionStorage.getItem('pmp-tab');if(!tab){tab=crypto.randomUUID();sessionStorage.setItem('pmp-tab',tab)}key.current=`pmp-draft-v3:${userId}:${tab}`}catch{key.current=`pmp-draft-v3:${userId}`}
  async function load(){
   let draft:any=null;try{
    draft=JSON.parse(localStorage.getItem(key.current)||'null');
    if(!draft){const lastKey=localStorage.getItem(`pmp-last-draft:${userId}`);if(lastKey?.startsWith(`pmp-draft-v3:${userId}:`)){const last=JSON.parse(localStorage.getItem(lastKey)||'null');if(last?.dirty)draft=last}}
   }catch{}
   try{
    const [b,s]=await Promise.all([getJSON('/api/bank'),getJSON('/api/state',{headers:{'X-User-ID':userId}})]);
    if(cancelled)return;bankRef.current=b.body.questions;setBank(b.body.questions);
    try{localStorage.setItem(`pmp-bank:${userId}`,JSON.stringify(b.body.questions))}catch{}
    const remote=normalizeState(Object.keys(s.body).length?s.body:emptyState(),b.body.questions);
    let local=null;try{if(draft?.dirty)local=normalizeState(draft.state,b.body.questions)}catch{setStorageError('Bản nháp cũ không hợp lệ. Dữ liệu trên máy chủ vẫn được giữ.')}
    if(local&&stableStringify(local)!==stableStringify(remote)){
     if(draft.revision===s.revision){attach(local,s.revision,true,remote)}
     else {attach(remote,s.revision);setRecovery({local,remote,revision:s.revision});persist(local,draft.revision,true);engine.current.blocked=true;setConflict(true)}
    } else attach(remote,s.revision);
    setReady(true);
   }catch(e:any){
    if(cancelled)return;
    // Never bypass a rejected session; offline recovery only follows a network/server failure.
    if(![401,403].includes(e.status)&&draft?.state){try{const cached=JSON.parse(localStorage.getItem(`pmp-bank:${userId}`)||'null');if(!Array.isArray(cached))throw Error();bankRef.current=cached;setBank(cached);const state=normalizeState(draft.state,cached);attach(state,draft.revision,true,emptyState());engine.current.uncertain=true;setSync('Đang ngoại tuyến · bản nháp đã sẵn sàng');setReady(true);return}catch{}}
    setError(e.message||'Không tải được dữ liệu.');
   }
  }
  load();return()=>{cancelled=true;alive.current=false;engine.current?.dispose()};
 },[userId]);
 const setData=useCallback((change:any)=>{const next=typeof change==='function'?change(current.current):change;current.current=next;render(next);engine.current?.change(next)},[]);
 useEffect(()=>{
  const unload=(e:BeforeUnloadEvent)=>{if(engine.current?.dirty||conflict){e.preventDefault();e.returnValue=''}};
  const online=()=>engine.current?.flush();
  const hidden=()=>{if(document.visibilityState==='hidden')engine.current?.flush()};
  window.addEventListener('beforeunload',unload);window.addEventListener('online',online);document.addEventListener('visibilitychange',hidden);
  return()=>{window.removeEventListener('beforeunload',unload);window.removeEventListener('online',online);document.removeEventListener('visibilitychange',hidden)};
 },[conflict]);
 const resolveConflict=async(useLocal:boolean)=>{
  try{const remote=await read();const local=recovery?.local||current.current;setRecovery(null);setConflict(false);setConflictReason('');attach(useLocal?local:remote.state,remote.revision,useLocal,remote.state)}catch(e:any){setStorageError(e.message)}
 };
 return {data,setData,bank,ready,error,sync,conflict,recovery,storageError,conflictReason,resolveConflict,retry:()=>engine.current?.flush(),flush:()=>engine.current?.flush()};
}
