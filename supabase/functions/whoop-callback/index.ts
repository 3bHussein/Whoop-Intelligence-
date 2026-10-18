import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const message=(msg:string,status=200)=>new Response("<!doctype html><html><head><meta charset='utf-8'><meta name='referrer' content='no-referrer'></head><body><h2>"+msg+"</h2><a href='https://3bhussein.github.io/Whoop-Intelligence-/'>Return to WHOOP Intelligence</a></body></html>",{status,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'"}});
const hex=(b:Uint8Array)=>Array.from(b,x=>x.toString(16).padStart(2,"0")).join("");
const base64=(b:Uint8Array)=>btoa(String.fromCharCode(...b));
Deno.serve(async req=>{
 if(req.method!=="GET")return message("Method not allowed",405);
 const url=new URL(req.url),code=url.searchParams.get("code"),state=url.searchParams.get("state");
 if(!code||!state||state.length!==64||!/^[0-9a-f]+$/.test(state))return message("Authorization not completed. Start again from the app.",400);
 const cid=Deno.env.get("WHOOP_CLIENT_ID"),cs=Deno.env.get("WHOOP_CLIENT_SECRET"),raw=Deno.env.get("WHOOP_TOKEN_ENCRYPTION_KEY");
 if(!cid||!cs||!raw)return message("Connection is being configured. Please try later.",503);
 let key:CryptoKey;
 try{const bin=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));if(bin.length!==32)throw Error("key length");key=await crypto.subtle.importKey("raw",bin,"AES-GCM",false,["encrypt"])}catch{return message("Server encryption configuration incomplete.",503)}
 try{
  const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
  const hash=hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(state))));
  const {data, error}=await supabase.rpc("consume_whoop_oauth_state",{p_hash:hash});
  if(error||!Array.isArray(data)||data.length!==1)return message("Authorization expired or already used. Start again.",400);
  const userId=data[0].user_id;
  const body=new URLSearchParams({grant_type:"authorization_code",code,client_id:cid,client_secret:cs,redirect_uri:"https://jsfeybhgobmrydcfnyjg.supabase.co/functions/v1/whoop-callback"});
  const resp=await fetch("https://api.prod.whoop.com/oauth/oauth2/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body,signal:AbortSignal.timeout(15000)});
  if(!resp.ok)return message("WHOOP declined authorization. Please try again.",502);
  const tokens=await resp.json();if(typeof tokens.access_token!=="string"||typeof tokens.refresh_token!=="string"||!Number.isFinite(Number(tokens.expires_in)))return message("WHOOP response missing refresh credentials.",502);
  async function encrypt(token:string){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(token)));return base64(iv)+"."+base64(ct)}
  const {error:saveError}=await supabase.from("whoop_oauth_tokens").upsert({user_id:userId,access_ciphertext:await encrypt(tokens.access_token),refresh_ciphertext:await encrypt(tokens.refresh_token),expires_at:new Date(Date.now()+Math.max(60,Number(tokens.expires_in))*1000).toISOString(),scopes:String(tokens.scope||"").split(" ").filter(Boolean),updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(saveError)return message("Connection was authorized, but secure storage failed. Contact support.",503);
  return message("WHOOP connected securely. You may close this window.");
 }catch{return message("Connection could not be completed. Please retry.",503)}
});
