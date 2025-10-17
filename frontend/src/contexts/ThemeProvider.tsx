import { createContext, useContext, useState, useEffect } from "react"

type Theme = "light" | "dark" | "space" | "luxury"

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    const [theme, setTheme] = useState<Theme>(savedTheme || "light")

    useEffect(() => {
        localStorage.setItem("theme", theme)
        document.documentElement.classList.remove("light", "dark", "space", "luxury")
        document.documentElement.classList.add(theme)
        // document.documentElement.setAttribute("data-theme", theme)
        console.log("theme changed to", theme)
    }, [theme])
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

// export function useTheme() {
//     const context = useContext(ThemeContext)
//     if (!context) throw new Error("useTheme must be used inside ThemeProvider")
//     return context
// }