import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number(process.argv[2]||8080);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');

const types={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.png':'image/png',
  '.svg':'image/svg+xml'
};

const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const filename=path.resolve(root,'.'+name);
    if(filename!==path.resolve(root)&&!filename.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}
    const info=await stat(filename);
    const target=info.isDirectory()?path.join(filename,'index.html'):filename;
    const body=await readFile(target);
    res.writeHead(200,{
      'Content-Type':types[path.extname(target)]||'application/octet-stream',
      'Content-Length':body.length,
      'Cache-Control':'no-store'
    });
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){
    res.writeHead(error instanceof URIError?400:404);
    res.end('File not found');
  }
});

server.on('error',error=>{
  console.error(error.code==='EADDRINUSE'?'Port in use. Try: node serve.mjs 8081':error.message);
  process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>console.log('Dictionnaire Infernal: http://localhost:'+port+' (Ctrl+C to stop)'));
