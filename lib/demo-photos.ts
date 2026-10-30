/** Licensed illustrative photos, applied only to unchanged sample covers. */
const photos = {
    documents: {author:"Arina Krasnikova",id:5951326,alt:"Hands typing on a laptop beside a notepad and pen"},
    code: {author:"Pexels",id:6804613,alt:"Computer workstation with code displayed on its monitor"},
    browsing: {author:"cottonbro studio",id:5483149,alt:"Overhead view of hands using a laptop keyboard"},
    offline: {author:"Henri Mathieu-Saint-Laurent",id:8348970,alt:"Hands working on a laptop in a sunlit room"},
    messaging: {author:"Pexels",id:7120144,alt:"Person typing a message on a smartphone"},
    phoneLock: {author:"Pexels",id:11391947,alt:"Smartphone secured with a chain and padlock"},
    dns: {author:"Brett Sayles",id:1597776,alt:"Green network cables plugged into server ports"},
    login: {author:"Pexels",id:8247921,alt:"Close-up of a laptop showing a login interface"},
    https: {author:"cottonbro studio",id:5483240,alt:"Laptop displaying Cyber Security text in an office"},
    peering: {author:"Pexels",id:1624895,alt:"Fibre optic cables connected to equipment in a server room"},
    domain: {author:"Pexels",id:4716292,alt:"Blue network cables connected to server equipment"},
    forms: {author:"Vanessa Garcia",id:6325888,alt:"Close-up of a person typing on a laptop"},

    office: {author:"Edmond Dantès",id:8068220,alt:"People using laptops in a shared workspace"},
    network: {author:"Brett Sayles",id:2881233,alt:"Network cables connected to server equipment"},
    security: {author:"cottonbro studio",id:5483248,alt:"Laptop displaying the words Cyber Security"},
    android: {author:"Andrey Matveev",id:22604142,alt:"Samsung Android phone with its settings screen and quick start guide"},
    iphone: {author:"Ahmed Manna",id:17753940,alt:"An iPhone beside a keyboard on a desk"},
} as const
const covers:Record<string,keyof typeof photos> = {
    "firefox-two-week-release-cycle":"office",
    "kenya-connectivity-report-beyond-headline-numbers":"network",
    "libreoffice-26-8-1-compatibility-download-caveat":"documents",
    "ubuntu-26-04-lts-maintenance-lens":"code",
    "windows-10-consumer-security-extensions-2027":"security",
    "firefox-privacy-tools-desk-review":"browsing",
    "libreoffice-offline-first-desk-review":"offline",
    "signal-privacy-promise-desk-review":"messaging",
    "google-two-step-verification-recovery-guide":"phoneLock",
    "android-backup-check-coverage":"android",
    "iphone-icloud-backup-completion-guide":"iphone",
    "dns-lookup-before-website-loads":"dns",
    "passkeys-public-key-authentication-explained":"login",
    "https-connection-not-trustworthiness":"https",
    "kenya-internet-exchange-local-peering":"peering",
    "ke-domain-registration-and-control":"domain",
    "kenya-online-forms-personal-data-questions":"forms",
}
export function demoPhoto(raw:Record<string,unknown>) {
    if(raw.demo!==true || !String(raw.imageCredit||"").includes("original editorial illustration")) return undefined
    const key = covers[String(raw.slug)]
    if(!key) return undefined
    const photo=photos[key]
    return {imageUrl: ["office","network","security","android","iphone"].includes(key) ? `/images/editorial/${key}.jpg` : `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=1200`,imageAlt:photo.alt,imageCredit:`Illustrative photo: ${photo.author === "Pexels" ? "Pexels" : `${photo.author} / Pexels`} (Pexels License). Source: https://www.pexels.com/photo/${photo.id}/`}
}
