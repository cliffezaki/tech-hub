/* Shared font allowlist for the editor, previews and public articles. */
export const FONT_GROUPS = {
    "Sans serif": [
        "Inter",
        "Roboto",
        "Open Sans",
        "Lato",
        "Montserrat",
        "Source Sans 3",
        "Nunito Sans",
        "Work Sans",
        "DM Sans",
        "Manrope",
        "Raleway",
        "Ubuntu",
        "PT Sans",
        "IBM Plex Sans",
        "Fira Sans",
        "Space Grotesk",
        "Oswald"
    ],
    "Serif": [
        "Playfair Display",
        "Merriweather",
        "Lora",
        "Source Serif 4",
        "Libre Baskerville",
        "Crimson Pro",
        "EB Garamond",
        "Bitter",
        "PT Serif",
        "IBM Plex Serif"
    ],
    "Monospace": [
        "IBM Plex Mono",
        "Fira Code",
        "JetBrains Mono"
    ],
    "System fonts": [
        "Arial",
        "Georgia",
        "Verdana",
        "Times New Roman",
        "Courier New"
    ]
} as const
export const ARTICLE_FONTS: readonly string[] = Object.values(FONT_GROUPS).flat()
