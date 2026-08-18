import { NextResponse } from "next/server"

import { isAdminAccessOpen, isAuthConfigured } from "@/lib/auth"
import { getStoreStatus } from "@/lib/store"

/** Powers the dashboard's environment banner: where content lives and whether it can be saved. */
export async function GET() {
    const status = getStoreStatus()

    return NextResponse.json({
        ...status,
        authConfigured: isAuthConfigured(),
        openAccess: isAdminAccessOpen(),
    })
}
