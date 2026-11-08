import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TIP_RULES,TIP_CATEGORIES,relatedTips,filterTips} from '../shared/tips.mjs';
const {tips,sources}=JSON.parse(readFileSync(new URL('../data/tips.json',import.meta.url)));
const ids=prompt=>relatedTips({prompt},tips).map(r=>r.tip.id);
test('all 44 bilingual tips have valid categories, links and distinct matching rules',()=>{
 assert.equal(tips.length,44);assert.equal(new Set(tips.map(t=>t.id)).size,tips.length);assert.deepEqual([...TIP_RULES.map(r=>r.id)].sort(),tips.map(t=>t.id).sort());
 for(const t of tips){assert.ok(t.en&&t.vi&&t.cues.length);assert.ok(TIP_CATEGORIES.some(([id])=>id===t.category));assert.equal(Boolean(t.cautionEn),Boolean(t.cautionVi));for(const id of t.sourceIds){assert.ok(sources[id]);assert.equal(new URL(sources[id].url).protocol,'https:')}}
});
test('insurance and an opportunity partner are distinct risk-response clues',()=>{
 assert.ok(ids('The PM buys insurance to cover financial losses. Which risk response is being used?').includes('transfer'));
 const partner=ids('The team forms a partnership with another organization to capture a new opportunity. Which strategy is this?');assert.ok(partner.includes('share'));assert.ok(!partner.includes('transfer'));
});
test('guaranteeing an opportunity differs from increasing its likelihood',()=>{
 assert.ok(ids('The team takes steps to ensure an opportunity happens. Which response is this?').includes('exploit'));
 const enhanced=ids('An opportunity is identified. The PM acts to increase its probability. Which response is being used?');assert.ok(enhanced.includes('enhance'));assert.ok(!enhanced.includes('exploit'));assert.ok(!enhanced.includes('mitigate'));
});
test('the first/next and negative-reading tips inspect the actual question, not the story',()=>{
 assert.ok(ids('A problem has appeared. What should the project manager do FIRST?').includes('first-next'));
 assert.ok(!ids('The first phase is complete. What is the project budget?').includes('first-next'));
 assert.ok(ids('The charter is available. Which of the following is NOT appropriate?').includes('negative-question'));
 assert.ok(!ids('The vendor has not delivered. What is the problem?').includes('negative-question'));
});
test('Scrum tips require Scrum or Agile context; predictive change does not match any new requirement',()=>{
 assert.ok(ids('During Scrum planning, who should estimate the work?').includes('scrum-estimate'));
 assert.ok(!ids('The predictive team needs an estimate. Who should estimate the work?').includes('scrum-estimate'));
 assert.ok(ids('A predictive project has a baseline. A customer requests an additional feature. What should the PM do next?').includes('predictive-change'));
 assert.ok(!ids('An Agile team receives a new requirement. What should the Product Owner do?').includes('predictive-change'));
});
test('quality tool clues match the actual use and do not confuse a checklist with a check sheet',()=>{
 assert.ok(ids('Which chart shows the correlation between two variables?').includes('scatter'));
 assert.ok(ids('The PM wants to prioritize the vital few defect types. Which tool helps?').includes('pareto'));
 assert.ok(ids('An engineer groups possible causes into categories. Which tool can be used?').includes('fishbone'));
 assert.ok(!ids('What tool helps find a root cause?').includes('fishbone'));
 assert.ok(ids('The team uses tally marks to record defects. What tool is being used?').includes('check-sheet'));
 assert.ok(!ids('The team uses a checklist before delivery. What should the PM do?').includes('check-sheet'));
});
test('control limits, resource constraints and work packages yield the corresponding tools',()=>{
 assert.ok(ids('A measurement lies beyond the control limits. Which chart is being examined?').includes('control-chart'));
 assert.ok(ids('A specialist is overallocated across activities. Which technique can resolve this?').includes('leveling'));
 assert.ok(ids('The PM balances resource workload within available float. Which technique is used?').includes('smoothing'));
 assert.ok(ids('The project scope is divided into work packages. What artifact is this?').includes('wbs'));
});
test('matching never reads answers, options or explanations, and returns only visible evidence',()=>{
 const question={prompt:'The team buys insurance against financial loss. Which strategy is being used?'};
 for(const property of ['correct','options','explanation'])Object.defineProperty(question,property,{get(){throw Error('Answer leakage: '+property)}});
 const results=relatedTips(question,tips);assert.ok(results.some(r=>r.tip.id==='transfer'));
 for(const r of results)for(const clue of r.clues)assert.ok(question.prompt.toLowerCase().includes(clue.toLowerCase()));
 assert.deepEqual(ids('What is the sum of two and two?'),[]);
 assert.deepEqual(relatedTips(null,tips),[]);
});
test('a word appearing only in a distractor or explanation does not select a tip',()=>{
 const matches=relatedTips({prompt:'How many communication channels exist among six participants?',options:[{key:'A',text:'Insurance Pareto Scrum'}],explanation:'CPI and a work package',correct:['A']},tips);
 assert.deepEqual(matches,[]);
});
test('library search supports English, accent-free Vietnamese and category filtering',()=>{
 assert.ok(filterTips(tips,{search:'insurance'}).some(t=>t.id==='transfer'));
 assert.ok(filterTips(tips,{search:'duong gang'}).some(t=>t.id==='critical-path'));
 assert.ok(filterTips(tips,{search:'ĐƯỜNG GĂNG'}).some(t=>t.id==='critical-path'));
 assert.ok(filterTips(tips,{search:'CPI EV AC'}).some(t=>t.id==='cpi'));
 assert.ok(filterTips(tips,{category:'agile'}).every(t=>t.category==='agile'));
 assert.equal(filterTips(tips,{search:'xyz-not-a-real-tip'}).length,0);
});

test('incidental insurance in a charter documentation question does not suggest the transfer answer',()=>{
 const result=ids('Nighttime work needs overtime pay and insurance coverage. Where should the project manager document this request in the project charter?');
 assert.ok(!result.includes('transfer'));assert.ok(!result.includes('crashing'));
});
