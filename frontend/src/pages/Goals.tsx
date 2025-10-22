import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals } from '../contexts/GoalsContext';
import { Target, Plus, Check, Filter, Award, Layers, X, Trophy } from 'lucide-react';
import EnhancedGoalCard from '../components/EnhancedGoalCard';
import GoalModal from '../components/GoalModal';
import type { Goal } from '../types/goal';
import { useTranslation } from 'react-i18next';

// Sample goal data structure with enhanced fields
interface EnhancedGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  savedAmount: number;
  category?: string;
  saveFrequency: string;
  duration: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

const Goals = () => {
  const { goals, addGoal, updateStatus, removeGoal } = useGoals();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const { t } = useTranslation('goals');
  
  // Map backend Goal to EnhancedGoal for display-only components
  const toEnhanced = (g: Goal): EnhancedGoal => ({
    id: g.id,
    title: g.title,
    description: g.description ?? '',
    targetAmount: g.targetAmount ?? 0,
    savedAmount: g.currentAmount ?? 0,
    category: g.category ?? '',
    saveFrequency: g.saveFrequency ?? 'monthly',
    duration: g.duration ?? 0,
    startDate: g.startDate ?? g.createdAt,
    endDate: g.endDate ?? g.targetDate ?? '',
    status: g.status === 'completed' ? 'achieved' : 'active',
    createdAt: g.createdAt,
  });

  const enhancedGoals: EnhancedGoal[] = useMemo(() => goals.map(toEnhanced), [goals]);


  // Close modal on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);
  
  const handleViewGoal = (id: string) => {
    console.log(`Viewing goal details for ID: ${id}`);
    // Implement view goal details functionality
  };
  
  const handleAchieveGoal = (id: string) => {
    // Update backend status and show achieved tab
    updateStatus(id, 'completed').catch(e => console.warn('Failed to mark goal achieved', e));
    setActiveTab('achieved');
  };
  
  const handleAddGoal = (newGoal: any) => {
    // Persist new goal to backend through GoalsContext
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
    setActiveTab('active');
  };
  
  const activeGoals = enhancedGoals.filter(goal => goal.status === 'active');
  const achievedGoals = enhancedGoals.filter(goal => goal.status === 'achieved');

  return (
    <motion.div 
      className="space-y-6 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with title and create button */}
      <motion.header 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-6 rounded-xl border border-border/50 backdrop-blur-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
        >
          <Plus size={18} />
          <span className="font-medium">{t('createNewGoal')}</span>
        </motion.button>
      </motion.header>

      {/* Tab navigation for Active/Achieved goals */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'active' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target size={16} />
          {t('activeGoals')}
          {activeGoals.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {activeGoals.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('achieved')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'achieved' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award size={16} />
          {t('achievedGoals')}
          {achievedGoals.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {achievedGoals.length}
            </span>
          )}
        </button>
      </div>

      {/* Active/Achieved Goals Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'active' ? (
          <motion.div
            key="active-goals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {activeGoals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {activeGoals.map(goal => (
                  <EnhancedGoalCard
                    key={goal.id}
                    goal={goal}
                    onView={handleViewGoal}
                    onAchieve={handleAchieveGoal}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Target size={40} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('noActiveGoals')}</h3>
                <p className="text-muted-foreground max-w-md">{t('emptyActiveHelp')}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="achieved-goals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Achieved goals content remains same */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('modalCreateNewGoal')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <GoalModal onCancel={() => setShowModal(false)} onSubmit={handleAddGoal} />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Goals