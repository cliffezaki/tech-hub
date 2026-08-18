/**
 * Starter content for a fresh Tech Hub install.
 *
 * Every article has its own image and its own body copy so the site looks like a real
 * publication before any of it is replaced through the dashboard. Bylines are fictional
 * staff names on purpose — never attribute demo stories to real journalists.
 */

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`

const IMAGES = {
    aiLetters: img("1677442136019-21780ecad995"),
    robot: img("1620712943543-bcc4688e7485"),
    cafeLaptop: img("1563986768609-322da13575f3"),
    codeEditor: img("1461749280684-dccba630e2f6"),
    earthAtNight: img("1451187580459-43490279c0fa"),
    powerLines: img("1473341304170-971dccb5ac1e"),
    deskWork: img("1454165804606-c3d57bc86b40"),
    handshake: img("1521791136064-7986c2920216"),
    processor: img("1591799264318-7e6ef8ddb7ea"),
    lab: img("1532187863486-abf9dbad1b69"),
    iphoneLaptop: img("1511707171634-5f897ff02aa9"),
    pixelSearch: img("1533228100845-08145b01de14"),
    samsungPurple: img("1610945265064-0e34e5519bbf"),
    darkPhone: img("1601784551446-20c9e07cdbdb"),
    iphoneAirpods: img("1592899677977-9c10ca588bbd"),
    phoneHomeScreen: img("1512941937669-90a1b58e7e9c"),
    cameraBacks: img("1574944985070-8f3ebc6b79d2"),
    pythonCode: img("1515879218367-8466d910aaa4"),
    padlock: img("1614064641938-3bbee52942c7"),
    engineerLab: img("1581091226825-a6a2a5aee158"),
    chipMacro: img("1550751827-4bd374c3f58b"),
    cardPayment: img("1556742049-0cfed4f6a45d"),
    savannah: img("1547471080-7cc2caa01a7e"),
    phoneOnDesk: img("1585060544812-6b45742d762f"),
    greenCode: img("1526374965328-7f61d4dc18c5"),
    laptopHelp: img("1516321318423-f06f85e504b3"),
    atmKeypad: img("1601597111158-2fceff292cdc"),
    solarPanels: img("1509391366360-2e959784a276"),
    dataCentre: img("1573164713988-8665fc963095"),
    serverRoom: img("1558494949-ef010cbdcc31"),
    officeWindow: img("1497215728101-856f4ea42174"),
    banknotes: img("1580048915913-4f8f5cb481c4"),
}

// Newest first; each entry is published a few hours before the one above it.
const START = Date.UTC(2026, 7, 18, 8, 0, 0)
const HOURS = 60 * 60 * 1000

export const demoArticles = [
    {
        id: "next-generation-generative-models",
        title: "The next generation of generative models is here",
        section: "news",
        category: "Artificial Intelligence",
        author: "Amara Njoroge",
        featured: true,
        imageUrl: IMAGES.aiLetters,
        imageAlt: "The letters A and I rendered in blue on a textured surface",
        imageCredit: "Unsplash",
        excerpt:
            "A new class of reasoning models is clearing benchmarks that stood for years — and changing what people expect software to do for them.",
        content: `The latest wave of frontier models is not simply larger than what came before. The interesting change is architectural: they spend more compute at the moment a question is asked rather than only during training, and that shift is showing up plainly in the results.

## What actually changed

For most of the last decade, progress came from scale. Bigger datasets, bigger clusters, bigger parameter counts. That approach has not stopped working, but it has stopped being the only lever. Models now plan, check their own intermediate steps, and revise an answer before returning it.

- Multi-step maths and code problems have seen the sharpest gains
- Long documents are summarised with far fewer invented details
- Tool use — searching, running code, calling an API — is now reliable enough to build on

## Why it matters outside the lab

Benchmarks are a poor proxy for daily usefulness, and the industry knows it. The more meaningful signal is that teams are quietly replacing brittle rule-based automation with model-driven workflows, and the failure rate is low enough that nobody is being paged at 3am about it.

> The gap between a demo that impresses and a system you can depend on is where most of this year's engineering effort has gone.

There are real limits. Costs rise with the amount of thinking a model does, latency is noticeable, and evaluation remains unsolved — teams still cannot reliably predict which prompts will fail. But the direction is set, and the next twelve months will be about making these systems cheap and boring rather than impressive.`,
    },
    {
        id: "agi-achieved",
        title: "AGI achieved internally? Reading between the lines",
        section: "news",
        category: "Artificial Intelligence",
        author: "Tom Whitfield",
        imageUrl: IMAGES.robot,
        imageAlt: "A small humanoid robot sitting on a red bench",
        imageCredit: "Unsplash",
        excerpt:
            "Another round of rumours claims a lab has crossed the line. The claims deserve scrutiny, not headlines.",
        content: `Every few months a screenshot circulates claiming that some lab has quietly built artificial general intelligence. The pattern is familiar enough to be predictable: an ambiguous post from a researcher, a wave of speculation, and a carefully worded non-denial.

## The problem with the claim

There is still no agreed definition of what would count. Ask ten researchers and you will get answers ranging from "passes any exam a human can" to "can run a company unsupervised for a year". Without a shared bar, the announcement is unfalsifiable by construction.

## What the evidence supports

Current systems are genuinely strong at bounded, well-specified tasks and genuinely weak at open-ended ones that require holding a goal across weeks. They do not accumulate experience between sessions unless someone builds that memory around them.

- Impressive: exam-style reasoning, code generation, translation, summarisation
- Unreliable: long-horizon planning, knowing what they do not know
- Absent: durable memory, genuine goal formation

The honest summary is that capabilities are advancing quickly and unevenly. That is a more interesting story than a threshold being crossed in secret, and it is the one worth following.`,
    },
    {
        id: "agentic-web",
        title: "The agentic web is here, and the rules are being rewritten",
        section: "news",
        category: "Analysis",
        author: "Priya Shah",
        imageUrl: IMAGES.cafeLaptop,
        imageAlt: "Someone using a laptop and phone together in a cafe",
        imageCredit: "Unsplash",
        excerpt:
            "When software agents browse on your behalf, everything built for human eyeballs — ads, paywalls, cookie banners — has to be reconsidered.",
        content: `The web was designed for people to read. That assumption held for thirty years and is now quietly breaking, as an increasing share of page requests come from software acting for a person rather than the person themselves.

## What breaks first

Advertising is the obvious casualty. An agent does not see a banner, does not click it, and does not develop brand preference. Publishers who depend on impressions are watching a slow erosion they cannot easily measure.

Then there is the plumbing. Cookie consent dialogs, infinite scroll, and interstitials all exist to shape human attention. To an agent they are obstacles to route around, and sites that make them harder to route around simply get used less.

## What replaces it

Some publishers are moving toward machine-readable licensing: structured feeds with clear terms attached, priced per request. Others are betting on the opposite — that scarcity of trustworthy, human-verified reporting becomes the product.

- Structured feeds with per-request pricing
- Verified provenance as a selling point
- Direct relationships that do not depend on a search intermediary

None of this is settled. What is clear is that "build a page and hope people find it" no longer describes how information reaches an audience.`,
    },
    {
        id: "llama-4",
        title: "Open weights, closed questions: the new open-source frontier",
        section: "news",
        category: "Open Source",
        author: "Daniel Kimani",
        imageUrl: IMAGES.codeEditor,
        imageAlt: "Source code displayed in a dark code editor",
        imageCredit: "Unsplash",
        excerpt:
            "The newest open-weight releases match proprietary systems on most benchmarks. The licences are where the real disagreement lives.",
        content: `The performance gap between open-weight models and the best proprietary systems has narrowed to the point where, for most everyday tasks, it is not the deciding factor. The argument has moved to licensing.

## Open weights is not open source

Downloading a set of weights is not the same as receiving the four freedoms that the term open source has meant for decades. Most current licences restrict commercial use above a revenue threshold, forbid certain applications, or withhold the training data entirely.

That matters practically, not just philosophically. A team that cannot audit training data cannot fully explain a model's behaviour to a regulator or a customer.

## Why teams still choose them

- Data never leaves infrastructure the team controls
- Costs are predictable — hardware, not per-token billing
- Models can be fine-tuned and frozen, so behaviour does not change underneath a product

The practical advice has not changed: pick based on whether you can live with the licence, and assume the capability ranking will be different in six months.`,
    },
    {
        id: "open-web-dying",
        title: "Why the open web is dying, and what replaces it",
        section: "news",
        category: "Analysis",
        author: "Lena Fischer",
        featured: true,
        imageUrl: IMAGES.earthAtNight,
        imageAlt: "The curve of the Earth at night with city lights visible from orbit",
        imageCredit: "Unsplash",
        excerpt:
            "Centralised platforms won the traffic war. The interesting question is what an independent publisher does about it now.",
        content: `For most of the last decade, the arrangement was simple: publishers wrote, search engines and social platforms distributed, and everyone took a share. That arrangement has ended, and it did not end gradually.

## The traffic did not move, it stopped

Referral traffic to independent sites has fallen sharply as answers are increasingly assembled and displayed without a click. From the reader's point of view this is an improvement. From a publisher's, it removes the transaction the entire business depended on.

## What still works

The publications weathering this share a few traits. They have a direct relationship with readers, they publish something that cannot be summarised away, and they do not treat search rankings as a strategy.

- Newsletters and podcasts, where the audience is owned rather than rented
- Original reporting and testing that cannot be paraphrased from elsewhere
- Communities where the discussion is as valuable as the article

> The open web is not disappearing. It is becoming smaller, more deliberate, and less lucrative — which is roughly what it looked like before the platforms arrived.

The lesson for anyone starting now is unglamorous: build the list, own the domain, and assume no intermediary will send you readers forever.`,
    },
    {
        id: "grid-hack",
        title: "The hack that could take down the grid",
        section: "news",
        category: "Security",
        author: "Marcus Adeyemi",
        imageUrl: IMAGES.powerLines,
        imageAlt: "Electricity transmission pylons silhouetted against a sunset",
        imageCredit: "Unsplash",
        excerpt:
            "Researchers found a chain of weaknesses in the equipment that keeps power flowing. The alarming part is how ordinary the flaws are.",
        content: `A team of security researchers has demonstrated an attack chain against the industrial controllers that regulate power distribution. No single flaw in the chain is exotic. That is precisely what makes it serious.

## How the chain works

The starting point is remote maintenance access — the same connectivity that lets an engineer diagnose a substation without driving to it. From there, weak device authentication and unsigned firmware updates do the rest.

- Default credentials that survive commissioning
- Firmware accepted without a signature check
- Flat networks where one compromised device reaches many

## Why it has not been fixed

Grid hardware is bought on twenty to forty year cycles. Equipment installed before secure firmware signing was standard is still doing its job correctly, and replacing it is a capital project rather than a patch.

Operators are responding with segmentation and monitoring rather than replacement, which is the pragmatic choice. Researchers involved were clear that they found no evidence of the technique being used in the wild, and disclosure was coordinated with vendors months before publication.`,
    },
    {
        id: "silicon-valley-obsession",
        title: "Silicon Valley's new obsession is workflow, not chat",
        section: "news",
        category: "Startups",
        author: "Grace Wanjiru",
        imageUrl: IMAGES.deskWork,
        imageAlt: "Two people reviewing documents and laptops at a desk",
        imageCredit: "Unsplash",
        excerpt:
            "Investors have cooled on general-purpose assistants and are writing cheques for narrow software that finishes a specific job.",
        content: `The pitch that raised money two years ago — a general assistant that does everything — is a hard sell today. What is being funded instead is unglamorous and specific: software that completes one workflow end to end and can prove it.

## What changed in the pitch

Buyers stopped asking what a product could do and started asking what it would replace. That single question reshaped the market. A tool that drafts anything competes with a free chat window; a tool that reconciles invoices competes with a salary line.

- Narrow scope with a measurable before-and-after
- Pricing tied to work completed rather than seats
- Evaluation built in, because buyers now ask for accuracy numbers

## The risk everyone acknowledges

Narrow products are easier to sell and easier to copy. Several founders described the same defensive plan: get close to the systems of record, accumulate the messy edge cases, and make switching a migration rather than a signup.

Whether that is durable is the open question of this funding cycle.`,
    },
    {
        id: "eu-ai-act",
        title: "The EU AI Act: what it means for smaller teams",
        section: "news",
        category: "Policy",
        author: "Elena Rossi",
        imageUrl: IMAGES.handshake,
        imageAlt: "Two people shaking hands in an office",
        imageCredit: "Unsplash",
        excerpt:
            "Comprehensive AI regulation is arriving. Most of the burden lands on how a system is used, not on how clever it is.",
        content: `The headline framing of Europe's AI rules is that they regulate the technology. They mostly do not. They regulate applications, sorted by the risk a given use presents to people affected by it.

## The tiers that matter

A handful of uses are prohibited outright. A larger set is classed as high risk — employment screening, credit decisions, education, essential services — and carries documentation, human oversight, and testing obligations. Most consumer software falls outside both.

## What a small team should actually do

- Write down what your system does and what data trained it
- Identify whether any use touches a high-risk category
- Keep a human decision-maker in the loop where outcomes affect people
- Tell users plainly when they are interacting with a machine

## Open source is not exempt, but it is treated differently

Publishing a model under a free licence carries lighter obligations than shipping it inside a product that makes decisions about people. The obligation attaches to deployment.

For most small teams the practical cost is documentation discipline rather than legal spend — worth starting now, because retrofitting records is far more expensive than keeping them.`,
    },
    {
        id: "nvidia-chip",
        title: "The new accelerator crushing benchmarks — and already sold out",
        section: "news",
        category: "Hardware",
        author: "Samuel Otieno",
        imageUrl: IMAGES.processor,
        imageAlt: "A desktop processor seated in a motherboard socket",
        imageCredit: "Unsplash",
        excerpt:
            "Faster, more power-efficient, and unavailable. Supply, not silicon, is what decides who gets to train large models this year.",
        content: `The newest datacentre accelerator posts the numbers everyone expected: a substantial jump in throughput and a better performance-per-watt figure than the part it replaces. It is also allocated through next year.

## Where the gains come from

Most of the improvement is memory, not maths. Bandwidth and capacity have grown faster than raw compute, which matters because large models spend much of their time waiting for weights rather than multiplying them.

- Higher memory bandwidth feeding the same execution units
- Lower precision formats used more aggressively
- Interconnect improvements that make multi-chip training less painful

## The constraint is packaging

Advanced packaging capacity, not wafer starts, is the bottleneck. That capacity is booked years ahead and cannot be conjured quickly, which is why allocation rather than price is what buyers negotiate over.

For everyone outside the largest labs, the practical implication is that renting compute in short bursts is likely to remain more sensible than owning it.`,
    },
    {
        id: "alphafold-3",
        title: "Protein prediction moves from proteins to everything else",
        section: "news",
        category: "Science",
        author: "James Mwangi",
        imageUrl: IMAGES.lab,
        imageAlt: "A pipette dispensing liquid into a laboratory well plate",
        imageCredit: "Unsplash",
        excerpt:
            "Structure prediction now covers DNA, RNA, and the small molecules that drugs are made from. Wet labs are still required.",
        content: `Structure prediction changed biology once already by making protein folding a solved-enough problem for everyday research. The newer systems extend the same approach to nucleic acids and the interactions between molecules.

## Why interactions are the hard part

A protein on its own is a shape. A protein bound to a drug candidate is a negotiation between two shapes, and small errors in predicted binding translate into wasted months at the bench.

Accuracy on these joint predictions is meaningfully better than a year ago while remaining well short of experimental certainty — which is why every research group treats output as a ranked list of hypotheses.

- Screening candidates before synthesising them
- Prioritising which experiments to run first
- Explaining results that were already observed

## What has not changed

Nothing here removes the wet lab. It reorders it. Groups report the same total number of experiments, run in a smarter sequence, with fewer dead ends explored at full cost.`,
    },

    // Reviews
    {
        id: "iphone-16-pro-review",
        title: "iPhone 16 Pro review: the refinement king",
        section: "reviews",
        category: "Smartphone",
        author: "Priya Shah",
        featured: true,
        imageUrl: IMAGES.iphoneLaptop,
        imageAlt: "An iPhone lying next to a laptop keyboard",
        imageCredit: "Unsplash",
        excerpt:
            "Better cameras, a genuinely useful new button, and the same reliable character. An upgrade for people two generations back.",
        content: `Apple has spent this generation sanding down edges rather than redrawing the shape. Nothing here will make an owner of last year's model feel left behind, and that is arguably the point.

## Camera

The main sensor captures noticeably more detail in low light, and the processing is less eager to brighten night scenes into something that never existed. The ultrawide finally matches the main sensor's colour rendering, which removes the small jarring shift when switching lenses mid-shot.

## The new button

The dedicated capture control is better than expected. Half-press to focus works exactly as muscle memory expects, and being able to start recording without hunting for an on-screen target is a real improvement when the phone is cold or wet.

## Battery and performance

Two days of light use, a comfortable full day of heavy use. Performance is not the story on a phone this fast — thermal behaviour is, and sustained recording no longer throttles as aggressively.

## Verdict

**Buy it if** you are coming from a two or three year old phone, or you shoot a lot of video.

**Skip it if** you bought last year's Pro. The differences are real and small.`,
    },
    {
        id: "google-pixel-9-pro",
        title: "Google Pixel 9 Pro review: AI in your pocket",
        section: "reviews",
        category: "Smartphone",
        author: "Daniel Kimani",
        imageUrl: IMAGES.pixelSearch,
        imageAlt: "A Google Pixel phone showing the Google search page",
        imageCredit: "Unsplash",
        excerpt:
            "The smartest phone on the market gets a design that finally matches its software. The camera remains the reason to buy it.",
        content: `Google's hardware has caught up with its software. The Pixel 9 Pro is the first in the line that feels designed rather than assembled, and it no longer asks buyers to forgive anything.

## Software is still the differentiator

On-device processing handles call screening, live translation, and photo cleanup without a round trip to a server. The practical effect is that these features work on a bad connection, which is when you actually need them.

- Call screening that reads intent well enough to be trusted
- Photo cleanup that removes objects without the smeared background giveaway
- Translation that keeps up with normal speaking pace

## Camera

Still the best point-and-shoot phone available. The processing leans toward contrast and shadow detail, which flatters most scenes and occasionally overdoes a sunset.

## What holds it back

Battery life is good rather than exceptional, and charging remains slower than competitors at this price. Seven years of promised updates makes the calculation easier to accept.

## Verdict

**Buy it if** photography and software features matter more than raw speed.

**Skip it if** you need the fastest charging in the class.`,
    },
    {
        id: "samsung-galaxy-s25-ultra",
        title: "Samsung Galaxy S25 Ultra: titanium perfection?",
        section: "reviews",
        category: "Smartphone",
        author: "Grace Wanjiru",
        imageUrl: IMAGES.samsungPurple,
        imageAlt: "A purple Samsung flagship phone photographed from the back",
        imageCredit: "Unsplash",
        excerpt: "The most capable Android phone you can buy, and the least comfortable one to actually hold.",
        content: `Samsung's Ultra line has always been about maximums, and this generation continues the tradition without much interest in restraint.

## Hardware

The titanium frame drops weight without losing rigidity, though at this size no material makes one-handed use realistic. The display remains the best in the industry — bright enough to read in direct sun, with no visible shift off-axis.

## Cameras

Four sensors, and the periscope telephoto is the one worth having. Zoom holds together well past the point where most phones start inventing detail.

- Main sensor: excellent in every condition
- Periscope: usable range far beyond rivals
- Ultrawide: the weakest of the set, noticeably softer at the edges

## The stylus

Still here, still niche, still the reason a small group of people will not switch. Latency is imperceptible and handwriting recognition handles bad penmanship gracefully.

## Verdict

**Buy it if** you want maximum capability and will use the zoom and the pen.

**Skip it if** you value pocketability at all.`,
    },
    {
        id: "nothing-phone-3",
        title: "Nothing Phone (3): transparent design meets flagship specs",
        section: "reviews",
        category: "First look",
        author: "Tom Whitfield",
        imageUrl: IMAGES.darkPhone,
        imageAlt: "A phone displaying a dark themed home screen",
        imageCredit: "Unsplash",
        excerpt: "Distinctive hardware and a genuinely calm software philosophy. The cameras are the compromise.",
        content: `Nothing continues to make the most visually distinctive phones in the market, and this generation finally pairs that design with hardware that competes on specification.

## Design

The transparent back is a gimmick that has aged into an identity. The rear light strip has become a legitimately useful notification system once configured — glanceable information without unlocking anything.

## Software

The monochrome interface sounds like an affectation and works better than expected. Fewer coloured icons genuinely does reduce the pull to open apps aimlessly, which is the stated goal.

## Cameras

Good in daylight, average once the light drops. Processing is slower than rivals and occasionally produces inconsistent colour between consecutive shots.

## Verdict

**Buy it if** you want something that does not look like everything else and you value software restraint.

**Skip it if** the camera is your primary consideration.`,
    },
    {
        id: "iphone-16-pro-max",
        title: "iPhone 16 Pro Max: the battery king",
        section: "reviews",
        category: "Flagship",
        author: "Priya Shah",
        imageUrl: IMAGES.iphoneAirpods,
        imageAlt: "An iPhone and wireless earbuds on a wooden table",
        imageCredit: "Unsplash",
        excerpt: "The longest-lasting iPhone yet, in a body that asks a lot of your hands and your pockets.",
        content: `The Pro Max exists for people who want the battery and the biggest screen, and it delivers both without qualification this year.

## Battery

Comfortably two days of ordinary use. Heavy days — navigation, hotspot, video — end with meaningful charge remaining, which changes travel behaviour more than any feature on the spec sheet.

## Display

Marginally brighter than the smaller Pro and identical in every other respect. The extra area is most noticeable when editing or reading rather than watching.

## Cameras

Identical to the Pro apart from the longer telephoto, which is a genuine advantage for anyone who shoots at distance regularly.

## Living with it

It is heavy. One-handed use requires either large hands or a tolerance for reachability gestures. Everyone who buys this phone knows that and buys it anyway.

## Verdict

**Buy it if** battery life is the thing you complain about most.

**Skip it if** you have ever described a phone as too big.`,
    },
    {
        id: "oneplus-open-2",
        title: "OnePlus Open 2: perfection, folded",
        section: "reviews",
        category: "Foldable",
        author: "Marcus Adeyemi",
        imageUrl: IMAGES.phoneHomeScreen,
        imageAlt: "A phone home screen filled with app icons",
        imageCredit: "Unsplash",
        excerpt:
            "Lighter hardware and better software make the strongest case yet that a foldable can be an only phone.",
        content: `Foldables have spent several generations being interesting rather than sensible. This one is close to sensible.

## Hardware

Weight is down enough to matter and the closed profile is nearly indistinguishable from a conventional phone in a pocket. The crease is visible at an angle and invisible in use.

## Software

The multitasking implementation is the best available. Dragging an app into a split view works the first time, and the phone remembers pairings, which turns a party trick into a habit.

- Open-close transitions with no relaunch stutter
- App pairs that persist across sessions
- Sensible defaults for apps that do not support resizing

## Durability

The hinge feels overbuilt in the best sense. Dust ingress remains the open question for every foldable, and no manufacturer has fully answered it.

## Verdict

**Buy it if** you genuinely multitask on a phone and want one device.

**Skip it if** you need the best camera at this price — conventional flagships still win there.`,
    },
    {
        id: "pixel-9a",
        title: "Pixel 9a: still the camera champion at half the price",
        section: "reviews",
        category: "Budget",
        author: "Lena Fischer",
        imageUrl: IMAGES.cameraBacks,
        imageAlt: "Two smartphones photographed from behind showing their camera modules",
        imageCredit: "Unsplash",
        excerpt: "Google proves again that flagship photography does not require a flagship price.",
        content: `The a-series has a simple proposition: the same photographic results as the expensive Pixel, with compromises somewhere you are less likely to notice.

## Camera

The sensor is smaller than the Pro's and the processing pipeline is identical, which matters far more. Daylight results are essentially indistinguishable. Night shots take longer and show more noise, but remain better than anything else at this price.

## Where the money was saved

- Plastic rather than glass and metal
- Slower charging
- Dimmer display, though still readable outdoors

None of these are felt daily. The processor is a generation behind and comfortably fast enough for everything short of sustained gaming.

## Verdict

**Buy it if** you want the best photos per shilling on the market.

**Skip it if** you play demanding games or need the brightest screen available.`,
    },

    // How to
    {
        id: "llama-3-mac",
        title: "How to run a local language model on your Mac",
        section: "how-to",
        category: "Software",
        author: "Daniel Kimani",
        imageUrl: IMAGES.pythonCode,
        imageAlt: "Python source code on a monitor",
        imageCredit: "Unsplash",
        excerpt:
            "Stop paying per token for routine work. A capable model runs on Apple Silicon in about fifteen minutes of setup.",
        content: `Running a model locally is no longer an expert activity. On an Apple Silicon Mac with 16GB of memory or more, a capable open-weight model runs fast enough for everyday drafting, summarising, and code assistance.

## What you need

- An Apple Silicon Mac (M1 or newer)
- 16GB unified memory for a comfortable experience
- Roughly 10GB of free disk space per model

## Step 1: install a runner

The simplest option installs a background service and a command line tool. Download the installer, run it, and confirm it works by asking for a version number in Terminal.

## Step 2: pull a model

Model files are large, so the first download takes a while. Start with a mid-sized instruction-tuned model rather than the largest one available — the quality difference on everyday tasks is smaller than the speed difference.

## Step 3: choose a quantisation

Quantisation trades precision for memory. A 4-bit version of a larger model usually beats a full-precision version of a smaller one at the same memory budget.

## Step 4: connect it to something useful

Most local runners expose an OpenAI-compatible endpoint on localhost, which means editors and note apps that support a custom base URL work without modification.

## When local is the wrong answer

Long documents, heavy reasoning, and anything where quality matters more than privacy or cost are still better served by a hosted frontier model. Local models are for the routine ninety percent.`,
    },
    {
        id: "scrub-data-ai",
        title: "How to remove your data from AI training sets",
        section: "how-to",
        category: "Privacy",
        author: "Elena Rossi",
        imageUrl: IMAGES.padlock,
        imageAlt: "A padlock resting on a laptop keyboard lit in red and green",
        imageCredit: "Unsplash",
        excerpt: "Opt-out tools exist, but they are scattered and deliberately hard to find. Here is where they live.",
        content: `Most large training corpora were assembled from public web data before opt-out mechanisms existed. You cannot undo that. What you can do is limit what gets collected next time and remove what is still being served.

## Start with what you control

If you run a site, the crawler directives in your robots file are honoured by the major AI crawlers. Each operates under a distinct user agent, so a blanket rule is not enough — list them individually.

## Platform settings worth checking

- Social accounts: look for "data for AI improvement" in privacy settings, usually off the main page
- Cloud storage and email providers: separate toggles for content analysis
- Developer platforms: repository-level settings that govern code training

## Formal requests

In jurisdictions with data protection law, you can make a deletion request naming yourself as the data subject. Responses vary in usefulness. A request is more likely to succeed against a searchable index than against weights already trained.

## Set expectations

Removing a page from an index is achievable. Removing information from a trained model is not currently possible at the individual level, whatever a form implies. Treat this as reducing future exposure rather than erasing past exposure.`,
    },

    // How stuff works
    {
        id: "fusion-energy",
        title: "How fusion energy actually works",
        section: "how-stuff-works",
        category: "Physics",
        author: "James Mwangi",
        featured: true,
        imageUrl: IMAGES.engineerLab,
        imageAlt: "An engineer working at an industrial machine in a laboratory",
        imageCredit: "Unsplash",
        excerpt: "The physics has been understood for decades. The engineering is the hard part, and it is finally moving.",
        content: `Fusion releases energy by forcing light atomic nuclei together, the same process that powers the sun. The difficulty is not the reaction. It is containing something hotter than a star's core long enough to get more energy out than went in.

## The confinement problem

Two approaches dominate. Magnetic confinement holds a plasma in a magnetic bottle for seconds at a time. Inertial confinement compresses a fuel pellet with lasers in an instant. Both work in the sense that fusion occurs. Neither has produced sustained net electricity.

## What "net energy" actually means

Announcements about breaking even usually measure energy delivered to the fuel, not energy drawn from the wall. The gap between those two numbers is enormous — lasers and magnets are inefficient — and closing it is the real engineering challenge.

- Scientific gain: energy out versus energy into the fuel
- Engineering gain: energy out versus energy into the whole facility
- Commercial viability: engineering gain, sustained, at a price that competes

## Why it is moving now

Better superconducting magnets allow stronger fields in smaller machines, and simulation has improved enough that designs can be tested before being built. Private capital has followed.

Nobody serious is promising grid power this decade. The credible claim is a demonstration plant in the 2030s.`,
    },
    {
        id: "what-is-npu",
        title: "What is an NPU, and does your next laptop need one?",
        section: "how-stuff-works",
        category: "Computing",
        author: "Samuel Otieno",
        imageUrl: IMAGES.chipMacro,
        imageAlt: "A close-up of a silicon chip with visible circuitry",
        imageCredit: "Unsplash",
        excerpt: "A dedicated AI chip sits beside your processor. What it is for is less obvious than the marketing suggests.",
        content: `A neural processing unit is a specialised accelerator built for one shape of maths: the large matrix multiplications that neural networks perform constantly. It is not faster than a GPU at that work. It is far more power-efficient.

## Why efficiency is the point

A GPU can run a small model quickly while consuming enough power to drain a laptop battery in an hour. An NPU runs the same model at a fraction of the wattage, which is what makes always-on features practical.

- Background noise removal on calls
- Live captioning and translation
- Camera framing and blur
- Local search over your own files

## How to read the specifications

Manufacturers advertise TOPS — trillions of operations per second. Treat it the way you treat megapixels: related to capability, but not a ranking. Memory bandwidth and software support usually decide real-world performance.

## Do you need one?

If you are buying a laptop today, you will get one whether you want it or not. It is worth caring about if you take a lot of calls, work offline often, or care about battery life during video work. It is not worth paying a premium for on a desktop that never leaves a desk.`,
    },

    // Tech Kenya
    {
        id: "nairobi-fintech",
        title: "Nairobi's fintech boom enters its second decade",
        section: "tech-kenya",
        category: "Startups",
        author: "Grace Wanjiru",
        featured: true,
        imageUrl: IMAGES.cardPayment,
        imageAlt: "A customer paying by card at a shop counter",
        imageCredit: "Unsplash",
        excerpt:
            "Mobile money solved payments. The companies being built now are solving what happens after the payment clears.",
        content: `Kenya's reputation as a mobile money pioneer is well earned and, at this point, slightly out of date. Sending money is a solved problem. The interesting work has moved up the stack.

## What is being built now

Payments infrastructure is now a foundation rather than a product. The businesses attracting investment sit on top of it: credit scoring built on transaction history, working capital for merchants, and treasury tools for companies operating across several currencies.

- Merchant lending underwritten by till data rather than collateral
- Cross-border settlement for regional trade
- Payroll and tax compliance for distributed teams

## The constraint is regulation, not demand

Licensing regimes were written for a market with fewer participants and clearer categories. Founders describe the same pattern: a product that works technically waits months for a determination on which licence it needs.

## Talent has stopped leaving

The most significant change may be quiet. Senior engineers who would once have taken a role abroad are increasingly staying, partly because remote work removed the reason to move and partly because local companies now pay competitively.

That accumulation of experience — people on their second or third company rather than their first — is what turns a moment into an industry.`,
    },
    {
        id: "fiber-expansion",
        title: "Fibre expansion reaches the rural counties",
        section: "tech-kenya",
        category: "Infrastructure",
        author: "Samuel Otieno",
        imageUrl: IMAGES.savannah,
        imageAlt: "An acacia tree on the Kenyan savannah at sunset",
        imageCredit: "Unsplash",
        excerpt:
            "High-speed connections are arriving in counties that had none. Getting the cable there was the easy part.",
        content: `Backbone fibre now reaches every county, a milestone that took the better part of a decade. Connecting a county is not the same as connecting the people who live in it, and the remaining work is the harder kind.

## The last mile problem

Trunk capacity is abundant. What is scarce is the distribution between a regional exchange and a household — the segment where costs are highest and the number of customers per kilometre is lowest.

- Fixed wireless bridging the final few kilometres
- Community networks sharing an upstream connection
- Solar-powered towers where grid supply is unreliable

## Power is the hidden dependency

Equipment needs uninterrupted electricity. In areas with intermittent supply, operators effectively become small power companies, and the cost of batteries and solar frequently exceeds the cost of the fibre itself.

## What changes when it lands

The measurable effects show up first in education and small business — remote coursework becoming viable, and traders reaching customers outside their immediate market. Those effects take a year or two to appear in the data, which is why coverage announcements tend to outrun visible change.`,
    },

    // How to
    {
        id: "back-up-your-phone",
        title: "How to back up your phone so you never lose anything",
        section: "how-to",
        category: "Mobile",
        author: "Priya Shah",
        imageUrl: IMAGES.phoneOnDesk,
        imageAlt: "A smartphone lying face up on a wooden desk",
        imageCredit: "Unsplash",
        excerpt:
            "Cloud backup covers less than most people assume. Twenty minutes now saves a very bad afternoon later.",
        content: `Most people believe their phone is backed up because a cloud service is switched on. That service usually covers photos and settings — and not much else.

## Check what is actually included

Open your backup settings and read the list rather than the toggle. Messages, authenticator apps, and downloaded media are the three that are most often missing.

- **Photos and video** — usually covered, but check the resolution being stored
- **Messages** — frequently excluded, or capped at a small history
- **Authenticator codes** — almost never included, and the most painful to lose
- **Documents** — only if they live in a synced folder

## Move authenticator codes first

If your two-factor codes exist only on the phone, losing it locks you out of the accounts you would use to recover everything else. Most authenticator apps now offer an encrypted export or account sync. Turn it on before you need it.

## Add a second copy

Cloud sync is not a backup — deleting a file deletes it everywhere. Once a month, copy your photo library to a computer or an external drive. It takes minutes and it is the copy that survives an accidental deletion.

## Test it

Restore a single file. A backup nobody has ever restored from is an assumption, not a backup.`,
    },
    {
        id: "switch-to-passkeys",
        title: "How to switch your accounts to passkeys",
        section: "how-to",
        category: "Security",
        author: "Elena Rossi",
        featured: true,
        imageUrl: IMAGES.greenCode,
        imageAlt: "Streams of green code on a dark screen",
        imageCredit: "Unsplash",
        excerpt:
            "Passkeys remove the password entirely, and they are now supported by most services worth protecting.",
        content: `A passkey replaces your password with a key stored on your device and unlocked by your fingerprint, face, or screen lock. There is nothing to remember, nothing to type, and nothing for a phishing site to steal.

## Why it is worth the twenty minutes

A passkey is bound to the real website address. A convincing fake login page cannot use it, because the key simply will not offer itself to the wrong domain. That single property removes the most common way ordinary accounts are compromised.

## Where to start

Do the accounts that can reset the others first:

1. Your email account — everything else recovers through it
2. Your password manager
3. Banking and mobile money
4. Social accounts

In each service, look under **Security → Passkeys → Add a passkey**.

## Keep a fallback

Register a passkey on more than one device, or store it in a password manager that syncs. Then keep your recovery codes somewhere offline. Losing the only device holding the only key is the one real risk.

## What does not change

Passwords do not disappear overnight. Most services keep the old password active alongside the passkey, so delete it manually once the passkey works — otherwise the weaker route is still open.`,
    },
    {
        id: "speed-up-old-laptop",
        title: "How to make an ageing laptop fast again",
        section: "how-to",
        category: "Hardware",
        author: "Daniel Kimani",
        imageUrl: IMAGES.laptopHelp,
        imageAlt: "Two people looking at a laptop screen together",
        imageCredit: "Unsplash",
        excerpt: "Before replacing a slow machine, two cheap changes recover most of the speed it has lost.",
        content: `A four-year-old laptop that feels unusable is rarely short of processing power. It is almost always short of memory or waiting on a slow disk.

## Find the real bottleneck first

Open your system monitor and watch while the machine is being slow.

- **Memory near capacity** — the system is swapping to disk; add RAM
- **Disk at 100%** — a mechanical drive is the limit; fit an SSD
- **CPU pinned with fans loud** — a background process, or dust and dried thermal paste

Spending money before this check is how people replace a machine that needed a 5,000 shilling part.

## The two upgrades that matter

Replacing a mechanical hard drive with an SSD is the single largest improvement available to an old laptop — boot and application launch times drop by a factor of five or more. Doubling the RAM is second.

## Then clean up the software

- Remove programs that start automatically and are never used
- Reduce browser extensions; each one costs memory on every tab
- Clear enough disk space to leave 15% free, or the SSD slows down

## When to stop

If the machine cannot take more memory, has no upgradeable storage, or no longer receives security updates, stop spending. That is the point where replacement is the honest answer.`,
    },

    // How stuff works
    {
        id: "how-mobile-money-works",
        title: "How mobile money actually works",
        section: "how-stuff-works",
        category: "Finance",
        author: "Grace Wanjiru",
        imageUrl: IMAGES.atmKeypad,
        imageAlt: "A hand entering a PIN on a cash machine keypad",
        imageCredit: "Unsplash",
        excerpt:
            "There is no money on your phone. Understanding what is really moving explains why the system is so hard to copy.",
        content: `When you send money from a phone, nothing travels except a message. The value sits in a pooled bank account, and what changes is a number in a ledger recording how much of that pool is yours.

## The three moving parts

- **The float** — real money held in trust at a commercial bank, matching the total of every user balance
- **The ledger** — the operator's record of who owns what share of that float
- **The agent network** — the shops that convert physical cash into ledger entries and back

The technology is the least difficult part. The agent network is the reason the system works.

## Why agents are the hard problem

An agent must hold both cash and electronic balance at all times. Too much of either and they cannot serve the next customer. Rebalancing thousands of small businesses every day, profitably, is the operational feat competitors underestimate.

## What keeps the value safe

Regulators require the float to be fully backed and held separately from the operator's own money, so a company failure does not take customer balances with it. That trust requirement — not the app — is what made the system credible enough for people to use for their wages.

## Why interoperability took so long

Sending between networks means two ledgers agreeing, then settling in real money between banks. The plumbing is unglamorous, arrived years after the product, and is what turned competing services into something closer to a shared payment system.`,
    },
    {
        id: "how-solar-mini-grids-work",
        title: "How solar mini-grids keep the lights on",
        section: "how-stuff-works",
        category: "Energy",
        author: "James Mwangi",
        imageUrl: IMAGES.solarPanels,
        imageAlt: "Rows of solar panels in a field under a bright sky",
        imageCredit: "Unsplash",
        excerpt:
            "A village-scale power station is mostly a battery problem, and the economics turn on who uses the power at midday.",
        content: `A mini-grid is a small, self-contained power system: panels, a battery bank, an inverter, and a few kilometres of distribution wire serving one community. The engineering is well understood. Making it pay is the interesting part.

## The parts, and what each costs

- **Panels** — the cheapest component, and no longer the constraint
- **Batteries** — the largest single cost, and the part that wears out
- **Inverter and controls** — converts and regulates; determines reliability
- **Distribution** — poles and wire, which scale with how spread out the households are

## Why daytime demand decides everything

Solar produces at midday and households consume in the evening. Every unit shifted through a battery costs more than one used as it is generated. A mini-grid serving only homes is therefore expensive per unit.

Add a daytime commercial load — a maize mill, a welding shop, a cold store — and the same panels earn revenue without touching the battery. Operators now recruit those businesses deliberately, because they make the tariff affordable for everyone else.

## What goes wrong

Demand grows faster than forecast, batteries degrade sooner than modelled, and collection is harder than expected. Prepaid metering solved the third. The first two are managed by designing for expansion from the start.

## The connection question

When the national grid eventually arrives, a well-built mini-grid can sell into it or operate alongside it. The systems built to that standard hold their value; those built as temporary stopgaps do not.`,
    },
    {
        id: "how-data-centres-stay-cool",
        title: "How data centres stay cool",
        section: "how-stuff-works",
        category: "Infrastructure",
        author: "Samuel Otieno",
        imageUrl: IMAGES.dataCentre,
        imageAlt: "Technicians working between rows of servers in a data centre",
        imageCredit: "Unsplash",
        excerpt:
            "Nearly all the electricity a server draws leaves as heat. Removing it is most of the building's engineering.",
        content: `A server converts almost all the power it consumes into heat. A room of them produces the output of a small industrial heater, continuously, and the entire facility is designed around moving that heat somewhere else.

## Hot aisles and cold aisles

Racks face each other so intakes draw from one aisle and exhausts blow into another. Keeping the two air streams from mixing is the cheapest efficiency gain available, and doing it badly wastes more energy than any other single mistake.

## Measuring the overhead

Efficiency is expressed as PUE — total facility power divided by power reaching the computers. A PUE of 2.0 means a watt of cooling for every watt of computing. Modern designs target 1.2 or lower.

- **Free cooling** — using outside air when it is cool enough, no chiller needed
- **Evaporative cooling** — cheap on electricity, expensive on water
- **Liquid cooling** — coolant to the chip itself, now common for AI hardware

## Why AI changed the design

A rack of general-purpose servers might draw 5 to 10 kilowatts. A rack of AI accelerators can draw ten times that. Air cannot carry heat away fast enough at that density, which is why liquid cooling moved from exotic to standard in a couple of years.

## The local constraint

In warm climates, free cooling is available for fewer hours a year and water is often scarce, so operators lean on efficient chillers and heat-tolerant equipment. It is a real cost difference, and one reason siting decisions follow climate as much as connectivity.`,
    },

    // Tech Kenya
    {
        id: "kenya-data-centre-market",
        title: "Inside Kenya's data centre buildout",
        section: "tech-kenya",
        category: "Infrastructure",
        author: "Samuel Otieno",
        featured: true,
        imageUrl: IMAGES.serverRoom,
        imageAlt: "Structured cabling running through server racks",
        imageCredit: "Unsplash",
        excerpt:
            "Regional demand for local hosting is real. Power, not demand, decides how quickly capacity arrives.",
        content: `Data hosted locally is faster to reach and easier to keep compliant, and demand from banks, government, and regional businesses has grown steadily. Several operators are expanding capacity to meet it.

## Why local hosting matters

Latency is the plain commercial argument: an application served from Nairobi responds noticeably faster than one served from Europe. Data residency rules are the regulatory one — some categories of records are expected to stay in the country.

## Power is the binding constraint

A data centre needs uninterrupted, high-quality power at a predictable price. Kenya has an advantage most of the region does not — a grid with a high share of geothermal and hydro generation, which is both low-carbon and relatively stable.

That advantage is undercut by connection timelines. Securing a dedicated supply of the required capacity takes longer than building the facility, and every operator interviewed described the same sequencing problem.

- Grid connections that outlast construction schedules
- Backup generation and fuel storage as a licensing requirement
- Cooling costs that rise with ambient temperature

## What comes next

The current phase is aimed at colocation — companies renting space for their own equipment. The larger prize is persuading international cloud providers to place a region here, which requires capacity, redundancy, and connectivity to be demonstrably in place first.`,
    },
    {
        id: "kenyan-startups-remote-hiring",
        title: "Why Kenyan startups are hiring remote-first",
        section: "tech-kenya",
        category: "Startups",
        author: "Grace Wanjiru",
        imageUrl: IMAGES.officeWindow,
        imageAlt: "A laptop on a bench beside a window in a modern office",
        imageCredit: "Unsplash",
        excerpt:
            "Competing for engineers against foreign employers changed how local companies hire, pay, and organise.",
        content: `When an engineer in Nairobi can be paid by a company in Berlin without leaving home, every local employer is competing in a market it did not choose to enter. The response has reshaped how startups here are built.

## What changed in practice

Salary bands moved first, particularly for engineers with three or more years of experience. Companies that could not match cash competed on the things distributed employers struggle to offer: ownership, decision-making authority, and work whose results are visible locally.

- Equity offered earlier and explained more carefully
- Hiring across the region rather than within one city
- Written-first working practices, so time zones matter less

## The upside nobody expected

Recruiting remotely widened the pool well beyond the capital. Companies that adopted asynchronous habits found they could hire in Kisumu, Eldoret, or Kampala without an office, and retention improved because people were not required to relocate.

## The costs

Junior hiring suffered. Remote-first organisations are demanding for people who learn by watching others work, and several founders admitted their graduate pipeline weakened before they rebuilt it deliberately with structured mentoring.

## Where it settles

The emerging pattern is hybrid by intent rather than by compromise: a small office used for onboarding and design work, with the default being distributed. It is a more expensive way to run a company, and the alternative is losing the third engineer you hired.`,
    },
    {
        id: "digital-lending-rules",
        title: "Digital lending rules tighten, and the market adjusts",
        section: "tech-kenya",
        category: "Policy",
        author: "Elena Rossi",
        imageUrl: IMAGES.banknotes,
        imageAlt: "A hand holding a fan of banknotes",
        imageCredit: "Unsplash",
        excerpt:
            "Licensing brought order to app-based lending. The lenders that survived look quite different from the ones that arrived.",
        content: `App-based lending grew faster than the rules covering it. Licensing requirements, caps on charges, and limits on how borrowers may be pursued have since reshaped the sector.

## What the rules changed

Three requirements did most of the work:

- **Licensing** — lenders must register and disclose ownership
- **Pricing transparency** — the total cost of credit must be stated up front, not as a daily rate that obscures the annual figure
- **Debt collection limits** — contacting a borrower's phone contacts, once routine, is prohibited

The third mattered most to borrowers. Shame-based collection was the practice that caused real harm, and removing it forced lenders to underwrite properly rather than rely on social pressure to recover.

## Who survived

Lenders that priced for risk and could demonstrate where their capital came from. Those whose model depended on very high effective rates and aggressive recovery largely exited or were absorbed.

## What replaced them

Underwriting now leans on transaction history — mobile money flows, till receipts, repayment records — rather than on the threat of exposure. That favours lenders with a data relationship to the borrower, which is why payment processors and marketplaces have moved into credit.

## The open question

Access has narrowed at the riskiest end of the market. Whether that represents people protected from unaffordable debt or people pushed toward informal lenders is genuinely contested, and the data to settle it does not yet exist.`,
    },
]

export const demoPages = [
    {
        id: "about",
        title: "About Tech Hub",
        slug: "about",
        status: "published",
        excerpt: "Independent technology journalism covering the industry from Nairobi and beyond.",
        content: `## Who we are

Tech Hub is an independent technology publication. We cover the products, companies, and policies shaping how technology is built and used — with particular attention to how those changes land in Kenya and across the region.

## What we publish

- **News** — what happened, why it matters, and what is still unknown
- **Reviews** — hands-on testing with clear buy and skip guidance
- **How To** — practical guides written to be followed, not skimmed
- **How Stuff Works** — the engineering behind the headlines
- **Tech Kenya** — the local industry, covered properly

## How we work

We test what we review and say plainly when we have not. Review units are returned or disclosed. Anything published in partnership with a commercial partner is labelled as such, at the top, without ambiguity.

Corrections are made openly. If we get something wrong, tell us and we will fix it and say that we did.

## Get in touch

Story tips, corrections, and review requests are all welcome through the contact page.`,
    },
    {
        id: "advertise",
        title: "Advertise with us",
        slug: "advertise",
        status: "published",
        excerpt: "Reach an audience of engineers, founders, and technology buyers.",
        content: `## Our audience

Tech Hub readers are the people who choose, build, and pay for technology: engineers, founders, IT decision-makers, and enthusiasts who read reviews before they buy.

## What we offer

- **Display placements** across article and section pages
- **Newsletter sponsorship** with a single sponsor per issue
- **Sponsored articles**, clearly labelled and written to the same editorial standard

## What we do not do

We do not sell coverage. Editorial decisions are not for sale, review scores are never negotiated, and sponsored content is always labelled before a reader starts reading it.

## Rates and availability

Rate cards and current availability are shared on request. Get in touch through the contact page and tell us a little about what you are trying to reach.`,
    },
]

export const demoSettings = {
    siteName: "Tech Hub",
    tagline: "Technology news, reviews, and guides",
    heroEyebrow: "Lead story",
    heroTitle: "",
    heroSubtitle: "",
    heroArticleId: "",
    newsletterTitle: "Tech Hub Weekly",
    newsletterText: "One email a week: the stories that mattered, and the ones that did not.",
    footerText: "Independent technology journalism from Nairobi and beyond.",
    contactEmail: "hello@techhub.co.ke",
    twitterUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
}

/** Fills in the fields the store expects but the copy above does not spell out. */
export function buildArticles() {
    return demoArticles.map((article, index) => {
        const words = article.content.trim().split(/\s+/).length

        return {
            ...article,
            slug: article.id,
            status: "published",
            featured: article.featured === true,
            readTime: `${Math.max(1, Math.ceil(words / 200))} min read`,
            publishedAt: new Date(START - index * 7 * HOURS).toISOString(),
            updatedAt: new Date(START - index * 7 * HOURS).toISOString(),
        }
    })
}
