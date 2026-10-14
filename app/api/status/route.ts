import { NextResponse } from "next/server"

import { isAdminAccessOpen, isAuthConfigured } from "@/lib/auth"
import { getStoreStatus } from "@/lib/store"
import { authorized } from "@/lib/accounts"
import { platformReady } from "@/lib/platform-store"
import { resetConfigured, resetConfigurationIssues } from "@/lib/password-reset"

/** Powers the dashboard's environment banner: where content lives and whether it can be saved. */
export async function GET() {
    const status = getStoreStatus()
    const canManageSettings = isAuthConfigured() && platformReady() &&
        Boolean(await authorized("settings.manage"))

    return NextResponse.json({
        ...status,
        authConfigured: isAuthConfigured(),
        openAccess: isAdminAccessOpen(),
        ...(canManageSettings ? {
            passwordResetConfigured: resetConfigured(),
            passwordResetConfigurationIssues: resetConfigurationIssues(),
        } : {}),
    }, { headers: { "Cache-Control": "no-store", Vary: "Cookie" } })
}
