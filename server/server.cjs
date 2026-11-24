'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const {openDatabase}=require('./database.cjs');
const scrypt=promisify(crypto.scrypt);
const ROOT=path.resolve(__dirname,'..');
const SESSION_MS=7*24*60*60*1000;
const COOKIE='feed_session';
const validId=/^[A-Za-z0-9_]{3,24}$/;
const hashToken=t=>crypto.createHash('sha256').update(t).digest('hex');
const derive=(password,salt)=>scrypt(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});
const STATIC=new Map([
  ['/styles/game.css','text/css; charset=utf-8'],['/styles/account.css','text/css; charset=utf-8'],
  ...['config','input','town','navigation','game','account','session'].map(n=>['/scripts/'+n+'.js','text/javascript; charset=utf-8']),
  ...['male','female'].map(n=>['/assets/characters/'+n+'.png','image/png'])
]);
function cookieToken(req){
  const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='));
  const token=cookie?.slice(COOKIE.length+1)||'';
  return /^[a-f0-9]{64}$/.test(token)?token:null;
}
function error(status,message){return Object.assign(new Error(message),{status});}
async function readBody(req){
  if((req.headers['content-type']||'').split(';')[0].trim().toLowerCase()!=='application/json')throw error(415,'กรุณาส่ง JSON');
  let size=0;const chunks=[];
  for await(const chunk of req){
    size+=chunk.length;
    if(size>4096)throw error(413,'ข้อมูลยาวเกินกำหนด');
    chunks.push(chunk);
  }
  try{const obj=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error();return obj;}catch{throw error(400,'ข้อมูลไม่ถูกต้อง');}
}
function createServer(options={}){
  const production=options.production??process.env.NODE_ENV==='production';
  const origin=options.origin??process.env.PUBLIC_ORIGIN;
  if(origin&&new URL(origin).origin!==origin)throw Error('PUBLIC_ORIGIN must be an origin without trailing slash');
  if(production&&origin&&!origin.startsWith('https://'))throw Error('HTTPS is required in production');
  if(production&&!origin)throw Error('Set PUBLIC_ORIGIN to the public HTTPS URL');
  const db=openDatabase(options.dbPath??process.env.DB_PATH??path.join(ROOT,'data','feed-days.sqlite'));
  const accounts=db.prepare('SELECT id,salt,password_hash FROM accounts WHERE id=?');
  const insert=db.prepare('INSERT INTO accounts(id,salt,password_hash,created_at) VALUES(?,?,?,?)');
  const session=db.prepare('SELECT account_id FROM sessions WHERE token_hash=? AND expires_at>?');
  const addSession=db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)');
  const dropSession=db.prepare('DELETE FROM sessions WHERE token_hash=?');
  const purge=db.prepare('DELETE FROM sessions WHERE expires_at<=?');
  const limits=new Map();let inFlight=0;
  function throttle(key,max,now){
    let v=limits.get(key);
    if(!v||v.until<=now){if(limits.size>=10000)throw error(429,'มีคำขอมากเกินไป กรุณาลองใหม่ภายหลัง');v={count:0,until:now+15*60*1000};limits.set(key,v);}
    if(++v.count>max)throw error(429,'ลองหลายครั้งเกินไป กรุณารอ 15 นาที');
  }
  const cleanup=setInterval(()=>{const now=Date.now();for(const [key,v] of limits)if(v.until<=now)limits.delete(key);purge.run(now);},60000);cleanup.unref();
  purge.run(Date.now());
  function current(req){const token=cookieToken(req);return token?session.get(hashToken(token),Date.now())?.account_id:null;}
  const setCookie=(value,maxAge)=>COOKIE+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+maxAge+(production?'; Secure':'');
  function sameOrigin(req){
    if(req.headers['sec-fetch-site']==='cross-site')throw error(403,'คำขอข้ามเว็บไซต์ไม่ได้รับอนุญาต');
    const expected=origin||'http://'+req.headers.host;
    if(req.headers.origin!==expected)throw error(403,'ต้นทางคำขอไม่ถูกต้อง');
  }
  function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
  function redirect(res,to){res.writeHead(303,{Location:to,'Cache-Control':'no-store'});res.end();}
  function serve(req,res,file,type){
    const p=path.join(ROOT,file);
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Content-Length':fs.statSync(p).size});
    if(req.method==='HEAD')res.end();else fs.createReadStream(p).pipe(res);
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://cdn.jsdelivr.net; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try{
      const url=new URL(req.url,'http://localhost'),p=url.pathname;
      if(p==='/health'&&req.method==='GET'){db.prepare('SELECT 1').get();return json(res,200,{ok:true});}
      if(p==='/api/auth/me'&&req.method==='GET'){const id=current(req);return id?json(res,200,{id}):json(res,401,{message:'กรุณาเข้าสู่ระบบ'});}
      if(['/api/auth/register','/api/auth/login','/api/auth/logout'].includes(p)&&req.method==='POST'){
        sameOrigin(req);
        const body=await readBody(req);
        if(p.endsWith('/logout')){const t=cookieToken(req);if(t)dropSession.run(hashToken(t));res.setHeader('Set-Cookie',setCookie('',0));return json(res,200,{ok:true});}
        const id=typeof body.id==='string'?body.id.trim():'';
        const password=body.password;
        const register=p.endsWith('/register');
        if(!validId.test(id)||typeof password!=='string'||password.length<(register?10:1)||password.length>128)throw error(400,'ID ต้องมี 3–24 ตัวอักษรอังกฤษ ตัวเลข หรือ _ และรหัสผ่านต้องมีความยาวตามกำหนด');
        const now=Date.now();
        throttle('ip:'+req.socket.remoteAddress,100,now);throttle('id:'+id.toLowerCase(),8,now);
        if(inFlight>=4)throw error(429,'เซิร์ฟเวอร์กำลังทำงานหนัก กรุณาลองใหม่');
        inFlight++;
        try{
          if(register){
            const salt=crypto.randomBytes(16).toString('hex');
            const hash=(await derive(password,salt)).toString('hex');
            try{insert.run(id,salt,hash,now);}catch(e){if(accounts.get(id))throw error(409,'ID นี้ถูกใช้งานแล้ว');throw e;}
            return json(res,201,{ok:true});
          }
          const account=accounts.get(id);
          const actual=await derive(password,account?.salt||'00000000000000000000000000000000');
          const expected=Buffer.from(account?.password_hash||'00'.repeat(64),'hex');
          if(!crypto.timingSafeEqual(actual,expected)||!account)throw error(401,'ID หรือ Password ไม่ถูกต้อง');
          const token=crypto.randomBytes(32).toString('hex');
          const previous=cookieToken(req);if(previous)dropSession.run(hashToken(previous));
          addSession.run(hashToken(token),account.id,now+SESSION_MS);
          res.setHeader('Set-Cookie',setCookie(token,SESSION_MS/1000));
          return json(res,200,{id:account.id});
        }finally{inFlight--;}
      }
      if(req.method==='GET'||req.method==='HEAD'){
        if(p==='/'||p==='/index.html'){if(current(req))return redirect(res,'/game');return serve(req,res,'index.html','text/html; charset=utf-8');}
        if(p==='/game'||p==='/game.html'){if(!current(req))return redirect(res,'/');return serve(req,res,'game.html','text/html; charset=utf-8');}
        if(STATIC.has(p))return serve(req,res,p.slice(1),STATIC.get(p));
      }
      return json(res,404,{message:'ไม่พบหน้า'});
    }catch(e){if(res.headersSent){res.destroy();return;}if(!e.status)console.error('Request failed:',e.code||e.name);json(res,e.status||500,{message:e.status?e.message:'เซิร์ฟเวอร์ขัดข้อง'});}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  server.on('close',()=>{clearInterval(cleanup);db.close();});
  return server;
}
if(require.main===module){
  const port=Number(process.env.PORT||8080);
  createServer().listen(port,'0.0.0.0',()=>console.log('FEED DAYS listening on '+port));
}
module.exports={createServer};
