import {cpSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
export function buildSite({root=process.cwd(),output=join(root,'_site'),release=process.env.SITE_RELEASE||'dev'}={}){
 if(!/^[a-z0-9_-]{1,80}$/i.test(release))throw Error('Invalid site release');
 if(resolve(output)===resolve(root))throw Error('Output must differ from source');
 rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
 // Keep canonical assets for older open tabs; new HTML uses an immutable release path.
 cpSync(join(root,'assets'),join(output,'assets'),{recursive:true});
 cpSync(join(root,'assets'),join(output,'assets','releases',release),{recursive:true});
 for(const file of ['index.html','analysis.html','data.html','privacy.html','reports.html']){
  const html=readFileSync(join(root,file),'utf8').replace(/(["'])(?:\.\/)?assets\//g,(_,quote)=>quote+'assets/releases/'+release+'/');
  writeFileSync(join(output,file),html);
 }
 return{output,release};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){const result=buildSite();process.stdout.write('Built public site: '+result.release+'\n')}
