/* eslint-disable @next/next/no-img-element */
export function CountryFlag({code}:{code:string}) {
 if(!/^[A-Z]{2}$/.test(code))return null
 return <img src={`https://flagcdn.com/${code.toLowerCase()}.svg`} width={22} height={16} alt="" aria-hidden="true" loading="lazy" referrerPolicy="no-referrer" className="inline-block shrink-0 rounded-sm border object-cover" style={{width:22,height:16,marginRight:8}} onError={e=>{e.currentTarget.style.display="none"}} />
}
