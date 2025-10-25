import React from 'react'
import { useTheme } from '../hooks/useTheme'
import { Sun, Moon, Stars, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const themes = ["light", "dark", "space", "luxury"] as const

type ThemeOption = typeof themes[number]

function ThemeIcon({ theme }: { theme: ThemeOption }) {
    const cls = 'w-4 h-4'
    switch (theme) {
        case 'light':
            return <Sun className={cls} />
        case 'dark':
            return <Moon className={cls} />
        case 'space':
            return <Stars className={cls} />
        case 'luxury':
            return <Crown className={cls} />
        default:
            return <Sun className={cls} />
    }
}

export default function ThemeDropdown() {
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation('sidebar')

    const keyToLabel: Record<ThemeOption, string> = {
        light: t('light'),
        dark: t('dark'),
        space: t('space'),
        luxury: t('gold'),
    }
    const currentLabel = keyToLabel[theme as ThemeOption] || t('theme')

    const cycle = () => {
        const idx = themes.indexOf(theme as ThemeOption)
        const next = themes[(idx + 1) % themes.length]
        setTheme(next)
    }

    return (
        <button
            type="button"
            onClick={cycle}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-border bg-card hover:bg-card/80 text-sm"
            aria-label={`${t('theme')}: ${currentLabel}`}
        >
            <span className="flex items-center gap-2">
                <ThemeIcon theme={theme as ThemeOption} />
                <span className="font-medium">{currentLabel}</span>
            </span>
            <span className="text-xs text-muted-foreground">👆</span>
        </button>
    )
}