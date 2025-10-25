import React, { useState } from 'react'
import { useTheme } from '../hooks/useTheme';
import { useGoals } from '../contexts/GoalsContext';
import GoalCard from '../components/GoalCard';
import ProgressRing from '../components/ProgressRing';
import GoalModal from '../components/GoalModal';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Clock, Target, ArrowRight, Plus, Calendar, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSpending } from '../contexts/SpendingContext';
import { useTranslation } from 'react-i18next'

const Dashboard = () => {
  const { theme } = useTheme();
  const { goals, addGoal, updateStatus, removeGoal } = useGoals();
  const { totalThisMonth, recentMonths } = useSpending();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard')

  const notStarted = goals.filter(g => g.status === 'not_started').length;
  const inProgress = goals.filter(g => g.status === 'in_progress').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const total = goals.length;
  const completionPercent = total ? Math.round((completed / total) * 100) : 0;

  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [chartType, setChartType] = useState<'bars' | 'line'>('bars');

  const filteredGoals = statusFilter === 'all' ? goals : goals.filter(g => g.status === statusFilter);
  const upcomingGoals = goals
    .filter(g => g.targetDate && g.status !== 'completed')
    .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())
    .slice(0, 3);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const maxRecent = Math.max(1, ...recentMonths.slice(0, 6).map(m => m.total))
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <motion.div
      className="space-y-8 p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-6 rounded-xl border border-border/50 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            {t('header_title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('header_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={16} />
            <span>{t('new_goal')}</span>
          </button>
          <Link to="/goals" className="text-sm text-primary flex items-center gap-1 hover:underline">
            {t('view_all')} <ArrowRight size={14} />
          </Link>
        </div>
      </motion.header>

      {/* Status summary cards */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
          className="bg-card rounded-xl p-6 border border-border flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('status_not_started')}</p>
            <p className="text-3xl font-bold text-foreground">{notStarted}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
          className="bg-card rounded-xl p-6 border border-border flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('status_in_progress')}</p>
            <p className="text-3xl font-bold text-foreground">{inProgress}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
          className="bg-card rounded-xl p-6 border border-border flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('status_completed')}</p>
            <p className="text-3xl font-bold text-foreground">{completed}</p>
          </div>
        </motion.div>
      </motion.section>

      {/* Spending summary + history side-by-side */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spent This Month card */}
        <motion.div
          whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
          className="bg-card rounded-xl p-6 border border-border flex items-center justify-between gap-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('spent_this_month')}</p>
              <p className="text-3xl font-bold text-foreground">${totalThisMonth.toLocaleString()}</p>
              <Link to={`/spend/${currentMonthKey}`} className="text-xs text-primary hover:underline">{t('view_spending')}</Link>
            </div>
          </div>
        </motion.div>

        {/* Last Months card with chart options */}
        <motion.div
          whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
          className="lg:col-span-2 bg-card rounded-xl p-6 border border-border transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('last_months')}</h3>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="text-sm bg-transparent border border-border rounded-md px-2 py-1"
            >
              <option value="bars">{t('chart_bars')}</option>
              <option value="line">{t('chart_line')}</option>
            </select>
          </div>

          {/* Chart display */}
          {chartType === 'bars' ? (
            <div className="mt-4 h-32 flex items-end gap-2">
              {recentMonths.slice(0, 6).reverse().map((m) => {
                const height = Math.max(6, Math.round((m.total / maxRecent) * 100))
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                      className="w-full rounded-md cursor-pointer bg-gradient-to-t from-primary/20 to-primary/60 shadow-sm hover:from-primary/30 hover:to-primary/70"
                      onClick={() => navigate(`/spending/${m.key}`)}
                      title={`${m.label}: $${m.total.toLocaleString()}`}
                    />
                    <span className="mt-2 text-xs text-muted-foreground">{m.label.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <svg className="mt-4 w-full h-32" viewBox="0 0 240 64">
              {(() => {
                const points = recentMonths.slice(0, 6).reverse().map((m, i) => {
                  const x = (i / 5) * 240
                  const y = 64 - (m.total / maxRecent) * 60
                  return `${x},${y}`
                }).join(' ')
                return (
                  <>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
                    <polygon points={`${points} 240,64 0,64`} fill="url(#lineGrad)" />
                  </>
                )
              })()}
            </svg>
          )}

          {/* Clickable month list */}
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {recentMonths.slice(0, 6).map(m => (
              <li key={m.key}>
                <button
                  onClick={() => navigate(`/spending/${m.key}`)}
                  className="w-full text-left text-sm px-2 py-2 rounded-md hover:bg-muted flex items-center justify-between"
                >
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">${m.total.toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.section>

      {/* Overall progress + upcoming targets */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6 border border-border flex items-center gap-6">
          <ProgressRing progress={completionPercent} size={96} strokeWidth={8} />
          <div>
            <p className="text-sm text-muted-foreground">{t('overall_progress')}</p>
            <p className="text-2xl font-bold">{completionPercent}%</p>
            <p className="text-sm text-muted-foreground">{t('completed_of_total', { completed, total })}</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-primary" size={18} />
            <h2 className="text-lg font-semibold">{t('upcoming_targets')}</h2>
          </div>
          {upcomingGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('no_upcoming_targets')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingGoals.map(g => (
                <li key={g.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{g.title}</p>
                    {g.targetDate && (
                      <p className="text-xs text-muted-foreground">{t('target_label', { date: new Date(g.targetDate).toLocaleDateString() })}</p>
                    )}
                  </div>
                  <Link to={`/goals`} className="text-sm text-primary flex items-center gap-1 hover:underline">
                    {t('view')} <ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>

      {/* Goals list with filters */}
      <motion.section variants={itemVariants} className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="text-primary" size={20} />
            <h2 className="text-xl font-semibold">{t('goals_title')}</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('filter_all')}
          </button>
          <button
            onClick={() => setStatusFilter('not_started')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'not_started' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('filter_not_started')}
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'in_progress' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('filter_in_progress')}
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'completed' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('filter_completed')}
          </button>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">{t('no_goals_filter')}</p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <Plus size={16} />
              <span>{t('create_goal')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.slice(0, 8).map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GoalCard
                  goal={goal}
                  onUpdateStatus={(status) => updateStatus(goal.id, status)}
                  onRemove={() => removeGoal(goal.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  )
}

export default Dashboard