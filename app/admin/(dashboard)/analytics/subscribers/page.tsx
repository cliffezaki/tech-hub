import Link from "next/link"
import { authorized } from "@/lib/accounts"
import { UserManager } from "@/components/admin/user-manager"
export default async function Page(){if(!(await authorized("subscribers.manage")))return <p>Access denied.</p>;return <><Link href="/admin/analytics">Back to analytics</Link><UserManager subscribersOnly /></>}
