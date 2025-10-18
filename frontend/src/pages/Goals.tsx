import React, { useState } from 'react';
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <h3 className="text-xl font-semibold mb-2">No active goals yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Create your first goal to start tracking your progress and achieve your financial dreams.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
                >
                  <Plus size={16} />
                  <span>Create New Goal</span>
                </motion.button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Award size={40} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No achieved goals yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Keep working on your active goals. Your achievements will be displayed here.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Goal Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <Target className="text-primary" size={20} />
                  <h2 className="text-xl font-semibold">Create New Goal</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <GoalModal onSubmit={handleAddGoal} onCancel={() => setShowModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Goals;