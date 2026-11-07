import {stableStringify} from '../shared/study.mjs';
// One request at a time. Failed requests are reconciled before retrying: a server
// may have committed a PUT even when its response never reached the browser.
export class StudySync {
 constructor({state,revision,read,write,onStatus,onSaved,onConflict,persist,delay=450,retryDelay=5000}) {
  Object.assign(this,{state,revision,read,write,onStatus,onSaved,onConflict,persist,delay,retryDelay});
  this.ack=stableStringify(state);this.blocked=false;this.disposed=false;this.inflight=null;this.timer=null;this.uncertain=false;
 }
 get dirty(){return stableStringify(this.state)!==this.ack}
 change(state){this.state=state;this.persist(state,this.revision,this.dirty);this.onStatus(this.dirty?'Đã lưu bản nháp trên máy · chờ đồng bộ':'Đã đồng bộ');clearTimeout(this.timer);if(this.dirty&&!this.blocked)this.timer=setTimeout(()=>this.flush(),this.delay)}
 async flush(){
  clearTimeout(this.timer);if(this.disposed||this.blocked)return false;
  if(this.inflight){await this.inflight;return this.dirty&&!this.blocked?this.flush():!this.dirty}
  if(!this.dirty)return true;
  this.inflight=this.send();await this.inflight;this.inflight=null;
  if(this.dirty&&!this.blocked&&!this.disposed){clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),this.retryDelay)}
  return !this.dirty;
 }
 async send(){
  this.onStatus('Đang lưu…');
  try {
   if(this.uncertain){
    const remote=await this.read();
    const value=stableStringify(remote.state);
    if(remote.revision===this.revision+1 && value===this.sent){this.revision=remote.revision;this.ack=value}
    else if(remote.revision!==this.revision){this.block(remote);return}
    this.uncertain=false;
    if(!this.dirty){this.persist(this.state,this.revision,false);this.onSaved();this.onStatus('Đã đồng bộ');return}
   }
   const payload=stableStringify(this.state);this.sent=payload;
   const result=await this.write(JSON.parse(payload),this.revision);
   this.revision=result.revision;this.ack=payload;
   this.persist(this.state,this.revision,this.dirty);this.onSaved();this.onStatus(this.dirty?'Đã lưu bản nháp trên máy · chờ đồng bộ':'Đã đồng bộ');
  } catch(e){
   if([401,403,409,400,413].includes(e.status)){this.block(null,e);return}
   this.uncertain=true;this.onStatus('Chưa đồng bộ · sẽ tự thử lại khi có mạng');
  }
 }
 block(remote,error){this.blocked=true;this.onStatus('Cần xử lý trước khi đồng bộ');this.onConflict(remote,error)}
 dispose(){this.disposed=true;clearTimeout(this.timer)}
}
