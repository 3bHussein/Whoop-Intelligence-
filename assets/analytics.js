// Pure calculations: only caller-supplied authenticated records, never demo defaults.
export const DAY=86400000;
export const numeric=x=>typeof x==='number'&&Number.isFinite(x);
export const median=a=>{if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2};
export const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
export function localDay(stamp,offset){const t=Date.parse(stamp);if(!Number.isFinite(t)||!/^[-+]\d{2}:\d{2}$/.test(offset||''))return null;const sign=offset[0]==='-'?-1:1,mins=sign*(Number(offset.slice(1,3))*60+Number(offset.slice(4)));if(Number(offset.slice(4))>59||Math.abs(mins)>14*60)return null;return new Date(t+mins*60000).toISOString().slice(0,10)}
const time=r=>Date.parse(r.updated_at||r.created_at)||0;
export function dedupe(rows,key){const map=new Map();for(const r of rows||[]){const id=r?.[key];if(id===null||id===undefined)continue;const old=map.get(String(id));if(!old||time(r)>=time(old))map.set(String(id),r)}return [...map.values()]}
function sleepHours(s){const st=s.score?.stage_summary;if(!st)return null;const stages=[st.total_light_sleep_time_milli,st.total_slow_wave_sleep_time_milli,st.total_rem_sleep_time_milli];if(stages.every(x=>numeric(x)&&x>=0)){const total=stages.reduce((a,b)=>a+b,0);return total<=DAY?total/3600000:null}const bed=st.total_in_bed_time_milli,awake=st.total_awake_time_milli,missing=st.total_no_data_time_milli??st.total_no_signal_time_milli;if([bed,awake,missing].every(numeric)&&bed>0&&awake>=0&&missing>=0&&bed<=DAY&&bed>=awake+missing)return (bed-awake-missing)/3600000;return null}
const scored=r=>r?.score_state==='SCORED'&&r.score;
const valid=(v,min,max)=>numeric(v)&&v>=min&&v<=max?v:null;
export function normalize(records){
 const cycles=dedupe(records.cycle,'id'),byCycle=new Map(cycles.map(r=>[String(r.id),r]));
 const sleeps=dedupe(records.sleep,'id'),bySleep=new Map(sleeps.map(r=>[String(r.id),r]));
 const rows=new Map();let unaligned=0,excluded=0;
 const ensure=(day,stamp)=>{if(!rows.has(day))rows.set(day,{day,stamp});return rows.get(day)};
 for(const c of cycles){const day=localDay(c.start,c.timezone_offset);if(!day){unaligned++;continue}const row=ensure(day,c.start);if(!row.cycle||time(c)>=time(row.cycle)){row.cycle=c;row.strain=scored(c)?valid(c.score.strain,0,21):null}}
 for(const r of dedupe(records.recovery,'cycle_id')){
  const c=byCycle.get(String(r.cycle_id)),s=bySleep.get(String(r.sleep_id));
  const day=c?localDay(c.start,c.timezone_offset):s?localDay(s.end,s.timezone_offset):null;
  if(!day){unaligned++;continue}const row=ensure(day,c?.start||s.end);
  if(row.recovery&&time(row.recovery)>time(r))continue;
  row.recovery=r;row.measuredAt=s?.end||c?.start;row.offset=c?.timezone_offset||s?.timezone_offset;
  const ok=scored(r)&&r.score.user_calibrating!==true;
  row.rhr=ok?valid(r.score.resting_heart_rate,0,Infinity):null;row.hrv=ok?valid(r.score.hrv_rmssd_milli,0,Infinity):null;row.recoveryScore=ok?valid(r.score.recovery_score,0,100):null;
  // IDs are authoritative. No UTC created_at approximation or nearest-day pairing.
  if(s&&s.nap!==true&&scored(s)){
   const st=s.score.stage_summary,bed=st?.total_in_bed_time_milli,awake=st?.total_awake_time_milli;
   row.sleep=sleepHours(s);row.efficiency=valid(s.score.sleep_efficiency_percentage,0,100);
   row.consistency=valid(s.score.sleep_consistency_percentage,0,100);row.sleepRecord=s;
  }
 }
 // Sleep can exist before recovery is scored. Include main sleep independently.
 for(const s of sleeps.filter(s=>s.nap!==true&&scored(s)).sort((a,b)=>time(a)-time(b))){
  const c=byCycle.get(String(s.cycle_id)),day=c?localDay(c.start,c.timezone_offset):localDay(s.end,s.timezone_offset);
  if(!day)continue;const row=ensure(day,c?.start||s.end);
  if(row.sleepRecord&&String(row.sleepRecord.id)!==String(s.id)&&row.recovery)continue;
  const st=s.score.stage_summary,bed=st?.total_in_bed_time_milli,awake=st?.total_awake_time_milli;
  row.sleep=sleepHours(s);row.efficiency=valid(s.score.sleep_efficiency_percentage,0,100);
  row.consistency=valid(s.score.sleep_consistency_percentage,0,100);row.sleepRecord=s;row.offset=row.offset||s.timezone_offset;
 }
 for(const row of rows.values())for(const k of ['rhr','hrv','recoveryScore','sleep','strain','efficiency','consistency'])if(row[k]===null||row[k]===undefined)excluded++;
 return {days:[...rows.values()].sort((a,b)=>a.day.localeCompare(b.day)),unaligned,excluded};
}
export const METRICS={rhr:{unit:'bpm'},hrv:{unit:'ms'},recoveryScore:{unit:'%'},sleep:{unit:'h'},strain:{unit:''},efficiency:{unit:'%'},consistency:{unit:'%'}};
export function windowStats(days,key,n,endDay){const end=Date.parse(endDay+'T00:00:00Z'),start=end-(n-1)*DAY;const rows=days.filter(r=>{const t=Date.parse(r.day+'T00:00:00Z');return t>=start&&t<=end&&numeric(r[key])});const values=rows.map(r=>r[key]);return {median:median(values),mean:mean(values),count:values.length,coverage:values.length/n,rows,start:new Date(start).toISOString().slice(0,10),end:endDay}}
export function metricStats(days,key,n,endDay){const current=windowStats(days,key,n,endDay),priorEnd=new Date(Date.parse(endDay+'T00:00:00Z')-n*DAY).toISOString().slice(0,10),previous=windowStats(days,key,n,priorEnd);const latest=[...days].reverse().find(r=>r.day<=endDay&&numeric(r[key]));const baseline=latest?days.filter(r=>r.day<latest.day&&r.day>=new Date(Date.parse(latest.day+'T00:00:00Z')-30*DAY).toISOString().slice(0,10)&&numeric(r[key])).map(r=>r[key]):[];return {current,previous,delta:current.count>=3&&previous.count>=3?current.median-previous.median:null,latest:latest?{value:latest[key],day:latest.day,stamp:key==='strain'?latest.cycle?.end||latest.cycle?.start:['sleep','efficiency','consistency'].includes(key)?latest.sleepRecord?.end:latest.measuredAt}:null,baseline:median(baseline),baselineCount:baseline.length,latestDelta:latest&&baseline.length>=7?latest[key]-median(baseline):null,confidence:current.count>=14&&current.coverage>=.8?'established':current.count>=7?'preliminary':'insufficient'}}
export function pearson(pairs){if(pairs.length<7)return null;const x=mean(pairs.map(p=>p.x)),y=mean(pairs.map(p=>p.y));let xx=0,yy=0,xy=0;for(const p of pairs){const a=p.x-x,b=p.y-y;xx+=a*a;yy+=b*b;xy+=a*b}return xx>0&&yy>0?Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy))):null}
export function relationships(days,n,endDay){const specs=[['sleep','recoveryScore',false],['sleep','hrv',false],['strain','recoveryScore',true],['strain','rhr',true],['consistency','recoveryScore',false]];const current=windowStats(days,'recoveryScore',n,endDay);const within=days.filter(r=>r.day>=current.start&&r.day<=endDay),map=new Map(days.map(r=>[r.day,r]));return specs.map(([x,y,lag])=>{const pairs=[];for(const r of within){const prev=lag?map.get(new Date(Date.parse(r.day+'T00:00:00Z')-DAY).toISOString().slice(0,10)):r;if(numeric(prev?.[x])&&numeric(r[y]))pairs.push({x:prev[x],y:r[y],day:r.day})}const coefficient=pearson(pairs); // Outliers retained; report leave-one-out sensitivity rather than silently pruning.
 const omitted=pairs.length>=8?pairs.map((_,i)=>pearson(pairs.filter((_,j)=>j!==i))).filter(numeric):[];
 const sensitive=coefficient!==null&&omitted.some(v=>Math.abs(v-coefficient)>.2||v*coefficient<0);
 return {x,y,lag,pairs,count:pairs.length,coefficient,sensitive,confidence:pairs.length>=30?'descriptive':pairs.length>=7?'preliminary':'insufficient'};})}
export function analyze(records,n=7,now=new Date()){const normalized=normalize(records);const offsets=normalized.days.map(r=>r.offset||r.cycle?.timezone_offset).filter(Boolean);const endDay=localDay(now.toISOString(),offsets.at(-1))||now.toISOString().slice(0,10);return {...normalized,endDay,metrics:Object.fromEntries(Object.keys(METRICS).map(k=>[k,metricStats(normalized.days,k,n,endDay)])),relationships:relationships(normalized.days,n,endDay)}}
