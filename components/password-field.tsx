"use client"
import { useId, useState, type InputHTMLAttributes } from "react"
import { Eye, EyeOff } from "lucide-react"

export function PasswordField({ label, strength = false, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; strength?: boolean }) {
    const id = useId()
    const [visible, setVisible] = useState(false)
    const [value, setValue] = useState("")
    const advice = value.length < 12 ? "Use at least 12 characters. A few unrelated words work well." : value.length < 16 ? "Good length. A longer, unique passphrase is safer." : "Strong length. Use a unique password you do not use elsewhere."
    return <div className="min-w-0"><label htmlFor={id} className="block text-sm font-medium">{label}</label>
        <div className="relative"><input {...props} id={id} type={visible ? "text" : "password"} className={`cms-input ${props.className || ""}`} style={{ ...props.style, paddingRight: "3.25rem" }} maxLength={props.maxLength || 256} aria-describedby={[props["aria-describedby"], strength ? `${id}-help` : ""].filter(Boolean).join(" ") || undefined} onChange={event => { setValue(event.target.value); props.onChange?.(event) }} />
            <button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} className="absolute right-0 top-0 flex h-full min-h-11 w-12 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2">{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
        </div>
        {strength && <p id={`${id}-help`} className="mt-2 text-xs leading-relaxed text-muted-foreground">{advice}</p>}
    </div>
}
