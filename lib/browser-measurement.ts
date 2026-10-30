/** A first-party random browser reference, renewed after 30 days, with no fingerprinting. */
export const BROWSER_KEY = "techhub-measurement-v2"
export function browserReference(storage:Pick<Storage,"getItem"|"setItem"|"removeItem">, now=Date.now(), uuid=()=>crypto.randomUUID()):string|undefined {
    try {
        let stored:{id?:string;expires?:number}={}
        try { stored=JSON.parse(storage.getItem(BROWSER_KEY)||"{}") } catch { /* replace corrupt storage */ }
        if(typeof stored.id==="string"&&/^[a-f0-9-]{36}$/i.test(stored.id)&&typeof stored.expires==="number"&&stored.expires>now&&stored.expires<=now+30*86400000)return stored.id
        const id=uuid();storage.setItem(BROWSER_KEY,JSON.stringify({id,expires:now+30*86400000}));return id
    } catch { return undefined }
}
