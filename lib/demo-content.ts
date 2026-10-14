import type { ArticleSection } from "@/lib/types"
import type { ArtworkKind, DiagramKind } from "@/lib/demo-artwork"

export const DEMO_BATCH = "techhub-researched-2026-10-06"
export const DEMO_AUTHOR = "Tech Hub Demo Desk"
export interface DemoStory {
    title: string
    slug: string
    excerpt: string
    section: ArticleSection
    category: string
    artwork: ArtworkKind
    featured?: boolean
    diagram?: DiagramKind
    diagramAlt?: string
    content: string
}

// Original editorial samples researched against the linked primary sources on 6 October 2026.
// Event dates are stated in the body; publication dates are the actual time of seeding.
// Reviews are desk assessments, never invented hands-on tests or benchmark results.
export const DEMO_STORIES: DemoStory[] = [
    {
        title: "Firefox has moved to a two-week release cycle. Here’s what that means",
        slug: "firefox-two-week-release-cycle",
        excerpt: "Mozilla’s faster schedule brings completed fixes to users sooner—not a promise of twice as many features.",
        section: "news", category: "Browsers", artwork: "browser", featured: true,
        content: `Mozilla announced on 19 August 2026 that Firefox would move from a four-week release rhythm to a two-week cycle. Firefox 155 arrived on 1 September, starting that transition. This is a change to delivery timing, rather than a claim that every update contains a dramatic redesign. [Mozilla’s announcement](https://blog.mozilla.org/sumo/2026/08/19/firefox-new-release-cadence-and-what-to-expect/) explains the distinction.

## Smaller steps, more often

Mozilla says the aim is to ship completed work and bug fixes sooner, with a more predictable schedule. The release number alone therefore becomes a less useful guide to how much has changed. For readers, the sensible habit is to look at the notes and keep updates enabled, rather than wait for a headline feature before installing.

Firefox 155’s [release notes](https://www.firefox.com/en-US/firefox/155.0/releasenotes/) include fixes for Linux web-app typing, background audio playback and tab-interface problems. Some new features are marked as progressive rollouts: two people on the same version may not see identical options immediately.

## What to watch in your own browser

Our editorial takeaway is that a faster release train makes a short, repeatable check more valuable. After an update, try the sites you depend on, confirm your important extensions still behave as expected, and distinguish an actual regression from a gradual feature rollout.

For a small organisation, keep a simple record of the browser version involved when a problem is reported. A useful report describes the task that failed and the expected result; “the browser updated” is a starting point, not a diagnosis.

## The wider lesson

Software maintenance is often invisible when it succeeds. This change is a reminder to judge a browser by reliable everyday behaviour, not just launch-day novelty. This sample explains the September transition; it does not claim Firefox 155 is the newest version today.`,
    },
    {
        title: "Kenya’s latest connectivity report needs more than a headline number",
        slug: "kenya-connectivity-report-beyond-headline-numbers",
        excerpt: "The April–June 2026 sector report offers a useful snapshot—but subscriptions and people are not the same measure.",
        section: "news", category: "Connectivity", artwork: "network",
        content: `The Communications Authority of Kenya lists its fourth-quarter 2025–2026 sector report as the latest report on its statistics page at the time of this sample’s research. It covers April–June 2026, not live conditions in October. The Authority compiles these reports from service providers’ returns. [CA’s statistics page](https://www.ca.go.ke/node/270) also explains the limits of that reporting process.

## Start with the unit

The [quarterly report](https://www.ca.go.ke/sites/default/files/2026-09/Sector%20Statistics%20Report%20Q4%202025-2026_0.pdf) separates mobile subscriptions, mobile data, mobile money, devices and fixed Internet services. Those categories answer different questions. A subscription count is not a count of distinct people, and a registered connection is not proof that someone can afford to use it meaningfully every day.

## Three questions for a better reading

First, what period does a figure describe? Compare a quarter with the previous quarter only when that is the comparison the table actually makes. Second, what does the indicator count? Keep SIMs, devices and individuals separate. Third, what is missing? A national aggregate cannot describe the experience of every home, school or business.

Our interpretation is that these questions are more useful than treating one impressive total as a complete verdict on digital inclusion. They turn a report into a starting point for more precise reporting.

## From numbers to everyday experience

A future Tech Hub field report could pair the official baseline with clearly documented local observations: the location, network, time, device and task involved. That would help distinguish coverage, price and reliability instead of blending them into a single claim.

This article does not invent interviews, speed measurements or new statistics. Its purpose is to show how a publication can explain a real regulator’s report without overstating what the underlying data proves.`,
    },
    {
        title: "LibreOffice 26.8.1 targets compatibility fixes, with a download-delay caveat",
        slug: "libreoffice-26-8-1-compatibility-download-caveat",
        excerpt: "The 2 October announcement includes an important update: download-mirror issues delayed the release.",
        section: "news", category: "Open Source", artwork: "documents",
        content: `The Document Foundation announced LibreOffice 26.8.1 on 2 October 2026, describing roughly 40 fixes, including improvements to Microsoft Office document handling. However, the [official announcement](https://blog.documentfoundation.org/blog/2026/10/02/libreoffice-26-8-1/) also carries an update saying download-mirror issues delayed the release and that the download page was again offering 26.8.0. That qualification matters as much as the version number.

## What the announcement describes

The stated fixes cover areas including DOCX formatting, XLSX objects and ranges, and a PPTX-opening problem. The Foundation also highlights text and CSV import across several character encodings. These are vendor-described changes, not results from a Tech Hub test.

The broader [26.8 release announcement](https://blog.documentfoundation.org/blog/2026/08/26/libreoffice-26-8/) puts document interoperability and writing-system support in context. A maintenance release builds on that base; it does not remove the need to check the particular files a team exchanges.

## Availability is a separate question

Our editorial reading is straightforward: an announced update and an obtainable installer are not always the same thing. Check the project’s current download and status pages before planning an installation. Do not substitute a third-party installer simply because a version mentioned in a headline is temporarily unavailable.

## A practical compatibility check

Before changing an office suite across a team, gather a small set of documents that represent actual work: a letter, a spreadsheet with formulas, and a presentation with embedded objects. Open copies, inspect the layout, and compare the exported result.

That exercise is a proposed evaluation method, not a claim that we performed it. This sample deliberately preserves the delay notice found during research on 6 October, rather than describing availability as settled. Release status can change after publication; the linked official announcement remains the place to check.`,
    },
    {
        title: "Ubuntu 26.04 LTS: the April release through a maintenance lens",
        slug: "ubuntu-26-04-lts-maintenance-lens",
        excerpt: "Canonical’s long-term-support release is best assessed against the software and hardware you actually need.",
        section: "news", category: "Open Source", artwork: "computer",
        content: `Canonical released Ubuntu 26.04 LTS, named Resolute Raccoon, on 23 April 2026. This is a retrospective explainer of that release, not a claim of a new October launch. The [official release announcement](https://canonical.com/blog/canonical-releases-ubuntu-26-04-lts-resolute-raccoon) describes a move to a Wayland-based desktop, updated developer tools and a more unified App Center experience.

## Support is part of the product

An operating system is more than the screen that appears after installation. For a student, developer or small business, the important questions also include how updates arrive, which applications are supported and how a problem can be reproduced.

Our assessment framework starts with the workload rather than the logo. List the browser, office files, printer, conferencing tools and specialist software you cannot do without. A new operating system only becomes a useful replacement when that list has a credible answer.

## Test before you replace

Treat an upgrade as a planned change. Keep an independent copy of important files and know how you would return to a working setup. A successful boot is only the beginning: wireless networking, audio, external displays and peripherals deserve their own check.

This article proposes those checks; it does not present compatibility tests on particular laptops. Hardware support differs, and a manufacturer's or distribution's documentation should be consulted for the exact model involved.

## A calmer way to compare platforms

For Tech Hub readers, the useful comparison is not “Linux versus everything else” in the abstract. It is whether a supported platform lets you complete your own tasks with acceptable effort.

The April announcement provides a factual starting point. A purchase or migration decision needs the extra evidence of a realistic trial, current requirements and an agreed recovery plan. No speed, battery-life or gaming results are claimed here.`,
    },
    {
        title: "Windows 10 security extensions now run to October 2027: check your eligibility",
        slug: "windows-10-consumer-security-extensions-2027",
        excerpt: "Microsoft’s current consumer ESU page lists 12 October 2027, but the programme is not full product support.",
        section: "news", category: "Security", artwork: "lock",
        content: `Microsoft’s current consumer Extended Security Updates page says eligible Windows 10 devices can receive ESU coverage through 12 October 2027. Already enrolled consumer devices continue through that date automatically, according to the [official programme page](https://www.microsoft.com/en-us/windows/extended-security-updates). This sample was checked on 6 October 2026; older articles may still cite a different end date.

## What ESU actually provides

Microsoft describes ESU as critical and important security updates for eligible Windows 10 version 22H2 devices. It is not a return to feature development, general fixes or technical support. Its prerequisites and exclusions also matter: the consumer programme is not the commercial programme.

Microsoft’s [end-of-support explainer](https://support.microsoft.com/en-us/windows/deployment/updates-lifecycle/windows-10-support-has-ended-on-october-14-2025) records the ordinary Windows 10 support deadline as 14 October 2025. Specialised editions can have their own lifecycles; a familiar desktop appearance is not enough to identify a machine’s support status.

## Check the device, not just the headline

Our editorial recommendation is to write down the installed edition and version, then follow Microsoft’s current eligibility instructions. Confirm the device is receiving updates rather than assume a date in an article proves enrolment.

A work-managed computer should be checked with the organisation’s administrator. A personal computer should be evaluated against the consumer rules, including account and update requirements. Do not buy an upgrade, licence or replacement solely from this sample’s headline.

## Use the extra time deliberately

An extension is most useful when it creates room for a tested migration. Make an inventory of essential applications, back up important data and identify a supported destination.

That is our interpretation of how to use the programme responsibly. We are not claiming that every Windows 10 PC qualifies, or that ESU makes every possible threat disappear.`,
    },
    {
        title: "Firefox privacy tools: a desk review of useful defaults and real trade-offs",
        slug: "firefox-privacy-tools-desk-review",
        excerpt: "Built-in tracking controls are valuable, but stronger settings can also change how websites behave.",
        section: "reviews", category: "Browsers", artwork: "browser", featured: true,
        content: `Research-based review: this assessment uses Mozilla’s documentation, not a hands-on benchmark. It evaluates the design and trade-offs of Firefox’s privacy controls without inventing battery, speed or tracking measurements.

## The strongest idea: a useful default

Mozilla says Standard Enhanced Tracking Protection is enabled by default. It blocks several categories of trackers and includes Total Cookie Protection, which separates cookies by site. [Mozilla’s protection guide](https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop) explains what Standard, Strict and Custom modes do.

Our view is that a protective default is a better starting point than a long checklist users must discover themselves. A visible shield panel is also useful because it makes at least part of the browser’s behaviour inspectable rather than mysterious.

## The trade-off to understand

Stricter settings can affect embedded content and other site functions. Blocking something may change a page, and a changed page does not automatically mean the browser is faulty. Mozilla documents both those limitations and site-specific exceptions.

The editorial test we would apply is whether readers can understand the problem, make a narrow choice and return to their preferred setting. Globally weakening protection to repair one page would be a poor default habit.

## Who should consider it?

Firefox is worth evaluating if visible control over tracking is an important part of your browsing routine. Start with your essential sites and extensions, not an empty browser window.

Our provisional verdict is that the documented controls offer a thoughtful balance between convenience and choice. That is a design assessment, not proof of complete anonymity. It says nothing about a particular reader’s device being secure, and it is not a comparative performance ranking.

## Before making it your main browser

Try a small set of real tasks and record any incompatibilities. Keep your old setup available until the new one meets those needs. The best browser for a workflow is the one whose benefits and compromises you actually understand.`,
    },
    {
        title: "LibreOffice for everyday work: the case for an offline-first office suite",
        slug: "libreoffice-offline-first-desk-review",
        excerpt: "A research-based assessment of local document work, open formats and the compatibility checks that still matter.",
        section: "reviews", category: "Productivity", artwork: "documents",
        content: `Research-based review: we have not run a document-compatibility lab or timed this software. This assessment considers the documented feature set and proposes a practical way to judge it for your own work.

## A suite, rather than one application

LibreOffice includes tools for documents, spreadsheets, presentations and more. Its [official website](https://www.libreoffice.org/) describes the free, open-source suite. The [26.8 announcement](https://blog.documentfoundation.org/blog/2026/08/26/libreoffice-26-8/) confirms Windows, macOS and Linux availability and explains its native use of OpenDocument Format alongside support for Microsoft Office formats.

Our editorial interpretation is that the appeal is strongest for people who want a local working environment and control over their files. That is a different proposition from choosing an office service chiefly for browser-based collaboration.

## Compatibility deserves its own trial

Format support should not be read as a guarantee that every complex document will look identical in every application. A sensible trial uses the files you already exchange, not a blank page.

Make copies of a representative letter, spreadsheet and slide deck. Inspect layout, formulas and embedded objects, then export and compare. Keep the originals untouched. These are proposed checks, not tests we claim to have completed.

## What a good decision looks like

For a student or small team, a useful evaluation asks who receives the finished files and which formats they expect. A PDF sent for reading is a different workflow from a spreadsheet sent for someone else to edit.

Our desk verdict is that LibreOffice deserves consideration for document work where a local suite and open formats fit the workflow. The choice becomes less straightforward when exact interoperability or a particular collaboration system is non-negotiable.

## Avoid the all-or-nothing framing

You do not have to replace every tool at once to evaluate one. Begin with a low-risk task, record the result and decide from that evidence. No unsupported claim of universal compatibility, lower memory use or better performance is made here.`,
    },
    {
        title: "Signal’s privacy promise—and the part no messenger can do for you",
        slug: "signal-privacy-promise-desk-review",
        excerpt: "Encrypted conversations are valuable, but recipients, devices and account habits remain part of the picture.",
        section: "reviews", category: "Privacy", artwork: "privacy",
        content: `Research-based review: this article assesses Signal’s documented approach. It does not claim an independent security audit, a lab comparison with other messengers or a hands-on test of every feature.

## Privacy as the normal mode

Signal describes end-to-end encryption for its messages and calls, rather than an optional private-chat mode. Its [official overview](https://signal.org/) also lists text, media, group chats and voice and video calling. That makes the product’s central proposition easy to understand: private communication is part of ordinary use.

Our editorial view is that a clear default reduces the number of decisions people have to get right before a conversation begins. It does not remove the need to decide whom to include in that conversation.

## A messenger is not the whole security boundary

Encryption in transit does not stop a recipient from showing a message to someone else or prevent an unlocked device from exposing a conversation. Signal’s [account-protection guidance](https://support.signal.org/hc/en-us/articles/9932632052378-How-to-protect-yourself-on-Signal) emphasises habits such as checking linked devices and not giving away verification codes.

For a reader evaluating the app, those operational details deserve as much attention as a cryptographic description. The most elegant feature is not helpful if the account is being used on a device you no longer control.

## The practical adoption question

A communication tool is only useful when the people you need to reach will use it. Start with a small, willing group and agree what belongs in the chat. Do not treat a messaging app as an archive, a document-management system or automatic permission to share sensitive material.

Our desk verdict is positive about the privacy-first design, while deliberately avoiding the claim that any application makes a conversation risk-free.

## How we would test further

A hands-on follow-up would document setup, accessibility, calls and recovery on named devices. Until then, this remains a transparent assessment of official documentation—not an invented real-world verdict.`,
    },
    {
        title: "Secure your Google account without losing your recovery route",
        slug: "google-two-step-verification-recovery-guide",
        excerpt: "Turn on stronger sign-in protection, then prepare a private backup method before you need it.",
        section: "how-to", category: "Security", artwork: "key", featured: true,
        content: `A stronger sign-in method and a usable recovery plan belong together. This guide is based on Google’s current account instructions; work and school accounts may have administrator-controlled options.

## 1. Open the real account settings

Go directly to your [Google Account](https://myaccount.google.com/) rather than follow an unexpected message. Open Security & sign-in, find the sign-in section and follow the instructions to turn on 2-Step Verification. [Google’s setup guide](https://support.google.com/accounts/answer/185839?hl=en) explains the available methods, including passkeys and other second steps.

Pause if a prompt describes a sign-in you did not initiate. The goal is to protect your account, not approve every request that appears.

## 2. Prepare for a lost phone

Where available, create backup codes in the 2-Step Verification settings. [Google’s backup-code guide](https://support.google.com/accounts/answer/1187538?hl=en) says each code is usable once and a newly generated set invalidates the old set. Store them privately somewhere you can reach without the phone you are trying to recover. Some account protection programmes do not offer downloadable codes.

Do not paste codes into support chats, shared documents or screenshots. Someone asking you to send them a code is not completing this setup for you.

## 3. Check the plan, without locking yourself out

Before signing out everywhere, make sure you know which recovery methods are configured and where the backup is stored. Our practical suggestion is to write a short private checklist describing the method—not the secret itself.

## 4. Keep the account useful

Revisit that checklist when you change a phone, number or key. A backup method that depended on an old device may not be a meaningful backup anymore.

These steps improve preparedness; they do not promise account recovery in every possible situation. Keep passwords and recovery codes private, and use Google's official recovery instructions if access is already lost.`,
    },
    {
        title: "Back up an Android phone—and check what the backup actually covers",
        slug: "android-backup-check-coverage",
        excerpt: "A backup switch is a start. The useful check is which account, which data and when the last backup completed.",
        section: "how-to", category: "Mobile", artwork: "phone", diagram: "backup",
        diagramAlt: "Backup checklist: choose an account, start a backup, check completion and preserve recovery access",
        content: `A phone backup should be something you can explain, not a setting you vaguely remember enabling. This guide follows [Google’s Android backup instructions](https://support.google.com/android/answer/2819582?hl=en). Menu names may differ with the manufacturer and software version.

## 1. Confirm the destination

Open Settings, then Google and All services. Under Backup and restore, open Backup. Check which Google Account is selected before you start. A backup associated with an account you cannot access is not a reliable recovery plan.

## 2. Start a fresh backup

Use Back up now in the backup settings. Google says a Google One backup can take up to 24 hours. Do not interpret tapping the button as proof that everything has finished uploading.

## 3. Read the coverage

Google notes that not every application can back up or restore all its data and settings. Its guide separately points readers to photo, video and file-backup instructions. Check important apps individually, especially when they have their own export or recovery process.

{{diagram}}

## 4. Make a small inventory

Our recommended checklist has four lines: contacts, photos, documents and essential apps. For each, note where a recoverable copy lives and which account is needed to reach it. Do not include passwords in a shared checklist.

Check the reported backup status and date, then keep independent copies of irreplaceable files where appropriate. This is a proposed precaution, not a claim that Tech Hub has restored your device.

## Before replacing or erasing a phone

Do not erase the old phone merely because a backup setting is on. Confirm completion and understand the restore process first. Google also warns that a backup from a higher Android version cannot be restored to a lower one.

The simplest definition of a useful backup is a copy you can actually recover. A little checking now is easier than discovering a missing category after the original device is gone.`,
    },
    {
        title: "An iPhone backup is worth checking before you need it",
        slug: "iphone-icloud-backup-completion-guide",
        excerpt: "Use Apple’s backup settings, confirm completion and distinguish a saved copy from an assumption.",
        section: "how-to", category: "Mobile", artwork: "phone",
        content: `Apple offers manual and automatic iCloud Backup. The important part is not just enabling it, but checking that a recent backup completed. This guide follows [Apple’s current iCloud Backup instructions](https://support.apple.com/en-us/108366), rather than a fabricated screenshot walkthrough.

## 1. Start a manual backup

Connect to Wi-Fi. In Settings, tap your name, then iCloud and iCloud Backup. Choose Back Up Now and keep the device connected until the process finishes.

Apple says the date and time of the last backup appear under that control. Read the result; a started upload and a completed backup are different states.

## 2. Understand automatic backups

Apple’s instructions say to enable Back Up This Device, connect it to power and Wi-Fi, and keep the screen locked. Insufficient storage can stop the process. Treat any storage alert as an unresolved problem, not a harmless notification.

## 3. Keep the recovery account accessible

Our editorial suggestion is to keep a private record of which Apple Account owns the backup and which recovery methods are available. Do not store the only copy of that information on the phone you may need to replace.

## 4. Identify separate requirements

Before a device change, list the applications and files that matter most. Review their own documentation if they have a separate transfer or recovery process. A general backup guide should not be read as a promise that every app will restore exactly as expected.

## A useful final check

Confirm the latest successful backup time, resolve outstanding storage errors, and keep the old device intact until your replacement is working. Do not reset or erase a device just to test this sample guide.

The purpose here is a calm, repeatable preparation routine. Tech Hub has not inspected your backup and cannot verify its contents from a setting on this website.`,
    },
    {
        title: "DNS: the quiet lookup that happens before a website appears",
        slug: "dns-lookup-before-website-loads",
        excerpt: "Names are for people; network addresses are for connections. DNS bridges the two.",
        section: "how-stuff-works", category: "Internet", artwork: "network", featured: true,
        diagram: "dns", diagramAlt: "Simplified sequence from a domain name to a resolver, DNS answer and web server",
        content: `Typing a domain name is not the same as connecting to its server. The Domain Name System, or DNS, helps turn a readable name into the addressing information a device needs. [Cloudflare’s DNS overview](https://www.cloudflare.com/learning/dns/what-is-dns/) describes the roles involved.

## The resolver does the looking

Your device typically asks a recursive resolver for an answer. If it does not already have a suitable cached answer, the resolver can follow referrals through root and top-level-domain nameservers to an authoritative server holding the relevant records.

This is a distributed lookup system, not one master spreadsheet containing every website.

{{diagram}}

## Why an old answer can persist

DNS answers can be cached. A time-to-live value limits how long an answer should be reused before another lookup. That helps explain why changing a website’s records does not necessarily make every device see the change at the same instant.

The diagram is deliberately simplified: a cached answer can skip parts of the journey, and real sites can use additional records and aliases.

## A name is not the webpage

DNS helps locate a service; it does not itself deliver the page or prove the page’s claims are trustworthy. The web connection and the application behind it are separate parts of the chain.

Our useful mental model is to separate three questions: did the name resolve, could the device connect, and did the application respond correctly? “The website is down” can describe a failure at any of those steps.

## What this means for readers

If one service fails while other sites work, collect the exact error before changing settings. If you manage a website, keep a record of deliberate DNS changes so a later failure can be checked against them.

This explanation does not recommend a particular DNS provider or promise that changing resolvers will repair every connectivity problem.`,
    },
    {
        title: "Passkeys explained: prove you have the key without sending it",
        slug: "passkeys-public-key-authentication-explained",
        excerpt: "Public-key authentication changes what a website stores—and what a fake sign-in page can ask you to reveal.",
        section: "how-stuff-works", category: "Security", artwork: "key",
        diagram: "passkey", diagramAlt: "Website challenge, device unlock, signed response and public-key verification",
        content: `A passkey is not simply a password replaced by a fingerprint. It is a sign-in credential built around public-key cryptography. The [FIDO Alliance’s overview](https://fidoalliance.org/passkeys/) explains the standards-based approach, while [MDN’s Web Authentication guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) describes the browser mechanism.

## Two parts, different jobs

At registration, a service receives a public key. The corresponding private key stays with the authenticator or supported credential system. At sign-in, the service sends a challenge and verifies a cryptographic response rather than asking for the private key.

Unlocking a device with a fingerprint, face scan or PIN can authorise that operation. The biometric is not the reusable secret that you type into a website.

{{diagram}}

## Why the website’s identity matters

WebAuthn credentials are scoped to a relying party, with origin checks in the browser’s authentication process. That binding makes passkeys resistant to the familiar attack in which a look-alike page persuades someone to type the same password they use on the real site.

Phishing resistance is a property of this sign-in process, not a promise that every account operation is immune to scams. Device access, recovery paths and the rest of the service still matter.

## Where recovery fits

Some credentials are device-bound; supported passkey systems can also offer synchronisation. Before relying on a method, read the provider’s documentation about replacing a device and regaining access.

Our editorial takeaway is to assess the whole journey: enrolment, ordinary sign-in, a lost-device scenario and removal of access you no longer need.

## The useful distinction

Passwords ask you to remember and transmit a secret. Passkeys let an authenticator prove possession of a key without handing that key to the website. That is the central change—not a guarantee that a reader can safely ignore every other account setting.`,
    },
    {
        title: "HTTPS protects the connection. It does not certify every claim on the page",
        slug: "https-connection-not-trustworthiness",
        excerpt: "An encrypted link and a trustworthy business are different things. Understanding the distinction helps you browse more carefully.",
        section: "how-stuff-works", category: "Security", artwork: "lock",
        diagram: "https", diagramAlt: "A browser and website communicate through a TLS-protected connection",
        content: `HTTPS is HTTP carried over a connection protected by Transport Layer Security, usually called TLS. It helps protect data moving between a browser and a website. [Cloudflare’s HTTPS explainer](https://www.cloudflare.com/learning/ssl/what-is-https/) describes that relationship.

## Protecting data on the journey

TLS provides encryption and connection-integrity protections, and certificates support server authentication. This is why a login form should not send a password over an unprotected HTTP connection.

The distinction is about the connection, not whether an article is accurate or a seller will deliver a product. A misleading website can still use HTTPS.

{{diagram}}

## A useful everyday example

Imagine receiving a link to a familiar-looking account page. Even when the connection is encrypted, the domain may belong to someone else. Encryption can protect traffic to the wrong destination perfectly well.

Our practical interpretation is that checking the address and knowing how you reached the page remain important. Connection security is one part of an assessment, not a replacement for it.

## What a warning should mean

If your browser presents a certificate or connection-security warning, stop and investigate through a known route. Do not treat instructions on the suspicious page as evidence that it is safe to ignore the warning.

For a site owner, the corresponding responsibility is to keep certificates and links working correctly, rather than ask visitors to make exceptions.

## Keep the layers separate

A domain name identifies the requested destination. TLS protects and authenticates the connection according to its certificate checks. The application then decides what to display and how to handle data.

That layered view explains why a secure connection is necessary for sensitive forms, but not sufficient to establish a website’s honesty. This sample is an educational explanation, not a security assessment of any particular website.`,
    },
    {
        title: "Why Kenya’s Internet exchange matters even when you never see it",
        slug: "kenya-internet-exchange-local-peering",
        excerpt: "Local traffic exchange is infrastructure behind the screen—not a faster-data button on your phone.",
        section: "tech-kenya", category: "Infrastructure", artwork: "network", featured: true,
        content: `The Kenya Internet Exchange Point, KIXP, is part of the infrastructure that connects networks, rather than a consumer application. [TESPOK](https://www.tespok.co.ke/) identifies management of KIXP among its responsibilities. The [Internet Society’s IXP overview](https://www.internetsociety.org/issues/ixps/) explains why local interconnection matters.

## Networks need somewhere to meet

An Internet exchange is a physical meeting point where participating networks exchange traffic. Local interconnection can avoid sending locally destined traffic along unnecessarily distant routes.

The benefit is an architectural possibility, not a guarantee that every request from every Kenyan device stays in Kenya. The networks involved, their agreements and the location of the content all matter.

## Why this belongs in a reader’s picture of connectivity

It is easy to think of Internet service only as a SIM card, router or monthly package. Behind that familiar purchase is a chain of networks, facilities and operational relationships.

Our editorial interpretation is that explaining this chain helps separate a local access problem from a broader routing or service problem. It also makes the work of infrastructure operators more visible without inventing claims about a reader’s connection.

## What we would measure in a field report

A proper performance story would specify the source network, destination service, measurement time and test method. It would not attribute every low-latency result—or every outage—to the exchange point.

This sample supplies no fabricated traffic volumes, membership counts, latency improvements or interviews. It explains the mechanism and points readers to the organisations directly involved.

## The larger question

Local hosting and interconnection can complement international connectivity. They are not substitutes for every submarine cable or distant service, but they are useful parts of a more resilient Internet ecosystem.

For Tech Hub, the reporting opportunity is to connect that invisible infrastructure with everyday tasks while being precise about what has actually been observed.`,
    },
    {
        title: "A .ke domain is a name to manage, not a website in a box",
        slug: "ke-domain-registration-and-control",
        excerpt: "Registration, hosting and email do different jobs. Start by keeping the registrant and renewal details under your control.",
        section: "tech-kenya", category: "Digital Business", artwork: "domain",
        content: `A domain name is one part of a website setup. KeNIC manages Kenya’s .ke namespace, and its [official FAQs](https://kenic.or.ke/faqs/) explain that registrations are handled through accredited registrars. The [KeNIC website](https://kenic.or.ke/) provides a route to that registrar information.

## Understand the roles

The registry manages the namespace. A registrar handles the registration relationship. The registrant is the person or organisation for whom the name is registered. KeNIC advises that a company’s domain should normally be registered in the company’s name when it is paying for the registration.

Our practical reading is that this is a control issue, not just a naming choice. A site can be beautifully designed and still be difficult to manage if someone else holds the only account needed to renew its domain.

## Renewal is part of ownership

KeNIC explains that registration has an initial term and needs renewal. Keep a record of the renewal date and confirm which email receives notices. Do not assume a developer’s invoice means the name stays active indefinitely.

## Separate the services before comparing offers

Ask a provider to distinguish domain registration, website hosting and email service. Those are different responsibilities even when one company supplies all three. Compare the ongoing terms, not just an introductory total.

This article does not name a cheapest registrar or quote unverified prices. Current fees and eligibility requirements should be checked with the relevant registrar and registry.

## A small handover checklist

For a new project, document who controls registration, DNS, hosting and backups. Make sure recovery details belong to the intended owner and that access changes are deliberate.

Our editorial takeaway is that a good domain decision leaves you able to maintain the site later. A memorable name is useful; a clear, recoverable management arrangement is what keeps that name useful.`,
    },
    {
        title: "Before an online form asks for your details, ask what it needs them for",
        slug: "kenya-online-forms-personal-data-questions",
        excerpt: "A practical privacy checklist for Kenyan readers, with the ODPC as the official starting point for concerns.",
        section: "tech-kenya", category: "Privacy", artwork: "privacy", featured: true,
        content: `A name, phone number, photograph or online identifier can be personal data. Kenya’s Office of the Data Protection Commissioner explains that personal information is not limited to a written identity document. Its [official FAQs](https://www.odpc.go.ke/faqs/) are a useful starting point for readers trying to understand the subject.

## Ask a more precise question

Instead of deciding only whether a form looks professional, ask which details are needed for the task and what explanation accompanies the request. Is the organisation named? Is there an understandable privacy notice? Is an optional field clearly marked as optional?

These are our suggested reading habits, not a finding that a particular organisation has broken the law.

## Separate a request from an obligation

A field appearing on a webpage does not explain, by itself, why that information is required. If a request seems disproportionate or unclear, pause and seek an explanation through an official contact route before submitting sensitive details.

Do not publish someone else’s documents in a public comment thread to make that point. A privacy concern should not create a second unnecessary disclosure.

## Keep a careful record of a concern

Our practical suggestion is to note the service, date and issue in plain language, keeping any relevant evidence private. Avoid collecting extra personal information that is unrelated to the concern.

The ODPC FAQ says complaints can be made through its website or by its published complaint email. Use [the official ODPC website](https://www.odpc.go.ke/) to confirm the current channel rather than trust an unsolicited message offering to file a complaint for a fee.

## Know the limit of this article

This is general educational information, not legal advice or a determination about an individual case. Actual rights, obligations and remedies depend on the circumstances and applicable law. For case-specific guidance, consult the regulator’s official resources or a qualified professional.`,
    },
]
