import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":"https://3bhussein.github.io","access-control-allow-headers":"authorization,content-type,apikey","vary":"Origin"}});
const hex=(b:Uint8Array)=>Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"https://3bhussein.github.io","access-control-allow-headers":"authorization,content-type,apikey","access-control-allow-methods":"POST,OPTIONS"}});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 const bearer=req.headers.get("authorization")||"";
 if(!bearer.startsWith("Bearer "))return json({error:"authentication_required"},401);
 const secret=Deno.env.get("WHOOP_TOKEN_ENCRYPTION_KEY");
 const clientId=Deno.env.get("WHOOP_CLIENT_ID");
 if(!secret||!clientId)return json({error:"oauth_not_configured"},503);
 try{
  const supabaseUrl=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth=createClient(supabaseUrl,anon,{global:{headers:{Authorization:bearer}},auth:{persistSession:false}});
  const {data:{user},error}=await auth.auth.getUser();
  if(error||!user)return json({error:"invalid_session"},401);
  const stateBytes=crypto.getRandomValues(new Uint8Array(32));const state=hex(stateBytes);
  const hash=hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(state))));
  const admin=createClient(supabaseUrl,service,{auth:{persistSession:false}});
  const {error:insertError}=await admin.from("whoop_oauth_pending").insert({state_hash:hash,user_id:user.id,expires_at:new Date(Date.now()+600000).toISOString()});
  if(insertError)return json({error:"state_store_failed"},503);
  const url=new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
  url.searchParams.set("client_id",clientId);url.searchParams.set("redirect_uri","https://jsfeybhgobmrydcfnyjg.supabase.co/functions/v1/whoop-callback");
  url.searchParams.set("response_type","code");url.searchParams.set("state",state);
  url.searchParams.set("scope","read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline");
  return json({authorization_url:url.toString()});
 }catch{return json({error:"internal_error"},500)}
});
