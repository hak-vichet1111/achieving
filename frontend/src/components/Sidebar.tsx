import React from 'react';
import { useTheme } from '../hooks/useTheme';
import ThemeSwitcher from './ThemeSwitcher';
import { useTranslation } from 'react-i18next';
import LanguageSelection from './LanguageSelection';
import { Home, FolderOpen, Users, Calendar, FileText, BarChart3, Settings, X, Info } from 'lucide-react';

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
        { label: 'document', href: '/' },
        { label: 'projects', href: '/projects' },
        { label: 'team', href: '/team' },
        { label: 'calendar', href: '/calendar' },
        { label: 'documents', href: '/documents' },
        { label: 'reports', href: '/reports' },
        { label: 'settings', href: '/settings' },
    ],
    showThemeSwitcher = true,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation('sidebar');

    // Default icons using Lucide React icons
    const defaultIcons = {
        document: <Home className="w-5 h-5" />,
        projects: <FolderOpen className="w-5 h-5" />,
        team: <Users className="w-5 h-5" />,
        calendar: <Calendar className="w-5 h-5" />,
        documents: <FileText className="w-5 h-5" />,
        reports: <BarChart3 className="w-5 h-5" />,
        settings: <Settings className="w-5 h-5" />,
    };

    const getIcon = (label: string) => {
        // @ts-ignore
        return defaultIcons[label] || <Info className="w-5 h-5" />;
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="h-full flex flex-col">
                {/* Sidebar header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                -                    <h2 className="text-xl font-bold text-primary">{t('document')}</h2>
                +                    <h2 className="text-xl font-bold text-primary">Achieving</h2>
                     {onClose && (
                         <button
                             onClick={onClose}
                             className="p-1 rounded-md text-foreground hover:bg-secondary hover:text-secondary-foreground focus:outline-none"
                         >
                             <X className="h-6 w-6" />
                         </button>
                     )}
                 </div>

                {/* Navigation links */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <ul className="space-y-2">
                        {links.map((link) => (
                            <li key={link.label}>
                                <a
                                    href={link.href}
                                    className="flex items-center px-4 py-2 text-foreground hover:bg-secondary hover:text-secondary-foreground rounded-md group transition-colors"
                                >
                                    <span className="mr-3 text-muted-foreground group-hover:text-secondary-foreground transition-colors">
                                        {link.icon || getIcon(link.label)}
                                    </span>
                                    {t(link.label)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Theme switcher at bottom */}
                {showThemeSwitcher && (
                    <div className="p-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">{t('theme')}</p>
                        <ThemeSwitcher />
                    </div>
                )}
                {/* Add translation for sidebar */}
                <div className="p-4 border-t border-border">
                    <LanguageSelection />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;