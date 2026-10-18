// Shared, fixture-testable WHOOP protocol primitives. Never log tokens or payloads.
export function parsePage(value,type){
 if(!value||!Array.isArray(value.records))throw Error('invalid_response');
 if(value.next_token!=null&&typeof value.next_token!=='string')throw Error('invalid_cursor');
 const map=new Map();for(const payload of value.records){const id=type==='recovery'?payload?.cycle_id:payload?.id;if(id===null||id===undefined||!['string','number'].includes(typeof id))throw Error('invalid_record_id');map.set(String(id),payload)}
 return {records:[...map.values()],next:value.next_token||null};
}
export function retryDelay(value,now=Date.now()){const seconds=Number(value);if(value!==null&&value!==''&&Number.isFinite(seconds)&&seconds>=0)return seconds*1000;const date=Date.parse(value);return Number.isFinite(date)?Math.max(0,date-now):1000}
export async function fetchPage(url,token,{fetcher=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 for(let attempt=0;attempt<3;attempt++){
  const response=await fetcher(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000)});
  if(response.ok)return response;
  if(response.status===429||response.status>=500){const delay=response.status===429?retryDelay(response.headers.get('retry-after')):500*2**attempt;if(attempt<2&&delay<=3000){await sleep(delay);continue}}
  const error=Error(response.status===429?'rate_limited':response.status===401?'reauthorization_required':'whoop_http_'+response.status);error.retryAfter=response.headers.get('retry-after');throw error;
 }
}
export async function collectPages(target,access,type,save,{fetcher=fetchPage,maxPages=20,deadline=Date.now()+70000}={}){
 const url=new URL(target),seen=new Set();let count=0,pages=0;
 for(;pages<maxPages;pages++){
  if(Date.now()>deadline)throw Error('sync_time_budget_exceeded');
  const response=await fetcher(url,access),page=parsePage(await response.json(),type);
  await save(page.records);count+=page.records.length;
  if(!page.next)return {count,pages:pages+1,complete:true};
  if(seen.has(page.next))throw Error('repeated_cursor');seen.add(page.next);url.searchParams.set('nextToken',page.next);
 }
 throw Error('pagination_limit_exceeded');
}
export async function readAll(makeQuery,{batch=500,max=20000}={}){const result=[];for(let offset=0;offset<max;offset+=batch){const {data,error}=await makeQuery(offset,offset+batch-1);if(error)throw Error('storage_failed');result.push(...(data||[]));if((data||[]).length<batch)return result}throw Error('export_limit_exceeded');}
