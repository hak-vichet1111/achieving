import React, { useEffect } from 'react';
import ThemeSwicher from './ThemeSwicher';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import { Home, Settings, X, Info, ChevronRight, Target, Wallet } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import UserProfile from './UserProfile'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    links?: { label: string; href: string; icon?: React.ReactNode }[];
    showThemeSwitcher?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen = true,
    onClose,
    links = [
        { label: 'dashboard', href: '/dashboard' },
        { label: 'goals', href: '/goals' },
        { label: 'spend', href: '/spend' },
        { label: 'settings', href: '/settings' },
    ],
    showThemeSwitcher = true,
}) => {
    // const { theme } = useTheme();
    const { t } = useTranslation('sidebar');
    const location = useLocation();
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8080'
    const { user, token, updateUser, logout } = useAuth()

    useEffect(() => {
        if (token) {
            (async () => {
                try {
                    const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` }
                    const res = await fetch(`${API_BASE}/api/auth/me`, { headers })
                    const text = await res.text(); let data: any = null; try { data = text ? JSON.parse(text) : null } catch { }
                    if (res.ok && data && data.user) {
                        updateUser(data.user)
                    } else if (res.status === 401) {
                        logout()
                    }
                } catch { }
            })()
        }
    }, [token])

    const defaultIcons = {
        dashboard: <Home className="w-5 h-5" />,
        goals: <Target className="w-5 h-5" />,
        spend: <Wallet className="w-5 h-5" />,
        settings: <Settings className="w-5 h-5" />,

    } as Record<string, React.ReactNode>;

    const getIcon = (label: string) => {
        const key = label?.toLowerCase();
        return defaultIcons[key] || <Info className="w-5 h-5" />;
    };

    return (
        <>
            {isOpen && onClose && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 dark:bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 bg-card/95 backdrop-blur-sm border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 ' : '-translate-x-full'} lg:sticky lg:top-0 lg:translate-x-0 lg:transform-none`}
            >
                <div className="h-full lg:h-screen flex flex-col overflow-y-auto">
                    {/* Header */}
                    <div className="relative h-20 flex items-center justify-between px-6 border-b border-border overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>
                        <div className="relative z-10 flex items-center">
                            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mr-3">
                                <Target className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                                Achieving
                            </h2>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="relative z-10 p-2 rounded-full text-foreground hover:bg-secondary hover:text-secondary-foreground focus:outline-none transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* User profile */}
                    <UserProfile name={user?.name || 'User'} email={user?.email || 'you@example.com'} />

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-4">
                        <div className="mb-2 px-4">
                            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Main Navigation</h3>
                        </div>
                        <ul className="space-y-1.5">
                            {links.map((link) => {
                                const isActive = location.pathname === link.href;
                                return (
                                    <li key={link.label}>
                                        <NavLink
                                            to={link.href}
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                                }`
                                            }
                                        >
                                            <span className={`mr-3 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                                                {link.icon || getIcon(link.label)}
                                            </span>
                                            <span className="flex-1">{t(link.label.toLowerCase())}</span>
                                            {isActive && <ChevronRight className="w-4 h-4 text-primary opacity-70" />}
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Theme + Language row */}
                    {showThemeSwitcher && (
                        <div className="p-4 border-t border-border/50 bg-card/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{t('theme')}</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <ThemeSwicher />
                                </div>
                                <LanguageToggle />
                            </div>
                        </div>
                    )}

                </div>
            </aside>
        </>
    );
};

export default Sidebar;
