import {readFileSync,copyFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(fileURLToPath(import.meta.url));
const gradle=readFileSync(path.join(root,'android/app/build.gradle'),'utf8');
const version=gradle.match(/versionName "([\d.]+)"/)[1];
const dir=path.join(root,'artifacts'),name=`dictionnaire-infernal-${version}-debug.apk`;
mkdirSync(dir,{recursive:true});
copyFileSync(path.join(root,'android/app/build/outputs/apk/debug/app-debug.apk'),path.join(dir,name));
const digest=createHash('sha256').update(readFileSync(path.join(dir,name))).digest('hex');
writeFileSync(path.join(dir,name+'.sha256'),digest+'  '+name+'\n');
console.log('Android test APK: '+path.join(dir,name));
