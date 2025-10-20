import React, { useState } from 'react'
import { useTheme } from '../hooks/useTheme';
import { useGoals } from '../contexts/GoalsContext';
import GoalCard from '../components/GoalCard';
import ProgressRing from '../components/ProgressRing';
import GoalModal from '../components/GoalModal';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Clock, Target, ArrowRight, Plus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { theme } = useTheme();
  const { goals, addGoal, updateStatus, removeGoal } = useGoals();

  const notStarted = goals.filter(g => g.status === 'not_started').length;
  const inProgress = goals.filter(g => g.status === 'in_progress').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const total = goals.length;
  const completionPercent = total ? Math.round((completed / total) * 100) : 0;

  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

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

  const handleQuickAdd = (newGoal: any) => {
    // Map GoalModal fields to backend payload
    addGoal({
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      saveFrequency: newGoal.saveFrequency,
      duration: newGoal.duration,
      startDate: newGoal.startDate,
      endDate: newGoal.endDate,
      targetDate: newGoal.endDate || newGoal.targetDate,
      targetAmount: newGoal.targetAmount,
      currentAmount: newGoal.savedAmount ?? 0,
    });
    setShowModal(false);
  };

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
            Your Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Track your goals and progress at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={16} />
            <span>New Goal</span>
          </button>
          <Link to="/goals" className="text-sm text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
      </motion.header>

      {/* Status summary with icons and improved styling */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
          className="bg-card rounded-xl p-6 border border-border flex items-center gap-4 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Not Started</p>
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
            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
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
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-foreground">{completed}</p>
          </div>
        </motion.div>
      </motion.section>

      {/* Overall progress + upcoming targets */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6 border border-border flex items-center gap-6">
          <ProgressRing progress={completionPercent} size={96} strokeWidth={8} />
          <div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-2xl font-bold">{completionPercent}%</p>
            <p className="text-sm text-muted-foreground">Completed {completed} of {total}</p>
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-primary" size={18} />
            <h2 className="text-lg font-semibold">Upcoming Targets</h2>
          </div>
          {upcomingGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming target dates.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingGoals.map(g => (
                <li key={g.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{g.title}</p>
                    {g.targetDate && (
                      <p className="text-xs text-muted-foreground">Target: {new Date(g.targetDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Link to={`/goals`} className="text-sm text-primary flex items-center gap-1 hover:underline">
                    View <ArrowRight size={14} />
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
            <h2 className="text-xl font-semibold">Goals</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('not_started')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'not_started' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Not Started
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'in_progress' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 text-sm font-medium ${statusFilter === 'completed' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Completed
          </button>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No goals match this filter.</p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <Plus size={16} />
              <span>Create Goal</span>
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

      {/* Goal creation modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -20 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Goal</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  {/* X icon from lucide-react is already imported in Goals page; use Plus here for consistency */}
                  <span className="sr-only">Close</span>
                </button>
              </div>
              <GoalModal onCancel={() => setShowModal(false)} onSubmit={handleQuickAdd} />
            </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Dashboard