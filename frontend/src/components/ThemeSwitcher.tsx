import { useTheme } from "../hooks/useTheme"
import { motion } from "framer-motion"
import { Moon, Sun, Stars, Crown } from "lucide-react"

const themes = ["light", "dark", "space", "luxury"] as const

type ThemeIconProps = {
    theme: string;
    isActive: boolean;
}

const ThemeIcon = ({ theme, isActive }: ThemeIconProps) => {
    const iconClass = `w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-foreground'}`
    
    switch(theme) {
        case 'light':
            return <Sun className={iconClass} />
        case 'dark':
            return <Moon className={iconClass} />
        case 'space':
            return <Stars className={iconClass} />
        case 'luxury':
            return <Crown className={iconClass} />
        default:
            return <Sun className={iconClass} />
    }
}

const themeColors = {
    light: {
        bg: "#ffffff",
        accent: "#0284c7"
    },
    dark: {
        bg: "#020817",
        accent: "#0ea5e9"
    },
    space: {
        bg: "#030711",
        accent: "#7c3aed"
    },
    luxury: {
        bg: "#171717",
        accent: "#eab308"
    }
}

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex flex-wrap gap-2">
            {themes.map((t) => {
                const isActive = theme === t;
                return (
                    <motion.button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`relative px-3 py-2 rounded-lg border flex items-center gap-2 transition-all duration-200 ${
                            isActive
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border bg-card hover:bg-card/80 text-foreground hover:border-primary/30"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div 
                            className="w-3 h-3 rounded-full mr-1" 
                            style={{ background: themeColors[t].accent }}
                        />
                        <ThemeIcon theme={t} isActive={isActive} />
                        <span className="capitalize text-sm font-medium">{t}</span>
                        {isActive && (
                            <motion.div
                                className="absolute inset-0 rounded-lg border-2 border-primary"
                                layoutId="activeTheme"
                                initial={false}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    )
}