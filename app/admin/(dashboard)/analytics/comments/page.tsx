import Link from "next/link"
import { authorized } from "@/lib/accounts"
import { RecordManager } from "@/components/admin/record-manager"
export default async function Page(){if(!(await authorized("comments.moderate")))return <p>Access denied.</p>;return <><Link href="/admin/analytics">Back to analytics</Link><RecordManager resource="comments" /></>}
