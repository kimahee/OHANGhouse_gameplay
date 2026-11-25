import {cp,mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const path of ['index.html','assets','css','js'])await cp(path,'dist/'+path,{recursive:true});
