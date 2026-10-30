import { authorized } from "@/lib/accounts"
import { RecordManager } from "@/components/admin/record-manager"
export default async function Page(){if(!(await authorized("comments.moderate")))return <p>Access denied.</p>;return <><a href="/admin/analytics">Back to analytics</a><RecordManager resource="comments" /></>}
