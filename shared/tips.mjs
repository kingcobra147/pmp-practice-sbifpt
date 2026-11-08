// Relevance is based ONLY on the visible question stem. Never inspect the
// answer choices, correct keys or explanation to select a tip.
export const TIP_CATEGORIES = [
 ['mindset','Đọc đề & tư duy / Reading'],['change','Thay đổi / Change'],
 ['people','Con người / People'],['risk','Rủi ro / Risk'],['agile','Agile & Scrum'],
 ['quality','Chất lượng / Quality'],['tools','Công cụ / Tools'],
 ['schedule','Tiến độ & nguồn lực / Schedule'],['cost','Chi phí / Cost'],['documents','Tài liệu / Documents']
];
const agile=/\b(agile|scrum|sprints?|iterations?|product owner|product backlog)\b/i;
const opportunity=/\b(opportunit(?:y|ies)|positive risk|upside|benefit)\b/i;
const threat=/\b(threat|negative risk|adverse|loss|damage|downside|risk)\b/i;
// Each entry defines contextual requirements plus concrete clues to display.
export const TIP_RULES = [
 {id:'first-next',ask:true,patterns:[/\b(?:first|next|initial)\b/i],priority:0},
 {id:'negative-question',ask:true,patterns:[/\b(?:not|except|least)\b/i],priority:3},
 {id:'two-plausible',ask:true,patterns:[/\b(?:best|most appropriate|most suitable|should)\b/i],priority:-1},
 {id:'predictive-change',all:[/\b(predictive|waterfall|baseline|change control|change request)\b/i],patterns:[/\b(?:scope change|change request|additional (?:feature|requirement)|new (?:feature|requirement)|change.{0,35}scope)\b/i]},
 {id:'conflict-collaborate',patterns:[/\b(?:conflicts?|disagreement|dispute|win.win)\b/i]},
 {id:'clarify-roles',patterns:[/\b(?:misunderstanding|unclear (?:roles|responsibilities)|conflicting (?:expectations|directions)|confused about (?:roles|priorities))\b/i]},
 {id:'escalate',patterns:[/\b(?:beyond.{0,35}authority|exceeds? (?:their|his|her|the pm's) authority|outside.{0,25}authority|cannot resolve.{0,30}(?:level|authority)|lack.{0,20}authority)\b/i]},
 {id:'risk-future',all:[threat],patterns:[/\b(?:might|may|could)\s+(?:happen|occur|cause|result|affect|delay)\b/i,/\b(?:uncertain (?:future )?event|potential (?:threat|risk)|risk identification)\b/i]},
 {id:'issue-now',patterns:[/\b(?:has (?:already )?(?:occurred|happened)|already (?:occurred|happened)|current (?:problem|issue)|is currently experiencing)\b/i]},
 {id:'backlog-owner',all:[agile],patterns:[/\b(?:prioriti[sz](?:e|es|ing|ation)|order(?:ing)?|business value)\b/i]},
 {id:'scrum-estimate',all:[agile],patterns:[/\b(?:estimat(?:e|es|ing|ion)|siz(?:e|ing)|story points)\b/i]},
 {id:'scrum-selfmanage',all:[agile],patterns:[/\b(?:assign(?:s|ing)? (?:the )?(?:tasks|work)|work distribution|how.{0,25}work.{0,20}(?:done|perform)|self.manag|self.organiz|allocate.{0,20}tasks)\b/i]},
 {id:'sprint-change',all:[/\bsprint\b/i],patterns:[/\b(?:new (?:requirement|feature)|chang(?:e|es|ing).{0,30}(?:scope|requirement)|during (?:the |a )?sprint|mid.sprint)\b/i]},
 {id:'sprint-cancel',all:[/\bsprint\b/i],patterns:[/\b(?:obsolete|no longer (?:relevant|valuable)|cancel(?:led|ing|lation)?)\b/i]},
 {id:'sprint-review',all:[agile],patterns:[/\b(?:sprint review|product feedback|inspect.{0,20}(?:outcome|increment)|stakeholder feedback|demonstrat(?:e|ion).{0,25}(?:product|increment))\b/i]},
 {id:'sprint-retro',all:[agile],patterns:[/\b(?:retrospective|ways of working|improve.{0,25}(?:teamwork|process|collaboration|effectiveness))\b/i]},
 {id:'definition-done',all:[agile],patterns:[/\b(?:definition of done|unfinished (?:item|work)|not (?:yet )?(?:done|completed)|incomplete.{0,20}(?:story|item))\b/i]},
 {id:'sprint-capacity',all:[agile],patterns:[/\b(?:capacity|past performance|sprint forecast|how much work|velocity)\b/i]},
 {id:'control-quality',patterns:[/\b(?:control quality|quality requirements|quality inspection|inspect.{0,30}(?:deliverable|product)|test.{0,30}specifications|verif(?:y|ied).{0,30}deliverable)\b/i]},
 {id:'validate-scope',patterns:[/\b(?:formal (?:customer )?acceptance|customer sign.off|accepted deliverables|validate scope|acceptance of (?:the )?deliverables)\b/i]},
 {id:'crashing',all:[/\b(schedule|duration|deadline|finish|completion|time)\b/i],patterns:[/\b(?:crashing|overtime|add(?:ing|itional)? (?:more )?(?:resources|staff|personnel)|increase.{0,15}resources)\b/i]},
 {id:'fast-tracking',all:[/\b(schedule|duration|activities|tasks|deadline)\b/i],patterns:[/\b(?:fast.track(?:ing)?|overlap(?:ping)?|parallel|normally sequential)\b/i]},
 {id:'critical-path',patterns:[/\b(?:critical path|finish earlier|earlier (?:project )?completion|shorten.{0,25}(?:project|schedule)|reduce.{0,20}project duration)\b/i]},
 {id:'cpi',patterns:[/\b(?:cpi|cost performance index|cost performance|ev\s*\/\s*ac)\b/i]},
 {id:'spi',patterns:[/\b(?:spi|schedule performance index|schedule performance|ev\s*\/\s*pv)\b/i]},
 {id:'transfer',patterns:[/\b(?:insurance|transfer.{0,20}liability|third party.{0,30}(?:loss|liability)|warrant(?:y|ies))\b/i]},
 {id:'avoid',all:[threat],patterns:[/\b(?:eliminat(?:e|es|ing).{0,25}(?:threat|risk)|remove.{0,20}exposure|avoid.{0,15}(?:threat|risk))\b/i]},
 {id:'mitigate',all:[threat],patterns:[/\b(?:reduc(?:e|es|ing).{0,35}(?:probability|likelihood|negative impact)|mitigat(?:e|ion))\b/i]},
 {id:'exploit',all:[opportunity],patterns:[/\b(?:ensur(?:e|es|ing)|certain|guarantee|exploit)\b/i]},
 {id:'enhance',all:[opportunity],patterns:[/\b(?:increas(?:e|es|ing).{0,35}(?:probability|likelihood|positive impact|benefit)|enhanc(?:e|ement))\b/i]},
 {id:'share',all:[opportunity],patterns:[/\b(?:partner(?:ship)?|joint venture|share.{0,20}(?:opportunity|benefit)|third party)\b/i]},
 {id:'accept',all:[threat],patterns:[/\b(?:accept.{0,20}risk|no preventive action|without.{0,20}preventive|contingency reserve)\b/i]},
 {id:'pareto',patterns:[/\b(?:80\s*\/\s*20|80\s*[-–]\s*20|vital few|pareto|major defect categories|few.{0,25}(?:most|majority).{0,20}(?:problems|defects))\b/i]},
 {id:'fishbone',patterns:[/\b(?:fishbone|ishikawa|cause.and.effect|categories of causes|group.{0,25}(?:possible )?causes|causes.{0,25}categories)\b/i]},
 {id:'scatter',patterns:[/\b(?:correlation|scatter diagram|relationship between.{0,30}(?:variables|x and y)|two variables)\b/i]},
 {id:'control-chart',patterns:[/\b(?:control limits|control chart|process stability|out.of.control|statistically stable)\b/i]},
 {id:'histogram',patterns:[/\b(?:histogram|frequency distribution|distribution of (?:measurements|data|values))\b/i]},
 {id:'check-sheet',patterns:[/\b(?:check sheet|tally marks|tally.{0,20}(?:defects|occurrences)|count.{0,25}defect occurrences)\b/i]},
 {id:'flowchart',patterns:[/\b(?:flowchart|flow chart|sequence of (?:process )?steps|decision points|process flow)\b/i]},
 {id:'leveling',patterns:[/\b(?:overallocat(?:ed|ion)|resource (?:availability|leveling|levelling)|limited resources|resource constraints)\b/i]},
 {id:'smoothing',all:[/\b(resources?|workload|smoothing)\b/i],patterns:[/\b(?:available float|without delaying.{0,25}completion|resource smoothing|within.{0,10}float)\b/i]},
 {id:'raci',patterns:[/\b(?:raci|responsibility assignment matrix|responsible.{0,20}accountable|consulted.{0,15}informed)\b/i]},
 {id:'rtm',patterns:[/\b(?:traceability|trace.{0,25}requirements?|requirements?.{0,25}origin|link.{0,25}requirements?.{0,25}deliverables?)\b/i]},
 {id:'wbs',patterns:[/\b(?:wbs|work breakdown structure|work packages?|hierarchical decomposition|decompos.{0,25}(?:scope|work))\b/i]}
];
const cache=new WeakMap();
export function relatedTips(question,tips){
 if(!question||typeof question.prompt!=='string')return [];
 const cached=cache.get(question);if(cached?.tips===tips)return cached.result;
 const stem=question.prompt.replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
 const ask=(stem.match(/[^.!?]+\?/g)||[]).at(-1)||stem.split(/(?<=[.!?])\s+/).at(-1)||stem;
 const result=TIP_RULES.flatMap(rule=>{
  const text=rule.ask?ask:stem;
  if(rule.all?.some(re=>!re.test(stem)))return [];
  // A keyword in the story can be incidental. For example, insurance in a
  // charter-documentation question does not make risk transfer the topic.
  if(['transfer','avoid','mitigate','exploit','enhance','share','accept','crashing','fast-tracking'].includes(rule.id)&&/\b(?:where|which (?:section|part|document))\b.{0,100}\b(?:charter|document|plan)\b/i.test(ask))return [];
  const clues=[...new Set(rule.patterns.map(re=>re.exec(text)?.[0]).filter(Boolean))];
  if(!clues.length)return [];
  const tip=tips.find(t=>t.id===rule.id);if(!tip)return [];
  const score=(rule.priority??10)+Math.min(40,Math.max(...clues.map(s=>s.length)));
  return [{tip,clues,score}];
 }).sort((a,b)=>b.score-a.score||a.tip.id.localeCompare(b.tip.id));
 cache.set(question,{tips,result});return result;
}
export function filterTips(tips,{search='',category='all'}={}){
 const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
 const words=normalize(search.trim()).split(/\s+/).filter(Boolean);
 return tips.filter(t=>(category==='all'||t.category===category)&&words.every(word=>normalize([t.id,...t.cues,t.en,t.vi,t.cautionEn,t.cautionVi].join(' ')).includes(word)));
}
