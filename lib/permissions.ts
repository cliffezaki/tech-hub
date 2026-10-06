export const PERMISSIONS = [
    "articles.create",
    "articles.editOwn",
    "articles.editAll",
    "articles.delete",
    "articles.publish",
    "articles.unpublish",
    "articles.feature",
    "pages.manage",
    "categories.manage",
    "media.manage",
    "comments.moderate",
    "analytics.view",
    "users.manage",
    "settings.manage",
    "homepage.manage",
    "menus.manage",
    "subscribers.manage",
    "ads.inquiries",
    "ads.advertisers",
    "ads.campaigns",
    "ads.publish",
    "ads.delete",
    "ads.revenue",
    "ads.analytics",
    "ads.export",
    "ads.settings",
] as const
export type Permission = (typeof PERMISSIONS)[number]
export const ROLES = [
    "owner",
    "administrator",
    "editor",
    "author",
    "contributor",
    "reader",
] as const
export type Role = (typeof ROLES)[number]
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    owner: [...PERMISSIONS],
    administrator: PERMISSIONS.filter((p) => p !== "users.manage"),
    editor: [
        "articles.create",
        "articles.editOwn",
        "articles.editAll",
        "articles.delete",
        "articles.publish",
        "articles.unpublish",
        "articles.feature",
        "pages.manage",
        "categories.manage",
        "media.manage",
        "comments.moderate",
        "homepage.manage",
    ],
    author: ["articles.create", "articles.editOwn", "media.manage"],
    contributor: ["articles.create", "articles.editOwn"],
    reader: [],
}
export interface User {
    id: string
    name: string
    email: string
    passwordHash: string
    role: Role
    status: "active" | "suspended"
    permissions?: Permission[]
    deniedPermissions?: Permission[]
    sessionVersion: number
    createdAt: string
    subscribed: boolean
}
export function permissionsFor(
    user: User,
    roles = ROLE_PERMISSIONS
): Permission[] {
    if (user.role === "owner") return [...PERMISSIONS]
    return [
        ...new Set([...(roles[user.role] || []), ...(user.permissions || [])]),
    ].filter((p) => !user.deniedPermissions?.includes(p))
}
export function safeUser(user: User) {
    const { passwordHash, ...rest } = user
    void passwordHash
    return rest
}
export const ADMIN_NAV = [
    { href: "/admin", label: "Dashboard", permission: null },
    {
        href: "/admin/articles",
        label: "Articles",
        permission: "articles.editOwn",
    },
    { href: "/admin/pages", label: "Pages", permission: "pages.manage" },
    {
        href: "/admin/categories",
        label: "Categories",
        permission: "categories.manage",
    },
    { href: "/admin/media", label: "Media", permission: "media.manage" },
    {
        href: "/admin/comments",
        label: "Comments",
        permission: "comments.moderate",
    },
    {
        href: "/admin/users",
        label: "Users & roles",
        permission: "users.manage",
    },
    {
        href: "/admin/subscribers",
        label: "Subscribers",
        permission: "subscribers.manage",
    },
    {
        href: "/admin/analytics",
        label: "Analytics",
        permission: "analytics.view",
    },
    {
        href: "/admin/advertising",
        label: "Advertising",
        permission: "ads.campaigns",
    },
    {
        href: "/admin/navigation",
        label: "Navigation / menus",
        permission: "menus.manage",
    },
    {
        href: "/admin/homepage",
        label: "Homepage",
        permission: "homepage.manage",
    },
    {
        href: "/admin/settings",
        label: "Settings",
        permission: "settings.manage",
    },
] as const
