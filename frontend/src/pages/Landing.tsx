import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, GaugeCircle, Target, Wallet, Globe, Code, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const features = [
    {
        icon: <Target className="w-5 h-5 text-primary" />,
        title: 'Goal Management',
        desc: 'Create, edit, and track goals with progress, dates, and savings targets.'
    },
    {
        icon: <Wallet className="w-5 h-5 text-primary" />,
        title: 'Spending Tracker',
        desc: 'Log monthly spending, earnings, categories, and see summaries over time.'
    },
    {
        icon: <GaugeCircle className="w-5 h-5 text-primary" />,
        title: 'Dashboard Insights',
        desc: 'Overview cards, progress, upcoming target dates, and recent spending.'
    }
]

const techs = [
    { name: 'React + Vite', note: 'Fast dev environment and modern build tooling' },
    { name: 'TypeScript', note: 'Static types for stronger correctness' },
    { name: 'Tailwind CSS', note: 'Utility-first styling and responsive design' },
    { name: 'Framer Motion', note: 'Polished animations, micro-interactions' },
    { name: 'i18next', note: 'Internationalization (English + Khmer)' },
    { name: 'Lucide Icons', note: 'Clean, consistent icon set' },
    { name: 'Go Backend', note: 'Simple, efficient API and data services' }
]

const Landing: React.FC = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                        className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60"
                    >
                        Achieving — Goals, Spending, and Progress, beautifully unified
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="mt-4 text-lg text-muted-foreground max-w-2xl"
                    >
                        Plan and track what matters: set clear goals, visualize progress, and make informed decisions with spending insights — all in one streamlined app.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="mt-8 flex items-center gap-4"
                    >
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <span>Login to Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <Link to="/goals" className="text-primary hover:underline text-sm">
                            Explore goals
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <motion.div
                            key={f.title}
                            whileHover={{ y: -4 }}
                            className="rounded-xl border border-border bg-card p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                {f.icon}
                                <h3 className="text-lg font-semibold">{f.title}</h3>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Technology */}
            <section className="max-w-6xl mx-auto px-6 py-12">
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Code className="text-primary" />
                        <h2 className="text-xl font-bold">Technology</h2>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {techs.map((t) => (
                            <li key={t.name} className="flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                <span className="font-medium">{t.name}</span>
                                <span className="text-muted-foreground">— {t.note}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto px-6 pb-16">
                <div className="text-sm text-muted-foreground">
                    <p>
                        Built with love and focus on clarity. Switch themes and languages via the sidebar inside the app.
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default Landing