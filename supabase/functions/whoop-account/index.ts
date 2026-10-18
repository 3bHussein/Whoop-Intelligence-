import {createClient} from "npm:@supabase/supabase-js@2.57.4";
import {readAll} from "../_shared/protocol.js";
const headers={"access-control-allow-origin":"https://3bhussein.github.io","access-control-allow-headers":"authorization,apikey,content-type","access-control-allow-methods":"POST,OPTIONS","content-type":"application/json","cache-control":"no-store","vary":"Origin"};
const send=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return send({error:"method_not_allowed"},405);
 const bearer=req.headers.get("authorization")||"";
 if(!bearer.startsWith("Bearer "))return send({error:"authentication_required"},401);
 try{
  const base=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const identity=createClient(base,anon,{auth:{persistSession:false}});
  const {data:{user},error}=await identity.auth.getUser(bearer.slice(7));
  if(error||!user)return send({error:"invalid_session"},401);
  const db=createClient(base,service,{auth:{persistSession:false}});
  let body:Record<string,unknown>;try{body=await req.json()}catch{return send({error:"invalid_json"},400)}
  if(body.action==="status"){
   const {data:token,error:te}=await db.from("whoop_oauth_tokens").select("expires_at,updated_at").eq("user_id",user.id).maybeSingle();
   if(te)return send({error:"storage_failed"},503);
   const {count,error:re}=await db.from("whoop_health_records").select("source_id",{count:"exact",head:true}).eq("user_id",user.id);
   if(re)return send({error:"storage_failed"},503);
   return send({connected:!!token,access_expires_at:token?.expires_at??null,records:count??0});
  }
  if(body.action==="export"){
   const data=await readAll((from:number,to:number)=>db.from("whoop_health_records").select("record_type,source_id,source_updated_at,payload,fetched_at").eq("user_id",user.id).order("record_type").order("source_id").range(from,to));
   return send({format:"whoop-intelligence-export-v2",exported_at:new Date().toISOString(),records:data,truncated:false});
  }

  if(body.action==="disconnect"){
   if(body.confirm!=="DISCONNECT")return send({error:"confirmation_required"},400);
   // Best-effort remote revocation precedes local erasure; never return credentials or upstream bodies.
   const {data:token,error:tokenReadError}=await db.from("whoop_oauth_tokens").select("access_ciphertext,expires_at").eq("user_id",user.id).maybeSingle();
   if(tokenReadError)return send({error:"storage_failed"},503);
   let revokeStatus="not_connected";
   if(token){
    revokeStatus="expired_token";
    if(Date.parse(token.expires_at)>Date.now()){
     try{
      const raw=Deno.env.get("WHOOP_TOKEN_ENCRYPTION_KEY");if(!raw)throw Error("key");
      const decode=(v:string)=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
      const key=await crypto.subtle.importKey("raw",decode(raw),"AES-GCM",false,["decrypt"]);
      const [iv,ct]=token.access_ciphertext.split(".");
      const access=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(iv)},key,decode(ct)));
      const response=await fetch("https://api.prod.whoop.com/developer/v2/user/access",{method:"DELETE",headers:{Authorization:"Bearer "+access},signal:AbortSignal.timeout(12000)});
      revokeStatus=response.status===204?"revoked":response.status===401?"rejected":response.status===429?"rate_limited":"provider_failed";
     }catch{revokeStatus="unavailable"}
    }
   }
   const {error:recordsError}=await db.from("whoop_health_records").delete().eq("user_id",user.id);
   if(recordsError)return send({error:"record_deletion_failed"},503);
   const {error:tokensError}=await db.from("whoop_oauth_tokens").delete().eq("user_id",user.id);
   if(tokensError)return send({error:"token_deletion_failed"},503);
   const {error:pendingError}=await db.from("whoop_oauth_pending").delete().eq("user_id",user.id);
   if(pendingError)return send({error:"pending_deletion_failed"},503);
   const {error:historyError}=await db.from("whoop_sync_runs").delete().eq("user_id",user.id);
   if(historyError)return send({error:"history_deletion_failed"},503);
   return send({disconnected:true,local_records_deleted:true,remote_revoked:revokeStatus==="revoked",remote_revoke_status:revokeStatus,remote_revoke_unverified:revokeStatus!=="revoked"});
  }
  return send({error:"unknown_action"},400);
 }catch{return send({error:"server_error"},503)}
});
