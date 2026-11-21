import "server-only"
import { claim, getRecord, replaceRecord } from "@/lib/platform-store"
export interface ReaderState {
    recordVersion?: number
    bookmarks: string[]
    history: { articleId: string; at: string }[]
    historyEnabled: boolean
    topics: string[]
    replyNotifications: boolean
}
export function emptyReaderState(): ReaderState { return { bookmarks: [], history: [], historyEnabled: false, topics: [], replyNotifications: true } }
export async function readReaderState(id: string): Promise<ReaderState> {
    return await getRecord<ReaderState>("reader-state", id) || emptyReaderState()
}
export async function updateReaderState(id: string, transform: (state: ReaderState) => ReaderState) {
    await claim("reader-state", id, emptyReaderState())
    const previous = await readReaderState(id)
    return replaceRecord("reader-state", id, previous, transform(structuredClone(previous)))
}
