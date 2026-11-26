import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import pg from 'pg';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const db=new pg.Pool({max:5});
await db.query(`
CREATE TABLE IF NOT EXISTS users(id uuid PRIMARY KEY,email text UNIQUE NOT NULL,password text NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token text PRIMARY KEY,user_id uuid REFERENCES users ON DELETE CASCADE,expires timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(user_id uuid REFERENCES users ON DELETE CASCADE,id uuid NOT NULL,payload jsonb NOT NULL,completed_at timestamptz NOT NULL,PRIMARY KEY(user_id,id));
CREATE TABLE IF NOT EXISTS drafts(user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,payload jsonb NOT NULL);
`);
const app=express();
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],upgradeInsecureRequests:null}},strictTransportSecurity:false,crossOriginOpenerPolicy:false}));
app.use(express.json({limit:'256kb'}));
app.use('/api', (req,res,next)=>{
 res.set('Cache-Control','no-store');
 if(!['GET','HEAD'].includes(req.method)&&(!req.is('application/json')||req.get('sec-fetch-site')==='cross-site'))return res.status(403).json({error:'Solicitud rechazada'});
 next();
});
const hash=t=>createHash('sha256').update(t).digest('hex');
const token=req=>req.headers.cookie?.match(/(?:^|;\s*)prep_session=([a-f0-9]{64})(?:;|$)/)?.[1];
const auth=async(req,res,next)=>{
 const t=token(req);
 if(!t)return res.status(401).json({error:'Sin sesión'});
 const {rows}=await db.query('SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires>now()',[hash(t)]);
 if(!rows.length)return res.status(401).json({error:'Sin sesión'});
 req.user=rows[0];next();
};
const limiter=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:true,legacyHeaders:false,message:{error:'Demasiados intentos. Intenta más tarde.'}});
const credentials=req=>{
 const email=String(req.body?.email||'').trim().toLowerCase(),password=req.body?.password;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<8||password.length>128)return null;
 return {email,password};
};
async function session(res,user){
 const t=randomBytes(32).toString('hex');
 await db.query("INSERT INTO sessions VALUES($1,$2,now()+interval '7 days')",[hash(t),user.id]);
 res.cookie('prep_session',t,{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',maxAge:604800000,path:'/'});
 res.json({session:true,user:{id:user.id,email:user.email}});
}
app.post('/api/signup',limiter,async(req,res)=>{
 const c=credentials(req);if(!c)return res.status(400).json({error:'Correo o contraseña inválidos'});
 const salt=randomBytes(16).toString('hex'),p=salt+':'+scryptSync(c.password,salt,64).toString('hex');
 const {rows}=await db.query('INSERT INTO users VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING RETURNING id,email',[randomUUID(),c.email,p]);
 if(!rows.length)return res.status(409).json({error:'No se pudo crear la cuenta'});
 await session(res,rows[0]);
});
app.post('/api/login',limiter,async(req,res)=>{
 const c=credentials(req);if(!c)return res.status(401).json({error:'Credenciales incorrectas'});
 const {rows}=await db.query('SELECT * FROM users WHERE email=$1',[c.email]);
 const u=rows[0], [salt,digest]=(u?.password||'00000000000000000000000000000000:'+ '00'.repeat(64)).split(':');
 const valid=timingSafeEqual(scryptSync(c.password,salt,64),Buffer.from(digest,'hex'));
 if(!u||!valid)return res.status(401).json({error:'Credenciales incorrectas'});
 await session(res,u);
});
app.get('/api/me',auth,(req,res)=>res.json(req.user));
app.post('/api/logout',async(req,res)=>{const t=token(req);if(t)await db.query('DELETE FROM sessions WHERE token=$1',[hash(t)]);res.clearCookie('prep_session',{path:'/'});res.json({ok:true})});
app.get('/api/attempts',auth,async(req,res)=>{const {rows}=await db.query('SELECT payload FROM attempts WHERE user_id=$1 ORDER BY completed_at DESC LIMIT 200',[req.user.id]);res.json(rows.map(r=>r.payload))});
app.post('/api/attempts',auth,async(req,res)=>{
 const p=req.body;
 if(!p||!Number.isInteger(p.score)||p.score<0||p.score>100||typeof p.id!=='string'||!Number.isFinite(Date.parse(p.completed_at)))return res.status(400).json({error:'Resultado inválido'});
 await db.query('INSERT INTO attempts VALUES($1,$2,$3,$4) ON CONFLICT(user_id,id) DO UPDATE SET payload=excluded.payload,completed_at=excluded.completed_at',[req.user.id,p.id,JSON.stringify(p),p.completed_at]);res.json({ok:true});
});
app.get('/api/draft',auth,async(req,res)=>{const {rows}=await db.query('SELECT payload FROM drafts WHERE user_id=$1',[req.user.id]);res.json(rows[0]?.payload||null)});
app.put('/api/draft',auth,async(req,res)=>{if(!Array.isArray(req.body?.items))return res.status(400).json({error:'Borrador inválido'});await db.query('INSERT INTO drafts VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload',[req.user.id,JSON.stringify(req.body)]);res.json({ok:true})});
app.delete('/api/draft',auth,async(req,res)=>{await db.query('DELETE FROM drafts WHERE user_id=$1',[req.user.id]);res.json({ok:true})});
app.get('/health',async(req,res)=>{await db.query('SELECT 1');res.json({ok:true})});
app.use('/src',express.static('/app/src'));
app.get('/styles.css',(req,res)=>res.sendFile('/app/styles.css'));
app.get('/',(req,res)=>res.sendFile('/app/index.html'));
app.use((err,req,res,next)=>{console.error(err.message);res.status(500).json({error:'Error interno'})});
app.listen(Number(process.env.PORT||3000),'0.0.0.0');
