/** Plain-text comments are rendered by React, never interpreted as HTML. */
export function commentNeedsReview(message: string) {
    return /<\s*(script|iframe|object)\b|javascript\s*:|\b(kill yourself|i will kill you)\b/i.test(message) ||
        (message.match(/https?:\/\//gi) || []).length > 2
}
