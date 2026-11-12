// Keep every browser module import aligned with the published source version.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {icon} from './dist/icons.js';

const digest=name=>createHash('sha256').update(readFileSync('dist/'+name)).digest('hex').slice(0,12);

const iconsVersion=digest('icons.js');
const nativeVersion=digest('native.js');

let settings=readFileSync('dist/settings.js','utf8')
  .replace(/from '\.\/native\.js(?:\?[^']*)?'/,"from './native.js?v="+nativeVersion+"'");
writeFileSync('dist/settings.js',settings);
const settingsVersion=digest('settings.js');

let backup=readFileSync('dist/backup.js','utf8')
  .replace(/from '\.\/settings\.js(?:\?[^']*)?'/,"from './settings.js?v="+settingsVersion+"'");
writeFileSync('dist/backup.js',backup);
const backupVersion=digest('backup.js');

const entriesVersion=digest('entries.js');

let app=readFileSync('dist/app.js','utf8')
  .replace(/from '\.\/entries\.js(?:\?[^']*)?'/,"from './entries.js?v="+entriesVersion+"'")
  .replace(/from '\.\/icons\.js(?:\?[^']*)?'/,"from './icons.js?v="+iconsVersion+"'")
  .replace(/from '\.\/native\.js(?:\?[^']*)?'/,"from './native.js?v="+nativeVersion+"'")
  .replace(/from '\.\/settings\.js(?:\?[^']*)?'/,"from './settings.js?v="+settingsVersion+"'")
  .replace(/from '\.\/backup\.js(?:\?[^']*)?'/,"from './backup.js?v="+backupVersion+"'");
writeFileSync('dist/app.js',app);

let html=readFileSync('dist/index.html','utf8')
  .replace(/src="app\.js(?:\?[^"]*)?"/,'src="app.js?v='+digest('app.js')+'"')
  .replace(/href="style\.css(?:\?[^"]*)?"/,'href="style.css?v='+digest('style.css')+'"');
html=html.replace(/<svg\b[^>]*data-icon="([\w-]+)"[^>]*>[\s\S]*?<\/svg>/g,(_,name)=>icon(name));
writeFileSync('dist/index.html',html);
