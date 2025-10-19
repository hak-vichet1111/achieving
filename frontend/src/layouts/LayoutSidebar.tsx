import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../hooks/useTheme';
import { Outlet } from 'react-router-dom';
import { Home, Target, ListTodo } from 'lucide-react';

const LayoutSidebar = () => {
    const { theme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const links = [
        { label: 'Dashboard', href: '/', icon: <Home className="w-5 h-5" /> },
        { label: 'Goals', href: '/goals', icon: <Target className="w-5 h-5" /> },
        { label: 'Tasks', href: '/tasks', icon: <ListTodo className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
            {/* Sidebar - visible on larger screens by default */}
            <div className="hidden lg:block">
                <Sidebar isOpen={true} links={links} />
            </div>

            {/* Mobile Sidebar - controlled by toggle */}
            <div className="lg:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    links={links}
                />
            </div>
            {/* Main Content */}
            <main className="min-h-screen p-6 w-full">
                {/* Mobile sidebar toggle */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Open Menu
                    </button>
                </div>

                {/* Contents */}
                <div className="w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default LayoutSidebar;