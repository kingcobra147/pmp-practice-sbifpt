// Shared by the browser and API: imports and cloud saves follow the same rules.
export const MAX_STATE_BYTES = 4_000_000;
export const DAY = 86_400_000;
export const TOPICS = ['Nhóm & lãnh đạo','Các bên liên quan','Phạm vi & yêu cầu','Tiến độ','Chi phí','Chất lượng','Rủi ro','Mua sắm','Agile & hybrid','Tích hợp & thay đổi','Chưa phân loại'];
const rules = [
 [/\b(scrum|sprint|agile|kanban|product owner|backlog|iteration|hybrid)\b/gi, 'Agile & hybrid'],
 [/\b(risk|risks|uncertainty|contingency|threat|opportunity)\b/gi, 'Rủi ro'],
 [/\b(procurement|contract|vendor|seller|supplier|bid)\b/gi, 'Mua sắm'],
 [/\b(cost|budget|earned value|cpi|bac|eac|funding)\b/gi, 'Chi phí'],
 [/\b(schedule|critical path|float|duration|milestone|spi)\b/gi, 'Tiến độ'],
 [/\b(quality|defect|inspection|testing|audit)\b/gi, 'Chất lượng'],
 [/\b(scope|requirement|requirements|wbs|deliverable)\b/gi, 'Phạm vi & yêu cầu'],
 [/\b(stakeholder|stakeholders|communication|communications|engagement)\b/gi, 'Các bên liên quan'],
 [/\b(team|conflict|leadership|motivation|coaching|resource)\b/gi, 'Nhóm & lãnh đạo'],
 [/\b(change|integration|charter|business case|governance|lessons learned)\b/gi, 'Tích hợp & thay đổi']
];
const inferredTopics = new WeakMap();
export function topicOf(q, learning = {}) {
 if (learning[q.id]?.topic) return learning[q.id].topic;
 if(inferredTopics.has(q))return inferredTopics.get(q);
 const text = q.prompt + ' ' + (q.explanation || '');
 const ranked = rules.map(([re, topic]) => [topic, (text.match(re) || []).length]).sort((a,b)=>b[1]-a[1]);
 const topic=ranked[0][1] ? ranked[0][0] : 'Chưa phân loại';inferredTopics.set(q,topic);return topic;
}
export function stableStringify(value) {
 return JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
}
export const same = (a = [], b = []) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
export const dayKey = (time = Date.now()) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time));
export const emptyState = () => ({version:3,bookmarks:[],wrong:[],attempts:[],run:null,learning:{},activity:{},settings:{dailyGoal:20}});
export function review(previous = {}, correct, time, confidence = previous.confidence || 0) {
 const interval = !correct || confidence <= 1 ? 1 : confidence === 2 ? Math.min(14, Math.max(2, Math.round((previous.interval || 1)*1.5))) : Math.min(90, Math.max(3,(previous.interval || 1)*2));
 return {...previous,reviews:(previous.reviews || 0)+1,wrongCount:(previous.wrongCount || 0)+(correct?0:1),correctCount:(previous.correctCount || 0)+(correct?1:0),firstCorrect:previous.firstCorrect ?? correct,firstAt:previous.firstAt ?? time,lastAt:time,interval,dueAt:time+interval*DAY,confidence};
}
export function completeRun(state, bank, time = Date.now(), id = crypto.randomUUID()) {
 const run=state.run;if(!run)return {state,attempt:null};
 const map=new Map(bank.map(q=>[q.id,q]));
 const ended=run.endAt ? Math.min(time,run.endAt) : time;
 const attempt={id,date:new Date(ended).toISOString(),ids:run.ids,answers:run.answers,score:run.ids.filter(id=>same(run.answers[id],map.get(id).correct)).length,mode:run.mode,seconds:Math.max(0,Math.floor((ended-run.started)/1000))};
 const learning={...state.learning};
 for(const id of run.ids) learning[id]=review(learning[id],same(run.answers[id],map.get(id).correct),ended);
 const day=dayKey(ended), activity={...state.activity}, old=activity[day] || {answered:0,correct:0,seconds:0};
 activity[day]={answered:old.answered+run.ids.filter(id=>run.answers[id]?.length).length,correct:old.correct+attempt.score,seconds:old.seconds+attempt.seconds};
 const trimmed=Object.fromEntries(Object.entries(activity).sort(([a],[b])=>b.localeCompare(a)).slice(0,730));
 return {attempt,state:{...state,learning,activity:trimmed,attempts:[attempt,...state.attempts].slice(0,100),wrong:[...new Set([...state.wrong.filter(id=>!run.ids.includes(id)),...run.ids.filter(id=>!same(run.answers[id],map.get(id).correct))])],run:null}};
}
export function matches(q, state, filter, time = Date.now()) {
 const item=state.learning[q.id];
 switch(filter){
 case 'unseen':return !item?.reviews;
 case 'frequent':return (item?.wrongCount || 0)>=2;
 case 'wrong':return state.wrong.includes(q.id);
 case 'saved':return state.bookmarks.includes(q.id);
 case 'due':return !!item?.dueAt && item.dueAt<=time;
 case 'uncertain':return item?.confidence===1 || item?.confidence===2;
 default:return true;
 }
}
export function normalizeState(input, bank) {
 const fail = message => {throw Object.assign(new Error('Tiến độ không hợp lệ: '+message),{status:400})};
 const object = x => x!==null && typeof x==='object' && !Array.isArray(x) && Object.getPrototypeOf(x)===Object.prototype;
 if(!object(input)) fail('cần một đối tượng JSON.');
 if(input.version!==undefined&&![1,2,3].includes(input.version))fail('phiên bản file chưa được hỗ trợ.');
 const map=new Map(bank.map(q=>[q.id,q]));
 const int=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const ids=(value,allowed=map,min=0)=>{if(!Array.isArray(value)||value.length<min||value.length>map.size||value.some(id=>typeof id!=='string'||!allowed.has(id))||new Set(value).size!==value.length)fail('danh sách mã câu hỏi.');return [...value]};
 const answers=(value,allowed)=>{if(!object(value))fail('câu trả lời.');const result={};for(const [id,a] of Object.entries(value)){if(!allowed.has(id)||!Array.isArray(a)||a.some(k=>typeof k!=='string'||!map.get(id).options.some(o=>o.key===k))||new Set(a).size!==a.length)fail('lựa chọn câu '+id);result[id]=[...a]}return result};
 const validMode=m=>m==='practice'||m==='exam';
 const state=emptyState();
 state.bookmarks=ids(input.bookmarks);state.wrong=ids(input.wrong);
 if(!Array.isArray(input.attempts)||input.attempts.length>100)fail('lịch sử tối đa 100 lượt.');
 const attemptIds=new Set();
 state.attempts=input.attempts.map(a=>{
  if(!object(a)||typeof a.id!=='string'||!a.id.length||a.id.length>100||attemptIds.has(a.id)||typeof a.date!=='string'||!int(Date.parse(a.date),1,4_102_444_800_000)||!validMode(a.mode)||!int(a.seconds,0,315360000))fail('thông tin lượt làm bài.');
  attemptIds.add(a.id);const list=ids(a.ids,map,1),ans=answers(a.answers,new Set(list));
  return {id:a.id,date:new Date(a.date).toISOString(),ids:list,answers:ans,score:list.filter(id=>same(ans[id],map.get(id).correct)).length,mode:a.mode,seconds:a.seconds};
 });
 if(input.run!=null){const r=input.run;if(!object(r)||!validMode(r.mode)||!int(r.started,1,4_102_444_800_000))fail('phiên đang làm.');const list=ids(r.ids,new Map(bank.filter(q=>q.status==='ready').map(q=>[q.id,q])),1),allowed=new Set(list);
  if(!int(r.index,0,list.length-1)||!(r.endAt===null||(int(r.endAt,r.started+1,4_102_444_800_000)&&r.mode==='exam'))||(r.mode==='exam'&&r.endAt===null))fail('vị trí hoặc thời gian phiên.');
  state.run={ids:list,answers:answers(r.answers,allowed),flags:ids(r.flags,allowed),index:r.index,mode:r.mode,endAt:r.endAt,revealed:ids(r.revealed,allowed),started:r.started};
  if(r.mode==='exam'&&r.revealed.length)fail('bài thi không được mở đáp án.');
 }
 if(input.settings!==undefined){if(!object(input.settings)||!int(input.settings.dailyGoal,1,500))fail('mục tiêu mỗi ngày (1–500).');state.settings={dailyGoal:input.settings.dailyGoal}}
 if(input.learning!==undefined){
  if(!object(input.learning))fail('thống kê câu hỏi.');
  for(const [id,v] of Object.entries(input.learning)){
   if(!map.has(id)||!object(v))fail('thống kê câu '+id);
   const item={};
   if(v.note!==undefined){if(typeof v.note!=='string'||v.note.length>2000)fail('ghi chú tối đa 2.000 ký tự.');item.note=v.note}
   if(v.topic!==undefined){if(!TOPICS.includes(v.topic))fail('chủ đề.');item.topic=v.topic}
   if(v.confidence!==undefined){if(!int(v.confidence,0,3))fail('mức tự tin.');item.confidence=v.confidence}
   if(v.reviews!==undefined){
    for(const key of ['reviews','wrongCount','correctCount'])if(!int(v[key],0,1000000))fail('số lượt ôn.');
    if(v.reviews<1||v.correctCount+v.wrongCount!==v.reviews||typeof v.firstCorrect!=='boolean'||!int(v.firstAt,1,4_102_444_800_000)||!int(v.lastAt,v.firstAt,4_102_444_800_000)||!int(v.dueAt,v.lastAt,4_102_444_800_000)||!int(v.interval,1,90))fail('lịch ôn.');
    for(const key of ['reviews','wrongCount','correctCount','firstCorrect','firstAt','lastAt','dueAt','interval'])item[key]=v[key];
   }
   state.learning[id]=item;
  }
 } else {
  // Legacy exports have no per-question statistics. Rebuild what the retained history can establish.
  for(const a of [...state.attempts].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)))for(const id of a.ids)state.learning[id]=review(state.learning[id],same(a.answers[id],map.get(id).correct),Date.parse(a.date));
 }
 if(input.activity!==undefined){
  if(!object(input.activity)||Object.keys(input.activity).length>730)fail('hoạt động hằng ngày.');
  for(const [day,v] of Object.entries(input.activity)){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day||!object(v)||!int(v.answered,0,1000000)||!int(v.correct,0,v.answered)||!int(v.seconds,0,315360000))fail('hoạt động ngày '+day);state.activity[day]={answered:v.answered,correct:v.correct,seconds:v.seconds}}
 } else for(const a of state.attempts){const key=dayKey(Date.parse(a.date)),old=state.activity[key]||{answered:0,correct:0,seconds:0};state.activity[key]={answered:old.answered+Object.values(a.answers).filter(a=>a.length).length,correct:old.correct+a.score,seconds:old.seconds+a.seconds}}
 return state;
}
