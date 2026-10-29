"use client"
import { useEffect, useState } from "react"
export function ArticleLike({articleId}:{articleId:string}) {
    const [count,setCount]=useState<number|null>(null)
    const [liked,setLiked]=useState(false)
    const [busy,setBusy]=useState(false)
    const [message,setMessage]=useState("")
    useEffect(()=>{let active=true;fetch(`/api/public/likes?articleId=${encodeURIComponent(articleId)}`,{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(active){setCount(d.count);setLiked(d.liked)}}).catch(()=>{if(active)setMessage("Likes temporarily unavailable.")});return()=>{active=false}},[articleId])
    return <div className="mt-6"><button type="button" className="rounded-full border px-4 py-2 text-sm disabled:opacity-60" aria-pressed={liked} disabled={busy||liked||count===null} onClick={async()=>{setBusy(true);try{const r=await fetch("/api/public/likes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({articleId})});const d=await r.json();if(!r.ok)throw Error(d.error);setCount(d.count);setLiked(true);setMessage("Thanks for liking this story.")}catch(e){setMessage(e instanceof Error?e.message:"Could not save your like.")}finally{setBusy(false)}}}>{liked?"♥ Liked":"♡ Like"}{count!==null?` · ${count}`:""}</button><p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p></div>
}
