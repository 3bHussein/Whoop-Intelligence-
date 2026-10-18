// Presentation rules do not change measurements or infer medical readiness.
export const presentationMode=value=>value==='advanced'?'advanced':'simple';
export function simpleState(stats){
 if(!stats.latest)return 'missing';
 if(stats.latest.day<stats.current.start)return 'stale';
 if(stats.latestDelta===null||stats.baselineCount<7)return 'insufficient';
 return stats.latestDelta>0?'higher':stats.latestDelta<0?'lower':'same';
}
export function durationParts(hours){if(typeof hours!=='number'||!Number.isFinite(hours))return null;const minutes=Math.round(hours*60);return {hours:Math.floor(minutes/60),minutes:minutes%60}}
