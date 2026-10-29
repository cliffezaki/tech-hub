/** Licensed illustrative photos, applied only to unchanged sample covers. */
const photos = {
    office: {author:"Edmond Dantès",id:8068220,alt:"People using laptops in a shared workspace"},
    network: {author:"Brett Sayles",id:2881233,alt:"Network cables connected to server equipment"},
    security: {author:"cottonbro studio",id:5483248,alt:"Laptop displaying the words Cyber Security"},
    android: {author:"Andrey Matveev",id:22604142,alt:"Samsung Android phone with its settings screen and quick start guide"},
    iphone: {author:"Ahmed Manna",id:17753940,alt:"An iPhone beside a keyboard on a desk"},
} as const
const covers:Record<string,keyof typeof photos> = {
    "firefox-two-week-release-cycle":"office",
    "kenya-connectivity-report-beyond-headline-numbers":"network",
    "libreoffice-26-8-1-compatibility-download-caveat":"office",
    "ubuntu-26-04-lts-maintenance-lens":"network",
    "windows-10-consumer-security-extensions-2027":"security",
    "firefox-privacy-tools-desk-review":"security",
    "libreoffice-offline-first-desk-review":"office",
    "signal-privacy-promise-desk-review":"security",
    "google-two-step-verification-recovery-guide":"security",
    "android-backup-check-coverage":"android",
    "iphone-icloud-backup-completion-guide":"iphone",
    "dns-lookup-before-website-loads":"network",
    "passkeys-public-key-authentication-explained":"security",
    "https-connection-not-trustworthiness":"security",
    "kenya-internet-exchange-local-peering":"network",
    "ke-domain-registration-and-control":"network",
    "kenya-online-forms-personal-data-questions":"security",
}
export function demoPhoto(raw:Record<string,unknown>) {
    if(raw.demo!==true || !String(raw.imageCredit||"").includes("original editorial illustration")) return undefined
    const key = covers[String(raw.slug)]
    if(!key) return undefined
    const photo=photos[key]
    return {imageUrl:`/images/editorial/${key}.jpg`,imageAlt:photo.alt,imageCredit:`Illustrative photo: ${photo.author} / Pexels (Pexels License). Source: https://www.pexels.com/photo/${photo.id}/`}
}
