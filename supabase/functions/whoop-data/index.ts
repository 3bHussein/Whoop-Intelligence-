import {createClient} from "npm:@supabase/supabase-js@2.57.4";
import {collectPages,readAll} from "../_shared/protocol.js";
const cors={"access-control-allow-origin":"https://3bhussein.github.io","access-control-allow-headers":"authorization,apikey,content-type","access-control-allow-methods":"POST,OPTIONS","vary":"Origin"};
const reply=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
Deno.serve(async req=>{
 try{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return reply({error:"method_not_allowed"},405);
 const bearer=req.headers.get("authorization")||"";if(!bearer.startsWith("Bearer "))return reply({error:"login_required"},401);
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const auth=createClient(url,anon,{auth:{persistSession:false}});
 const {data:{user},error:authErr}=await auth.auth.getUser(bearer.slice(7));if(authErr||!user)return reply({error:"invalid_session"},401);
 const db=createClient(url,service,{auth:{persistSession:false}});
 const {data:token,error:tokenErr}=await db.from("whoop_oauth_tokens").select("*").eq("user_id",user.id).maybeSingle();
 if(tokenErr)return reply({error:"storage_failed"},503);if(!token)return reply({connected:false,records:{}});
 let input:any={};try{input=await req.json()}catch{return reply({error:"invalid_json"},400)}
 if(!["read","sync"].includes(input.action))return reply({error:"unknown_action"},400);
 const types=["recovery","sleep","cycle","workout"];
 if(input.action==="sync"){
  const raw=Deno.env.get("WHOOP_TOKEN_ENCRYPTION_KEY");if(!raw)return reply({error:"encryption_not_configured"},503);
  let access:string;
  try{
   const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));if(bytes.length!==32)throw Error("key");
   const key=await crypto.subtle.importKey("raw",bytes,"AES-GCM",false,["decrypt"]);
   const [iv,ct]=token.access_ciphertext.split(".");
   const decoded=(x:string)=>Uint8Array.from(atob(x),c=>c.charCodeAt(0));
   access=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:decoded(iv)},key,decoded(ct)));
  }catch{return reply({error:"token_decryption_failed"},503)}
  if(Date.parse(token.expires_at)<Date.now()+120000){
   const owner=crypto.randomUUID();
   const {data:claimed,error:lockError}=await db.rpc("whoop_claim_refresh",{p_user:user.id,p_owner:owner});
   if(lockError)return reply({error:"refresh_lock_failed"},503);
   if(!claimed)return reply({error:"refresh_in_progress",message:"Please retry shortly."},409);
   try{
    // Re-read only after acquiring the lock: another request may have rotated the token.
    const {data:fresh,error:freshError}=await db.from("whoop_oauth_tokens").select("*").eq("user_id",user.id).single();
    if(freshError||!fresh)return reply({error:"token_read_failed"},503);
    if(Date.parse(fresh.expires_at)>Date.now()+120000){
     const decode=(v:string)=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
     const key=await crypto.subtle.importKey("raw",decode(raw),"AES-GCM",false,["decrypt"]);
     const [iv,ct]=fresh.access_ciphertext.split(".");
     access=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(iv)},key,decode(ct)));
    }else{
    const [oldIv,oldCt]=fresh.refresh_ciphertext.split(".");
    const decode=(v:string)=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
    const key=await crypto.subtle.importKey("raw",decode(raw),"AES-GCM",false,["encrypt","decrypt"]);
    const refresh=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(oldIv)},key,decode(oldCt)));
    const clientId=Deno.env.get("WHOOP_CLIENT_ID"),clientSecret=Deno.env.get("WHOOP_CLIENT_SECRET");
    if(!clientId||!clientSecret)return reply({error:"client_credentials_missing"},503);
    const response=await fetch("https://api.prod.whoop.com/oauth/oauth2/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"refresh_token",refresh_token:refresh,client_id:clientId,client_secret:clientSecret,scope:"offline"}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)return reply({error:response.status===429?"whoop_rate_limited":"refresh_rejected",http_status:response.status},response.status===429?429:409);
    const renewed=await response.json();
    if(typeof renewed.access_token!=="string"||typeof renewed.refresh_token!=="string"||!Number.isFinite(Number(renewed.expires_in)))return reply({error:"invalid_refresh_response"},502);
    const encrypt=async(value:string)=>{const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(value)));return btoa(String.fromCharCode(...iv))+"."+btoa(String.fromCharCode(...encrypted))};
    const {data:updated,error:updateError}=await db.from("whoop_oauth_tokens").update({access_ciphertext:await encrypt(renewed.access_token),refresh_ciphertext:await encrypt(renewed.refresh_token),expires_at:new Date(Date.now()+Math.max(1,Number(renewed.expires_in))*1000).toISOString(),updated_at:new Date().toISOString()}).eq("user_id",user.id).eq("refresh_lock_owner",owner).select("user_id").single();
    if(updateError||!updated)return reply({error:"refresh_persist_failed"},503);
    access=renewed.access_token;
    }
   }catch{return reply({error:"refresh_failed"},503)}
   finally{await db.rpc("whoop_release_refresh",{p_user:user.id,p_owner:owner})}
  }
  const endpoints:any={recovery:"recovery",sleep:"activity/sleep",cycle:"cycle",workout:"activity/workout"};
  await db.from("whoop_sync_runs").update({status:"abandoned",finished_at:new Date().toISOString()}).eq("user_id",user.id).eq("status","running").lt("started_at",new Date(Date.now()-120000).toISOString());
  const {data:run,error:runError}=await db.from("whoop_sync_runs").insert({user_id:user.id,status:"running"}).select("id").single();
  if(runError||!run)return reply({error:runError?.code==="23505"?"sync_in_progress":"sync_monitor_failed"},runError?.code==="23505"?409:503);
  const counts:any={},errors:any={},pages:any={};
  const started=Date.now(),deadline=started+70000;
  const {data:lastRows}=await db.from("whoop_health_records").select("fetched_at").eq("user_id",user.id).order("fetched_at",{ascending:false}).limit(1);
  const last=lastRows?.[0]?.fetched_at;
  // Manual sync repairs the complete comparison window; background overlap updates recent scores.
  const days=input.full===true||!last?62:Math.max(7,Math.min(62,Math.ceil((Date.now()-Date.parse(last))/86400000)+3));
  for(const type of types){
   try{
    const target=new URL("https://api.prod.whoop.com/developer/v2/"+endpoints[type]);
    target.searchParams.set("limit","25");target.searchParams.set("start",new Date(started-days*86400000).toISOString());target.searchParams.set("end",new Date(started).toISOString());
    const result=await collectPages(target,access,type,async(payloads:any[])=>{
     const rows=payloads.map(v=>({user_id:user.id,record_type:type,source_id:String(type==="recovery"?v.cycle_id:v.id),source_updated_at:v.updated_at??null,payload:v,fetched_at:new Date().toISOString()}));
     if(rows.length){const {error}=await db.from("whoop_health_records").upsert(rows,{onConflict:"user_id,record_type,source_id"});if(error)throw Error("write_failed")}
    },{deadline});
    counts[type]=result.count;pages[type]=result.pages;
   }catch(e){const allowed=["rate_limited","reauthorization_required","invalid_response","invalid_cursor","invalid_record_id","repeated_cursor","write_failed","pagination_limit_exceeded","sync_time_budget_exceeded"];const message=e instanceof Error?e.message:"";errors[type]=allowed.includes(message)||/^whoop_http_\d{3}$/.test(message)?message:"network_error"}
  }
  const {error:monitorError}=await db.from("whoop_sync_runs").update({status:Object.keys(errors).length?"partial":"complete",finished_at:new Date().toISOString(),counts,errors}).eq("user_id",user.id).eq("id",run.id);
  if(monitorError)errors.monitor="history_write_failed";
  console.info(JSON.stringify({event:"whoop_sync",duration_ms:Date.now()-started,counts,pages,errors}));
  return reply({connected:true,counts,pages,errors,window_days:days,completed_at:new Date().toISOString()});
 }
 const records:any={};
 for(const type of types){
  try{const data=await readAll((from:number,to:number)=>db.from("whoop_health_records").select("payload").eq("user_id",user.id).eq("record_type",type).order("source_id",{ascending:true}).range(from,to));records[type]=data.map((r:any)=>r.payload)}
  catch{return reply({error:"storage_failed"},503)}
 }
 const {data:syncHistory,error:historyError}=await db.from("whoop_sync_runs").select("started_at,finished_at,status,counts,errors").eq("user_id",user.id).order("started_at",{ascending:false}).limit(10);
 return reply({connected:true,records,sync_history:syncHistory||[],history_available:!historyError});
 }catch{return reply({error:"server_error"},503)}
});
