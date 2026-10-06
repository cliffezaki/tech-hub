// Original, code-owned editorial illustrations. No third-party photos, fonts or logos.
// Only the protected staging seeder uploads these; public SVG uploads remain blocked.
export type ArtworkKind = "browser" | "network" | "documents" | "computer" | "lock" | "phone" | "key" | "domain" | "privacy"

const palettes = [
    ["#f2ebe0", "#d62d26", "#131b26", "#cfdbd7"],
    ["#101d2b", "#72c9b5", "#f4eee3", "#223c4e"],
    ["#ede7db", "#dc9d36", "#182d37", "#d4d9cc"],
    ["#1d2435", "#ec6a53", "#fff4e2", "#354b65"],
] as const
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!))

export function coverSvg(kind: ArtworkKind, edition: number, label: string) {
    const [paper, accent, ink, muted] = palettes[edition % palettes.length]
    const line = (x1: number, y1: number, x2: number, y2: number, color: string = ink, width = 8) =>
        `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round"/>`
    const dot = (cx: number, cy: number, r: number, fill: string = accent) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`
    const rect = (x: number, y: number, w: number, h: number, fill: string, radius = 14) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`
    let motif = ""
    switch (kind) {
        case "browser":
            motif = rect(245, 180, 950, 530, ink, 24) + rect(270, 258, 900, 426, paper) +
                dot(289, 218, 9, accent) + dot(322, 218, 9, paper) + dot(355, 218, 9, muted) +
                rect(325, 314, 425, 52, muted) + rect(325, 393, 550, 14, ink) +
                rect(325, 425, 445, 14, ink) + rect(325, 488, 280, 120, accent) +
                `<circle cx="1000" cy="473" r="122" fill="${accent}"/><path d="M1000 385l70 30v65c0 50-35 81-70 105-35-24-70-55-70-105v-65z" fill="${paper}"/>` +
                line(969, 476, 993, 502, accent) + line(993, 502, 1040, 443, accent)
            break
        case "network": {
            const points = [[320, 320], [1070, 280], [1150, 600], [300, 650], [720, 170]]
            motif = points.map(([x, y]) => line(720, 465, x, y, muted, 12) + dot(x, y, 47, ink) + dot(x, y, 17)).join("") +
                dot(720, 465, 130, ink) + dot(720, 465, 92, accent) +
                `<path d="M660 465h120M720 405v120" stroke="${paper}" stroke-width="15"/>`
            break
        }
        case "documents":
            motif = `<g transform="rotate(-12 530 480)">${rect(345, 200, 385, 525, muted)}${rect(380, 246, 110, 110, accent)}${[414, 457, 500, 543, 586].map(y => line(383, y, 670, y, ink, 12)).join("")}</g>
                <g transform="rotate(10 900 470)">${rect(700, 185, 370, 540, ink)}${rect(735, 225, 300, 240, paper)}${[520, 560, 600].map(y => line(735, y, 1010, y, paper, 10)).join("")}<path d="M770 410l55-75 60 30 90-85" stroke="${accent}" stroke-width="18" fill="none"/></g>`
            break
        case "computer":
            motif = rect(310, 180, 820, 460, ink, 25) + rect(335, 208, 770, 400, muted) +
                rect(400, 270, 335, 280, paper) + rect(775, 270, 255, 120, accent) +
                rect(775, 423, 255, 127, paper) +
                `<path d="M310 640h820l150 75q15 25-20 25H180q-35 0-20-25z" fill="${ink}"/><rect x="585" y="659" width="270" height="34" rx="8" fill="${paper}"/>`
            break
        case "lock":
        case "privacy":
            motif = `<circle cx="720" cy="445" r="270" fill="${muted}"/><path d="M570 403v-90a150 150 0 0 1 300 0v90" stroke="${ink}" stroke-width="48" fill="none"/>` +
                rect(520, 390, 400, 285, accent, 32) + dot(720, 498, 34, paper) +
                rect(705, 518, 30, 66, paper) + dot(345, 565, 60, ink) + dot(1095, 305, 60, ink) +
                line(410, 565, 480, 565, muted) + line(960, 305, 1030, 305, muted)
            break
        case "phone":
            motif = `<g transform="rotate(-10 570 450)">${rect(405, 130, 325, 625, ink, 45)}${rect(430, 174, 275, 500, paper, 24)}${rect(503, 193, 130, 18, ink)}${rect(470, 390, 195, 150, accent)}${dot(568, 713, 16, muted)}</g>
                <path d="M875 435a86 86 0 0 1 28-161 115 115 0 0 1 209 25 89 89 0 0 1-1 176H887" fill="${muted}"/><path d="M977 615V385m-65 65l65-65 65 65" stroke="${accent}" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
            break
        case "key":
            motif = `<g transform="rotate(-28 720 450)"><circle cx="475" cy="450" r="170" fill="${accent}"/><circle cx="475" cy="450" r="83" fill="${paper}"/><path d="M605 401h505v98h-92v84h-96v-84H605z" fill="${accent}"/></g>` +
                dot(1150, 250, 42, ink) + dot(300, 720, 30, ink)
            break
        case "domain":
            motif = `<circle cx="720" cy="450" r="265" fill="${muted}"/><ellipse cx="720" cy="450" rx="125" ry="265" stroke="${ink}" stroke-width="8" fill="none"/><path d="M455 450h530M491 318h458M491 582h458" stroke="${ink}" stroke-width="8"/>` +
                rect(320, 378, 800, 147, ink, 24) +
                `<text x="720" y="481" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="76" fill="${paper}">.ke</text>`
            break
    }
    const texture = Array.from({ length: 12 }, (_, i) => `<path d="M${70 + i * 120} 0v900" stroke="${ink}" opacity=".045" stroke-width="1"/>`).join("")
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900"><title>${escape(label)}</title><rect width="1440" height="900" fill="${paper}"/>${texture}<circle cx="1370" cy="110" r="250" fill="${accent}" opacity=".07"/>${motif}<text x="70" y="82" font-family="sans-serif" font-weight="700" font-size="23" letter-spacing="4" fill="${ink}">TECH HUB / EDITORIAL SAMPLE</text><path d="M70 806h1300" stroke="${ink}" opacity=".3"/><text x="70" y="854" font-family="sans-serif" font-size="22" letter-spacing="3" fill="${ink}">${escape(label.toUpperCase())}</text><text x="1370" y="854" text-anchor="end" font-family="monospace" font-size="24" fill="${accent}">${String(edition + 1).padStart(2, "0")}</text></svg>`
}

const diagrams = {
    dns: ["Name", "Resolver", "DNS answer", "Web server"],
    passkey: ["Website challenge", "Unlock device", "Signed response", "Verify public key"],
    https: ["Browser", "TLS connection", "Website"],
    backup: ["Choose account", "Start backup", "Check completion", "Keep recovery access"],
} as const
export type DiagramKind = keyof typeof diagrams
export function diagramSvg(kind: DiagramKind) {
    const labels = diagrams[kind]
    const width = 1120 / labels.length
    const boxes = labels.map((label, i) => {
        const x = 40 + width * i
        return `<rect x="${x}" y="110" width="${width - 38}" height="120" rx="14" fill="${i === 1 ? "#d62d26" : "#172937"}"/><text x="${x + (width - 38) / 2}" y="178" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="20" fill="#fff8ee">${label}</text>${i < labels.length - 1 ? `<path d="M${x + width - 30} 170h25l-8-8m8 8l-8 8" stroke="#172937" stroke-width="3" fill="none"/>` : ""}`
    }).join("")
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="340" viewBox="0 0 1200 340"><title>Conceptual ${kind} sequence</title><rect width="1200" height="340" fill="#f2ebe0"/><text x="40" y="61" font-family="sans-serif" font-size="19" letter-spacing="3" fill="#172937">TECH HUB / SIMPLIFIED CONCEPT DIAGRAM</text>${boxes}<text x="40" y="296" font-family="sans-serif" font-size="16" fill="#172937">Original illustration. A conceptual overview, not a screenshot or measured result.</text></svg>`
}
