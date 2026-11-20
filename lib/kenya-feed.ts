import { getRecord } from "@/lib/platform-store"
export interface KenyaStory {id:string; headline:string; summary:string; paragraphs:string[]; publishedAt:string}
export async function kenyaFeed() {
    return (await getRecord<{stories:(KenyaStory & {sources:{name:string;url:string}[]})[]}>("kenya-briefings","feed"))?.stories || []
}
