import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals } from '../contexts/GoalsContext';
import { Target, Plus, Check, Filter, Award, Layers, X, Trophy } from 'lucide-react';
import EnhancedGoalCard from '../components/EnhancedGoalCard';
import GoalModal from '../components/GoalModal';

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
  
  // Sample enhanced goals data
  const sampleGoals: EnhancedGoal[] = [
    {
      id: '1',
      title: 'Buy a New Car',
      description: 'Save for a down payment on a new electric vehicle',
      targetAmount: 10000,
      savedAmount: 2500,
      category: 'Transportation',
      saveFrequency: 'monthly',
      duration: 12,
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      status: 'active',
      createdAt: '2023-01-01'
    },
    {
      id: '2',
      title: 'Emergency Fund',
      description: 'Build a 6-month emergency fund for unexpected expenses',
      targetAmount: 15000,
      savedAmount: 12000,
      category: 'Security',
      saveFrequency: 'weekly',
      duration: 18,
      startDate: '2022-10-01',
      endDate: '2024-04-01',
      status: 'active',
      createdAt: '2022-10-01'
    },
    {
      id: '3',
      title: 'Vacation to Japan',
      description: 'Save for a 2-week trip to Japan',
      targetAmount: 5000,
      savedAmount: 5000,
      category: 'Travel',
      saveFrequency: 'daily',
      duration: 6,
      startDate: '2022-06-01',
      endDate: '2022-12-01',
      status: 'achieved',
      createdAt: '2022-06-01'
    }
  ];
  
  const [enhancedGoals, setEnhancedGoals] = useState<EnhancedGoal[]>(sampleGoals);

  // Hydrate achieved statuses from localStorage so GoalDetails can push achievements
  useEffect(() => {
    try {
      const raw = localStorage.getItem('achieving_enhanced_goals_achieved');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (Array.isArray(ids) && ids.length) {
        setEnhancedGoals(prev => prev.map(g => ids.includes(g.id) ? { ...g, status: 'achieved' } : g));
      }
    } catch (e) {
      console.warn('Failed to hydrate achieved goals', e);
    }
  }, []);

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
    setEnhancedGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === id ? { ...goal, status: 'achieved' } : goal
      )
    );
    // Persist achievement for cross-page consistency
    try {
      const raw = localStorage.getItem('achieving_enhanced_goals_achieved');
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (!ids.includes(id)) {
        localStorage.setItem('achieving_enhanced_goals_achieved', JSON.stringify([...ids, id]));
      }
    } catch (e) {
      console.warn('Failed to persist achieved goal id', e);
    }
    // Surface the achieved tab immediately
    setActiveTab('achieved');
  };
  
  const handleAddGoal = (newGoal: any) => {
    const enhancedNewGoal: EnhancedGoal = {
      ...newGoal,
      id: Date.now().toString(),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    setEnhancedGoals(prev => [...prev, enhancedNewGoal]);
    setShowModal(false);
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
            Your Goals
          </h1>
          <p className="text-muted-foreground mt-1">Plan, track, and achieve what matters most</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
        >
          <Plus size={18} />
          <span className="font-medium">Create New Goal</span>
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
          Active Goals
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
          Achieved Goals
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
                <h3 className="text-xl font-semibold mb-2">No active goals</h3>
                <p className="text-muted-foreground max-w-md">Create a new goal and start tracking your progress.</p>
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
            {achievedGoals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {achievedGoals.map(goal => (
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
                <div className="bg-accent/10 p-4 rounded-full mb-4">
                  <Trophy size={40} className="text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No achieved goals yet</h3>
                <p className="text-muted-foreground max-w-md">Keep pushing—you’ll get there! Completed goals will appear here.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal creation modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Goal</h3>
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
      </AnimatePresence>
    </motion.div>
  );
};

export default Goals;