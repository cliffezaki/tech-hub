"use client"
import { useEffect, useState } from "react"
import { MODULES, type RecordData } from "@/lib/modules"
export function RecordManager({ resource }: { resource: string }) {
    const definition = MODULES[resource]
    const [records, setRecords] = useState<RecordData[]>([])
    const [editing, setEditing] = useState<RecordData | null>(null)
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    const [filter, setFilter] = useState("")
    async function load() {
        const r = await fetch(`/api/cms/${resource}`)
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setRecords(d)
    }
    useEffect(() => {
        let active = true
        fetch(`/api/cms/${resource}`)
            .then(async (r) => {
                const d = await r.json()
                if (!r.ok) throw new Error(d.error)
                if (active) setRecords(d)
            })
            .catch((e) => setMessage(e.message))
        return () => {
            active = false
        }
    }, [resource])
    async function save(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setBusy(true)
        setMessage("")
        const form = new FormData(e.currentTarget)
        const data: Record<string, unknown> = {
            ...Object.fromEntries(form),
            id: editing?.id,
        }
        for (const f of definition.fields)
            if (f.type === "checkbox") data[f.key] = form.get(f.key) === "on"
        try {
            const response = await fetch(`/api/cms/${resource}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error)
            setEditing(null)
            await load()
            setMessage("Saved successfully.")
        } catch (e) {
            setMessage((e as Error).message)
        } finally {
            setBusy(false)
        }
    }
    async function remove(id: string) {
        if (!confirm("Delete this record? This cannot be undone.")) return
        const r = await fetch(
            `/api/cms/${resource}?id=${encodeURIComponent(id)}`,
            { method: "DELETE" }
        )
        const d = await r.json()
        if (!r.ok) setMessage(d.error)
        else await load()
    }
    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{definition.title}</h1>
                    <p className="mt-2 max-w-3xl text-muted-foreground">
                        {definition.description}
                    </p>
                </div>
                <button
                    className="cms-primary"
                    onClick={() => setEditing({ id: "" })}
                >
                    {["publishing", "advertising"].includes(resource)
                        ? "Configure"
                        : "Add new"}
                </button>
            </div>
            {message && (
                <p
                    role="status"
                    className="rounded-lg border bg-background p-4"
                >
                    {message}
                </p>
            )}
            {editing && (
                <form
                    key={editing.id}
                    onSubmit={save}
                    className="grid gap-5 rounded-xl border bg-background p-6 md:grid-cols-2"
                >
                    {definition.fields.map((f) => (
                        <label
                            key={f.key}
                            className={
                                f.type === "textarea" ? "md:col-span-2" : ""
                            }
                        >
                            {f.label}
                            {f.required && " *"}
                            {f.type === "textarea" ? (
                                <textarea
                                    className="cms-input"
                                    name={f.key}
                                    rows={4}
                                    defaultValue={String(editing[f.key] || "")}
                                />
                            ) : f.type === "select" ? (
                                <select
                                    className="cms-input"
                                    name={f.key}
                                    defaultValue={String(
                                        editing[f.key] || f.options?.[0]
                                    )}
                                >
                                    {f.options?.map((o) => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            ) : f.type === "checkbox" ? (
                                <input
                                    className="ml-3"
                                    type="checkbox"
                                    name={f.key}
                                    defaultChecked={Boolean(editing[f.key])}
                                />
                            ) : (
                                <input
                                    className="cms-input"
                                    name={f.key}
                                    type={f.type || "text"}
                                    min={f.type === "number" ? 0 : undefined}
                                    step={
                                        f.type === "number" ? "any" : undefined
                                    }
                                    required={f.required}
                                    defaultValue={String(editing[f.key] ?? "")}
                                />
                            )}
                        </label>
                    ))}
                    <div className="flex gap-4 md:col-span-2">
                        <button disabled={busy} className="cms-primary">
                            {busy ? "Saving…" : "Save"}
                        </button>
                        <button type="button" onClick={() => setEditing(null)}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
            <label className="block max-w-sm">
                Search
                <input
                    className="cms-input"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={`Search ${definition.title.toLowerCase()}`}
                />
            </label>
            <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-4">Name / reference</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Updated</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records
                            .filter((r) =>
                                JSON.stringify(r)
                                    .toLowerCase()
                                    .includes(filter.toLowerCase())
                            )
                            .map((r) => (
                                <tr className="border-t" key={r.id}>
                                    <td className="p-4">
                                        <p className="font-semibold">
                                            {String(r.name || definition.title)}
                                        </p>
                                        <p className="mt-1 break-all text-xs text-muted-foreground">
                                            {r.id}
                                        </p>
                                        {r.href && (
                                            <a
                                                href={String(r.href)}
                                                className="underline"
                                            >
                                                {String(r.href)}
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {String(
                                            r.status ||
                                                (r.hidden
                                                    ? "Hidden"
                                                    : r.enabled === false
                                                      ? "Disabled"
                                                      : "—")
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {r.updatedAt
                                            ? new Date(
                                                  r.updatedAt
                                              ).toLocaleDateString()
                                            : "—"}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            className="mr-4 underline"
                                            onClick={() => setEditing(r)}
                                        >
                                            Edit
                                        </button>
                                        {![
                                            "publishing",
                                            "advertising",
                                        ].includes(resource) && (
                                            <button
                                                className="text-red-600"
                                                onClick={() => remove(r.id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {records.length === 0 && (
                    <div className="p-10 text-center text-muted-foreground">
                        No {definition.title.toLowerCase()} yet. Only saved
                        records appear here.
                    </div>
                )}
            </div>
        </section>
    )
}
