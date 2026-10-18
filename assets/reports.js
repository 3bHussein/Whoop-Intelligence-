import {analyze,windowStats,METRICS,DAY,numeric} from './analytics.js';
// Daily reports never substitute a previous day's latest measurement for today.
export function buildReport(records,period=1,now=new Date()){
 const a=analyze(records,period,now),previousDay=new Date(Date.parse(a.endDay+'T00:00:00Z')-DAY).toISOString().slice(0,10);
 const metrics=Object.fromEntries(Object.keys(METRICS).map(key=>{
  const s=a.metrics[key],baseline=windowStats(a.days,key,30,previousDay),daily=period===1,value=s.current.median;
  const reference=daily?baseline:s.previous,eligible=daily?reference.count>=7:s.current.count>=3&&reference.count>=3;
  const difference=numeric(value)&&eligible?value-reference.median:null;
  return [key,{value,count:s.current.count,coverage:s.current.coverage,reference:reference.median,referenceCount:reference.count,difference,referenceStart:reference.start,referenceEnd:reference.end,stamp:s.current.rows.at(-1)?(key==='strain'?s.current.rows.at(-1).cycle?.end||s.current.rows.at(-1).cycle?.start:['sleep','efficiency','consistency'].includes(key)?s.current.rows.at(-1).sleepRecord?.end:s.current.rows.at(-1).measuredAt):null}];
 }));
 const keyMetrics=['recoveryScore','sleep','strain'];return {...a,localKnown:a.days.some(d=>d.offset||d.cycle?.timezone_offset),period,start:a.metrics.rhr.current.start,metrics,available:keyMetrics.filter(k=>metrics[k].value!==null).length,total:keyMetrics.length};
}
