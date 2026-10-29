"use client"
import {useState} from "react"
import Link from "next/link"
import type {User} from "@/lib/permissions"
import styles from "./account.module.css"
type Account=Omit<User,"passwordHash">
export function AccountSettings({user,staff,onSaved}:{user:Account;staff:boolean;onSaved:(user:Account)=>void}){
 const [security,setSecurity]=useState(false),[busy,setBusy]=useState(""),[notice,setNotice]=useState({section:"",text:"",error:false})
 async function save(event:React.FormEvent<HTMLFormElement>,section:string){
  event.preventDefault();if(busy)return
  const form=event.currentTarget,data=new FormData(form);setBusy(section);setNotice({section,text:"",error:false})
  try{
   if(section==="security"&&data.get("password")!==data.get("confirmPassword"))throw Error("Passwords do not match.")
   const body=section==="newsletter"?{subscribed:data.get("subscribed")==="on"}:Object.fromEntries(data)
   const response=await fetch("/api/auth/profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
   const result=await response.json();if(!response.ok)throw Error(result.error||"Could not save changes.")
   onSaved(result.user);setNotice({section,text:section==="security"?"Password updated. Other sessions have been signed out.":section==="newsletter"?"Newsletter preference saved.":"Profile updated.",error:false})
   if(section==="security"){form.reset();setSecurity(false)}
  }catch(error){setNotice({section,text:error instanceof Error?error.message:"Could not save changes.",error:true})}finally{setBusy("")}
 }
 const feedback=(section:string)=>notice.section===section&&notice.text?<p role={notice.error?"alert":"status"} className={styles.feedback}>{notice.text}</p>:null
 return <div className={`${styles.account} ${styles.settings}`}><header className={styles.identity}><span className={styles.avatar} aria-hidden="true">{user.name.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span><div><h1>{user.name}</h1><p>{user.email}</p><span className={styles.role}>{user.role}</span></div></header>
 {staff&&<Link href="/admin" className={`${styles.primary} ${styles.dashboardLink}`}>Open Publishing Dashboard <span aria-hidden="true">→</span></Link>}
 <section className={styles.section}><h2>Profile Settings</h2><form onSubmit={e=>save(e,"profile")} className={styles.settingsForm}><label>Name<input name="name" defaultValue={user.name} maxLength={100} required autoComplete="name" /></label><label>Email address<input value={user.email} readOnly type="email" aria-describedby="email-help" /></label><p id="email-help" className={styles.help}>Your sign-in email is fixed. Email changes are not currently supported.</p><button className={styles.secondary} disabled={!!busy}>{busy==="profile"?"Saving…":"Save Changes"}</button>{feedback("profile")}</form></section>
 <section id="security" className={styles.section}><div className={styles.sectionHeading}><div><h2>Security</h2><p className={styles.help}>Manage your password securely.</p></div><button className={styles.secondary} aria-expanded={security} aria-controls="password-fields" onClick={()=>setSecurity(!security)}>{security?"Cancel":"Change Password"}</button></div>{security&&<form id="password-fields" className={styles.settingsForm} onSubmit={e=>save(e,"security")}><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /></label><p className={styles.help}>Use at least 12 characters. Changing your password signs out other sessions.</p><button className={styles.secondary} disabled={!!busy}>{busy==="security"?"Updating…":"Update Password"}</button></form>}{feedback("security")}</section>
 <section className={styles.section}><h2>Newsletter Preferences</h2><form onSubmit={e=>save(e,"newsletter")} className={styles.settingsForm}><label className={styles.checkbox}><input key={String(user.subscribed)} type="checkbox" name="subscribed" defaultChecked={user.subscribed} />Receive Tech Hub email updates</label><button className={styles.secondary} disabled={!!busy}>{busy==="newsletter"?"Saving…":"Save Preference"}</button>{feedback("newsletter")}</form></section>
 <section className={styles.actions}><h2>Account Actions</h2><button className={styles.secondary} disabled={!!busy} onClick={async()=>{setBusy("logout");try{const r=await fetch("/api/auth/logout",{method:"POST"});if(!r.ok)throw Error();location.assign("/account")}catch{setBusy("");setNotice({section:"logout",text:"Could not log out. Please try again.",error:true})}}}>{busy==="logout"?"Logging out…":"Log Out"}</button>{feedback("logout")}</section></div>
}
