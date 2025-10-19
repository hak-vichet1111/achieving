import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Calendar, 
  DollarSign, 
  Clock, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Sparkles
} from 'lucide-react';
import { useGoals } from '../contexts/GoalsContext';
import ProgressRing from '../components/ProgressRing';
import StatusBadge from '../components/StatusBadge';

// Badge status types
type BadgeStatus = 'early' | 'onTime' | 'late' | 'missed';

// Badge interface
interface SavingBadge {
  id: string;
  date: string;
  amount: number;
  status: BadgeStatus;
  completed: boolean;
  progressAmount: number; // amount saved toward this badge
  lastUpdatedAt?: string; // ISO datetime of last user update
}

const GoalDetails = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsMessage, setCongratsMessage] = useState('');
  // New: Big congrats overlay state
  const [showGoalCongrats, setShowGoalCongrats] = useState(false);
  
  // Sample enhanced goals data (in a real app, this would come from context or API)
  const sampleGoals = [
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
      savedAmount: 8250,
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
      title: 'Dream Vacation to Japan',
      description: 'Two weeks exploring Tokyo, Kyoto, and Mount Fuji',
      targetAmount: 5000,
      savedAmount: 1200,
      category: 'Travel',
      saveFrequency: 'monthly',
      duration: 6,
      startDate: '2023-06-01',
      endDate: '2023-12-01',
      status: 'active',
      createdAt: '2023-06-01'
    }
  ];
  
  const [goal, setGoal] = useState(sampleGoals.find(g => g.id === goalId));
  const [editedGoal, setEditedGoal] = useState(goal);
  
  // Generate saving badges based on frequency
  const generateSavingBadges = () => {
    if (!goal) return [];
    
    const badges: SavingBadge[] = [];
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const today = new Date();
    
    let currentDate = new Date(startDate);
    let badgeAmount = 0;
    
    // Calculate amount per badge based on frequency
    switch(goal.saveFrequency) {
      case 'daily':
        badgeAmount = goal.targetAmount / (Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        break;
      case 'weekly':
        badgeAmount = goal.targetAmount / (Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        break;
      case 'monthly':
        badgeAmount = goal.targetAmount / (
          (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
          endDate.getMonth() - startDate.getMonth() + 1
        );
        break;
      default:
        badgeAmount = goal.targetAmount / 12; // Default to monthly
    }
    
    // Round to 2 decimal places
    badgeAmount = Math.round(badgeAmount * 100) / 100;
    
    // Generate badges
    while (currentDate <= endDate) {
      const badgeDate = new Date(currentDate);
      
      // Determine badge status
      let status: BadgeStatus = 'onTime';
      if (badgeDate < today) {
        // Past badge
        const daysDiff = Math.floor((today.getTime() - badgeDate.getTime()) / (1000 * 60 * 60 * 24));
        status = daysDiff <= 3 ? 'late' : 'missed';
      } else if (badgeDate > today) {
        // Future badge
        status = 'early';
      }
      
      // Determine if badge is completed (user-driven; default false)
      const completed = false;
      
      badges.push({
        id: `badge-${badges.length + 1}`,
        date: badgeDate.toISOString().split('T')[0],
        amount: badgeAmount,
        status,
        completed,
        progressAmount: 0
      });
      
      // Increment date based on frequency
      switch(goal.saveFrequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate.setMonth(currentDate.getMonth() + 1); // Default to monthly
      }
    }
    
    return badges;
  };
  
  const [badges, setBadges] = useState<SavingBadge[]>(generateSavingBadges());
  
  useEffect(() => {
    // In a real app, fetch goal data from API or context
    const foundGoal = sampleGoals.find(g => g.id === goalId);
    setGoal(foundGoal);
    setEditedGoal(foundGoal);
    
    if (foundGoal) {
      setBadges(generateSavingBadgesFor(foundGoal));
    }
  }, [goalId]);
  
  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <AlertCircle size={48} className="text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Goal Not Found</h2>
        <p className="text-muted-foreground mb-6">The goal you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/goals')}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back to Goals
        </button>
      </div>
    );
  }
  
  const progress = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };
  
  const handleSave = () => {
    if (editedGoal) {
      const nextBadges = regenerateBadgesFromGoal(badges, editedGoal);
      const total = nextBadges.reduce((sum, b) => sum + Math.max(0, Math.min(b.amount, b.progressAmount)), 0);
      setBadges(nextBadges);
      setGoal(() => ({ ...(editedGoal as any), savedAmount: Math.min(editedGoal.targetAmount, Math.round(total * 100) / 100) }));
      setIsEditing(false);
    }
  };
  
  const handleCancel = () => {
    setEditedGoal(goal);
    setIsEditing(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedGoal(prev => {
      if (!prev) return prev;
      
      if (name === 'targetAmount' || name === 'savedAmount') {
        return { ...prev, [name]: parseFloat(value) || 0 };
      }
      
      return { ...prev, [name]: value };
    });
  };
  
  const handleBadgeProgressChange = (badgeId: string, newAmount: number) => {
    const nowIso = new Date().toISOString();
    setBadges(prev => prev.map(b =>
      b.id === badgeId
        ? { ...b, progressAmount: Math.max(0, Math.min(b.amount, newAmount)), lastUpdatedAt: nowIso }
        : b
    ));
    // Recompute savedAmount based on badges
    setGoal(prev => {
      if (!prev) return prev;
      const total = badges.reduce((sum, b) => sum + (b.id === badgeId ? Math.max(0, Math.min(b.amount, newAmount)) : b.progressAmount), 0);
      return { ...prev, savedAmount: Math.min(prev.targetAmount, Math.round(total * 100) / 100) };
    });
  };
  
  const handleBadgeComplete = (badgeId: string) => {
    const badgeToComplete = badges.find(b => b.id === badgeId);
    if (!badgeToComplete) return;

    // Only allow completion when progress reached 100%
    if (badgeToComplete.progressAmount < badgeToComplete.amount) {
      return;
    }

    const nowIso = new Date().toISOString();
    // Mark the badge as completed, set progress to full amount, and timestamp update
    setBadges(prev => prev.map(b => (
      b.id === badgeId ? { ...b, completed: true, progressAmount: b.amount, lastUpdatedAt: nowIso } : b
    )));

    // Recompute goal's saved amount from badges (sum of progressAmount)
    setGoal(prev => {
      if (!prev) return prev;
      const total = badges.reduce((sum, b) => sum + (b.id === badgeId ? b.amount : b.progressAmount), 0);
      return { ...prev, savedAmount: Math.min(prev.targetAmount, Math.round(total * 100) / 100) };
    });

    // Show congratulation message
    setCongratsMessage(`Great job! You've saved ${formatCurrency(badgeToComplete.amount)} towards your goal.`);
    setShowCongrats(true);

    // Hide congratulation after 3 seconds
    setTimeout(() => setShowCongrats(false), 3000);
  };

  // New: detect full completion and show big congrats + mark achieved
  useEffect(() => {
    if (!goal) return;
    const allCompleted = badges.length > 0 && badges.every(b => b.completed);
    const currentProgress = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
    if (allCompleted && currentProgress >= 100 && !showGoalCongrats) {
      setShowGoalCongrats(true);
      // Mark local goal as achieved
      setGoal(prev => prev ? { ...prev, status: 'achieved' } : prev);
      // Persist achieved goal id for Goals page hydration
      try {
        const raw = localStorage.getItem('achieving_enhanced_goals_achieved');
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(goal.id)) {
          localStorage.setItem('achieving_enhanced_goals_achieved', JSON.stringify([...ids, goal.id]));
        }
      } catch (e) {
        console.warn('Failed to persist achieved goal id', e);
      }
      // Auto-hide after 4s
      const timer = setTimeout(() => setShowGoalCongrats(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [badges, goal, showGoalCongrats]);
  
  const getBadgeStatusIcon = (status: BadgeStatus, completed: boolean) => {
    if (completed) {
      return <CheckCircle size={16} className="text-accent" />;
    }
    
    switch (status) {
      case 'early':
        return <Clock size={16} className="text-muted-foreground" />;
      case 'onTime':
        return <CheckCircle size={16} className="text-primary" />;
      case 'late':
        return <AlertCircle size={16} className="text-destructive" />;
      case 'missed':
        return <XCircle size={16} className="text-destructive" />;
      default:
        return null;
    }
  };
  
  const getBadgeStatusText = (status: BadgeStatus, completed: boolean) => {
    if (completed) {
      return 'Completed';
    }
    
    switch (status) {
      case 'early':
        return 'Upcoming';
      case 'onTime':
        return 'Due Today';
      case 'late':
        return 'Overdue';
      case 'missed':
        return 'Missed';
      default:
        return '';
    }
  };
  
  const getBadgeStatusClass = (status: BadgeStatus, completed: boolean) => {
    if (completed) {
      return 'bg-accent/10 text-accent border-accent/30';
    }
    
    switch (status) {
      case 'early':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      case 'onTime':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'late':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'missed':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return '';
    }
  };
  
  return (
    <motion.div 
      className="space-y-6 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Congratulation message */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-accent text-accent-foreground px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
          >
            <Sparkles className="text-accent-foreground" size={20} />
            <span>{congratsMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big goal achieved overlay */}
      <AnimatePresence>
        {showGoalCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-xl text-center max-w-sm"
            >
              <div className="mx-auto mb-4 bg-accent/10 text-accent rounded-full w-20 h-20 flex items-center justify-center">
                <Award size={44} />
              </div>
              <h3 className="text-xl font-bold mb-1">Congratulations!</h3>
              <p className="text-muted-foreground mb-4">You've achieved your goal.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowGoalCongrats(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate('/goals')}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  View Achieved
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header with back button and edit/save buttons */}
      <motion.header 
        className="flex items-center justify-between gap-4 bg-card/50 p-6 rounded-xl border border-border/50 backdrop-blur-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/goals')}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={editedGoal?.title || ''}
                  onChange={handleInputChange}
                  className="bg-background border border-input rounded-md px-3 py-1 w-full max-w-md"
                />
              ) : (
                goal.title
              )}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? (
                <select
                  name="category"
                  value={editedGoal?.category || ''}
                  onChange={handleInputChange}
                  className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                >
                  <option value="">No Category</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Housing">Housing</option>
                  <option value="Travel">Travel</option>
                  <option value="Education">Education</option>
                  <option value="Security">Security</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              ) : (
                goal.category || 'No Category'
              )}
            </p>
          </div>
        </div>
        
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Edit size={16} />
              <span>Edit Goal</span>
            </button>
          )}
        </div>
      </motion.header>
      
      {/* Main content with goal details and badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Goal details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Progress card */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Progress</h2>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative mb-4">
                {/* <ProgressRing progress={progress} size={120} strokeWidth={8} /> */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{progress}%</span>
                  <span className="text-xs text-muted-foreground">completed</span>
                </div>
              </div>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saved</span>
                  <span className="font-medium">
                    {isEditing ? (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2">$</span>
                        <input
                          type="number"
                          name="savedAmount"
                          value={editedGoal?.savedAmount || 0}
                          onChange={handleInputChange}
                          className="bg-background border border-input rounded-md pl-6 pr-2 py-1 w-24 text-right"
                        />
                      </div>
                    ) : (
                      formatCurrency(goal.savedAmount)
                    )}
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">
                    {isEditing ? (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2">$</span>
                        <input
                          type="number"
                          name="targetAmount"
                          value={editedGoal?.targetAmount || 0}
                          onChange={handleInputChange}
                          className="bg-background border border-input rounded-md pl-6 pr-2 py-1 w-24 text-right"
                        />
                      </div>
                    ) : (
                      formatCurrency(goal.targetAmount)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Details card */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editedGoal?.description || ''}
                    onChange={handleInputChange}
                    className="bg-background border border-input rounded-md px-3 py-2 w-full min-h-[80px]"
                  />
                ) : (
                  <p>{goal.description || 'No description provided.'}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Save Frequency</label>
                  {isEditing ? (
                    <select
                      name="saveFrequency"
                      value={editedGoal?.saveFrequency || ''}
                      onChange={handleInputChange}
                      className="bg-background border border-input rounded-md px-2 py-1 w-full"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  ) : (
                    <p className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      {formatFrequency(goal.saveFrequency)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Duration</label>
                  {isEditing ? (
                    <div className="flex lg:flex-col items-center gap-2">
                      <span>months</span>
                      <input
                        type="number"
                        name="duration"
                        value={editedGoal?.duration || 0}
                        onChange={handleInputChange}
                        className="bg-background border border-input rounded-md  py-1 w-full"
                      />
                      
                    </div>
                  ) : (
                    <p>{goal.duration} months</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="startDate"
                      value={editedGoal?.startDate || ''}
                      onChange={handleInputChange}
                      className="bg-background border border-input rounded-md px-3 py-1 w-full"
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted-foreground" />
                      {formatDate(goal.startDate)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="endDate"
                      value={editedGoal?.endDate || ''}
                      onChange={handleInputChange}
                      className="bg-background border border-input rounded-md px-3 py-1 w-full"
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted-foreground" />
                      {formatDate(goal.endDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Right column: Saving badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="bg-card rounded-xl border border-border p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Saving Badges</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Award size={16} />
                <span>{badges.filter(b => b.completed).length} of {badges.length} completed</span>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {badges.map((badge) => (
                <div key={badge.id} className="mb-4">
                  <StatusBadge
                    isSavingBadge={true}
                    status={badge.status}
                    targetDate={badge.date}
                    amount={badge.amount}
                    currentAmount={badge.progressAmount}
                    completed={badge.completed}
                    lastUpdatedAt={badge.lastUpdatedAt}
                    onComplete={() => handleBadgeComplete(badge.id)}
                    onProgressChange={(newAmount) => handleBadgeProgressChange(badge.id, newAmount)}
                  />
                </div>
              ))}
              
              {badges.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Award size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No saving badges</h3>
                  <p className="text-muted-foreground max-w-md">
                    Edit your goal to set up a saving schedule and track your progress with badges.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GoalDetails;

// Helper: generate badges for a given goal object
const generateSavingBadgesFor = (g: any): SavingBadge[] => {
  if (!g) return [];
  const badges: SavingBadge[] = [];
  const startDate = new Date(g.startDate);
  const endDate = new Date(g.endDate);
  const today = new Date();

  let currentDate = new Date(startDate);
  let badgeAmount = 0;

  switch (g.saveFrequency) {
    case 'daily':
      badgeAmount = g.targetAmount / (Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      break;
    case 'weekly':
      badgeAmount = g.targetAmount / (Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
      break;
    case 'monthly':
      badgeAmount = g.targetAmount / (((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth() + 1));
      break;
    default:
      badgeAmount = g.targetAmount / 12;
  }

  badgeAmount = Math.round(badgeAmount * 100) / 100;

  while (currentDate <= endDate) {
    const badgeDate = new Date(currentDate);
    let status: BadgeStatus = 'onTime';
    if (badgeDate < today) {
      const daysDiff = Math.floor((today.getTime() - badgeDate.getTime()) / (1000 * 60 * 60 * 24));
      status = daysDiff <= 3 ? 'late' : 'missed';
    } else if (badgeDate > today) {
      status = 'early';
    }

    const completed = false;

    badges.push({
      id: `badge-${badges.length + 1}`,
      date: badgeDate.toISOString().split('T')[0],
      amount: badgeAmount,
      status,
      completed,
      progressAmount: 0,
    });

    switch (g.saveFrequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return badges;
};

// Helper: regenerate badges preserving progress by matching date
const regenerateBadgesFromGoal = (prevBadges: SavingBadge[], g: any): SavingBadge[] => {
  const next = generateSavingBadgesFor(g);
  const prevByDate = new Map<string, SavingBadge>();
  prevBadges.forEach(b => prevByDate.set(b.date, b));
  return next.map(nb => {
    const prev = prevByDate.get(nb.date);
    if (!prev) return nb;
    const clampedProgress = Math.max(0, Math.min(nb.amount, prev.progressAmount));
    const completed = prev.completed && clampedProgress >= nb.amount;
    return { ...nb, progressAmount: clampedProgress, completed, lastUpdatedAt: prev.lastUpdatedAt };
  });
};