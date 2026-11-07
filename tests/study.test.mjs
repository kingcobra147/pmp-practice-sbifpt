import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyState,normalizeState,completeRun,review,DAY,matches,topicOf,dayKey} from '../shared/study.mjs';
const bank=JSON.parse(readFileSync(new URL('../data/questions.json',import.meta.url))),q=bank[0],multi=bank.find(q=>q.status==='ready'&&q.correct.length>1);
const time=Date.parse('2026-11-07T10:00:00Z');
const run=(answers={},mode='practice')=>({ids:[q.id],answers,mode,index:0,flags:[],revealed:[],started:time,endAt:mode==='exam'?time+60000:null});
test('rejects malformed imports before they can break the dashboard',()=>{
 for(const bad of [null,[],{}, {...emptyState(),attempts:[{ids:null}]},{...emptyState(),bookmarks:[42]},{...emptyState(),run:{...run(),ids:[]}},{...emptyState(),learning:{'__unknown':{}}},{...emptyState(),run:{...run(),answers:{[q.id]:['Z']}}},{...emptyState(),run:{...run(),started:Infinity}},{...emptyState(),settings:{dailyGoal:501}}])assert.throws(()=>normalizeState(bad,bank));
});
test('legacy exports migrate history and recompute scores, without guessing missing older history',()=>{
 const legacy={bookmarks:[q.id],wrong:[],run:null,attempts:[{id:'old',date:new Date(time).toISOString(),ids:[q.id],answers:{[q.id]:q.correct},score:0,mode:'practice',seconds:20}]};
 const migrated=normalizeState(legacy,bank);assert.equal(migrated.learning[q.id].firstCorrect,true);assert.equal(migrated.attempts[0].score,1);assert.equal(migrated.activity[dayKey(time)].answered,1);assert.deepEqual(normalizeState(migrated,bank),migrated);
});
test('multiple-choice scoring requires the exact set, but extra choices remain valid input',()=>{
 const state=emptyState();state.run={...run(),ids:[multi.id],answers:{[multi.id]:multi.options.map(o=>o.key)}};
 assert.doesNotThrow(()=>normalizeState(state,bank));const {attempt}=completeRun(state,bank,time+1000,'multi');assert.equal(attempt.score,0);
 state.run.answers[multi.id]=[...multi.correct].reverse();assert.equal(completeRun(state,bank,time+1000,'multi-correct').attempt.score,1);
});
test('expired exams stop at deadline, retain answers, and count once',()=>{
 const state=emptyState();state.run=run({[q.id]:q.correct},'exam');const finished=completeRun(state,bank,time+10*DAY,'deadline');assert.equal(finished.attempt.seconds,60);assert.equal(finished.attempt.date,new Date(time+60000).toISOString());assert.equal(finished.attempt.score,1);assert.equal(completeRun(finished.state,bank,time+20*DAY).attempt,null);
});
test('review intervals use correctness and confidence, keep notes and cap intervals',()=>{
 const low=review({note:'Keep me',confidence:1},true,time);assert.equal(low.interval,1);assert.equal(low.note,'Keep me');
 const medium=review({confidence:2,interval:14},true,time);assert.equal(medium.interval,14);
 const high=review({confidence:3,interval:80},true,time);assert.equal(high.interval,90);
 const failed=review(high,false,time+DAY);assert.equal(failed.interval,1);assert.equal(failed.firstCorrect,true);assert.equal(failed.wrongCount,1);assert.equal(failed.dueAt,time+2*DAY);
});
test('progress survives the 100-attempt retention limit; skipped questions remain wrong',()=>{
 let state=emptyState();for(let i=0;i<105;i++){state.run=run(i%2?{[q.id]:q.correct}:{});state=completeRun(state,bank,time+i*1000,'run-'+i).state}
 assert.equal(state.attempts.length,100);assert.equal(state.learning[q.id].reviews,105);assert.equal(state.learning[q.id].wrongCount,53);assert.equal(state.activity[dayKey(time)].answered,52);assert.ok(state.wrong.includes(q.id));assert.deepEqual(normalizeState(state,bank),state);
});
test('filters and topic override reflect personal progress',()=>{
 const state=emptyState();assert.ok(matches(q,state,'unseen'));state.learning[q.id]={...review({confidence:1},false,time),wrongCount:2,topic:'Chi phí'};state.bookmarks=[q.id];state.wrong=[q.id];
 for(const filter of ['frequent','saved','wrong','uncertain'])assert.ok(matches(q,state,filter,time));assert.ok(!matches(q,state,'unseen'));assert.ok(!matches(q,state,'due',time));assert.ok(matches(q,state,'due',time+DAY));assert.equal(topicOf(q,state.learning),'Chi phí');assert.equal(dayKey(Date.parse('2026-11-07T18:00:00Z')),'2026-11-08');
});
