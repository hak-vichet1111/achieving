import { useTheme } from "../hooks/useTheme"

const themes = ["light", "dark", "space", "luxury"] as const

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex gap-2">
            {themes.map((t) => (
                <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1 rounded-md border ${theme === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                        }`}
                >
                    {t}
                </button>
            ))}
        </div>
    )
}