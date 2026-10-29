import {createHmac,randomUUID,timingSafeEqual} from "node:crypto"
function sign(value:string){const secret=process.env.ADMIN_SESSION_SECRET;if(!secret||secret.length<32)throw Error("Contact protection is not configured.");return createHmac("sha256",secret).update(`contact-form:${value}`).digest("hex")}
export function contactToken(now=Date.now()){const value=`${now}.${randomUUID()}`;return `${value}.${sign(value)}`}
export function validContactToken(token:unknown,now=Date.now()){
 if(typeof token!=="string"||token.length>180)return false
 const [time,nonce,signature]=token.split(".")
 if(!/^\d{13}$/.test(time||"")||! /^[a-f0-9-]{36}$/.test(nonce||"")||! /^[a-f0-9]{64}$/.test(signature||""))return false
 const age=now-Number(time);if(age<1500||age>7200000)return false
 return timingSafeEqual(Buffer.from(signature,"hex"),Buffer.from(sign(`${time}.${nonce}`),"hex"))
}
export function contactNetworkKey(request:Request){
 const ip=request.headers.get("x-nf-client-connection-ip")||request.headers.get("x-vercel-forwarded-for")||request.headers.get("x-forwarded-for")||"local"
 return sign(`abuse:${new Date().toISOString().slice(0,10)}:${ip.slice(0,200)}`)
}
