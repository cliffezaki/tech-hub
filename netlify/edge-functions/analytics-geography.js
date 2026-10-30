// Netlify overwrites these headers with its own coarse geography before the
// analytics handler runs. Values sent by visitors are never trusted.
export default async function analyticsGeography(request, context) {
    const headers = new Headers(request.headers)
    headers.set("x-techhub-country", context.geo?.country?.code || "")
    headers.set("x-techhub-region", context.geo?.subdivision?.code || "")
    headers.set("x-techhub-region-name", context.geo?.subdivision?.name || "")
    return context.next(new Request(request, { headers }))
}
export const config = { path: "/api/public/event" }
