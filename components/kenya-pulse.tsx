"use client"
import { useRef, useState } from "react"
import type { KenyaStory } from "@/lib/kenya-feed"
export function KenyaPulse({stories}:{stories:KenyaStory[]}) {
    const dialog=useRef<HTMLDialogElement>(null)
    const [story,setStory]=useState<KenyaStory>()
    return <><h2 className="mt-2 font-serif text-2xl font-bold">Kenya Tech Pulse</h2>
        <div className="mt-4 grid gap-x-6 md:grid-cols-2">{stories.map(item=><article key={item.id} className="border-t py-4">
            <button aria-haspopup="dialog" className="text-left font-serif text-xl font-bold hover:underline" onClick={()=>{setStory(item);dialog.current?.showModal()}}>{item.headline}</button>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        </article>)}</div>
        <dialog ref={dialog} aria-labelledby="kenya-briefing" className="fixed inset-0 m-auto max-h-[85dvh] w-[min(92vw,38rem)] overflow-auto rounded-xl border bg-card p-6 text-foreground shadow-xl backdrop:bg-black/60">
            <button autoFocus className="float-right ml-3 p-2" aria-label="Close briefing" onClick={()=>dialog.current?.close()}>✕</button>
            <p className="kicker text-brand-red">Kenya in Focus</p><h2 id="kenya-briefing" className="mt-2 font-serif text-2xl font-bold">{story?.headline}</h2>
            {story?.paragraphs.map((p,i)=><p key={i} className="mt-4 leading-relaxed">{p}</p>)}
        </dialog></>
}
