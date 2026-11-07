import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
type User={id:string;email:string;name:string};
function Root(){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[register,setRegister]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 function remember(person:User|null){try{if(person)sessionStorage.setItem('pmp-last-user',JSON.stringify({user:person,at:Date.now()}));else sessionStorage.removeItem('pmp-last-user')}catch{}}
 useEffect(()=>{
  fetch('/api/auth/me').then(async r=>{const body=await r.json();if(r.status===401){remember(null);setUser(null);return}if(!r.ok)throw Error(body.error||'Không kết nối được server.');remember(body.user);setUser(body.user||null)}).catch(()=>{
   try{const cached=JSON.parse(sessionStorage.getItem('pmp-last-user')||'null');if(cached?.user&&typeof cached.user.id==='string'&&typeof cached.user.email==='string'&&typeof cached.user.name==='string'&&Date.now()-cached.at<30*86400000){setUser(cached.user);return}}catch{}
   setError('Không kết nối được server. Hãy kiểm tra mạng và thử lại.');
  }).finally(()=>setLoading(false));
 },[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError('');setBusy(true);const input=Object.fromEntries(new FormData(e.currentTarget));try{const response=await fetch(register?'/api/auth/register':'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const result=await response.json();if(!response.ok)throw Error(result.error);remember(result.user);setUser(result.user)}catch(e){setError(e instanceof Error?e.message:'Không đăng nhập được')}finally{setBusy(false)}}
 async function logout(){try{const r=await fetch('/api/auth/logout',{method:'POST'});if(!r.ok)throw Error();remember(null);setRegister(false);setUser(null)}catch{alert('Không đăng xuất được. Kiểm tra kết nối và thử lại.')}}
 if(loading)return <div className="authpage"><div className="spinner"/><p>Đang kiểm tra tài khoản…</p></div>;
 if(user)return <App key={user.id} user={user} onLogout={logout}/>;
 return <div className="authpage"><div className="authintro"><div className="eyebrow">PMP PRACTICE LAB</div><h1>Mỗi ngày một bước tiến.</h1><p>1.127 câu hỏi. Một không gian học tập của riêng bạn.</p><p>Đăng nhập để lưu bài đang làm, lịch sử và câu cần ôn lại trên các thiết bị.</p></div><form className="card authcard" onSubmit={submit}><div className="eyebrow">KHÔNG GIAN CÁ NHÂN</div><h2>{register?'Tạo tài khoản học tập':'Chào mừng bạn trở lại'}</h2><div className="authtabs"><button type="button" className={!register?'primary':'secondary'} onClick={()=>{setRegister(false);setError('')}}>Đăng nhập</button><button type="button" className={register?'primary':'secondary'} onClick={()=>{setRegister(true);setError('')}}>Đăng ký</button></div>{register&&<label>Họ tên<input name="name" autoComplete="name" required minLength={2} maxLength={80}/></label>}<label>Email<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Mật khẩu<input name="password" type="password" autoComplete={register?'new-password':'current-password'} required minLength={register?12:1} maxLength={256}/></label>{register&&<label>Mã tham gia<input name="inviteCode" type="password" required maxLength={128} autoComplete="off"/><small>Nhận mã từ người quản trị lớp học.</small></label>}{error&&<p role="alert" className="autherror">{error}</p>}<button disabled={busy} className="primary wide">{busy?'Đang xử lý…':register?'Tạo tài khoản':'Đăng nhập'}</button><p className="muted tiny">{register?'Email dùng làm tên đăng nhập; ứng dụng chưa xác minh email.':'Quên mật khẩu? Liên hệ người quản trị để đặt lại.'}</p></form></div>
}
createRoot(document.getElementById('root')!).render(<Root/>);
