import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProgressRing from './ProgressRing';

interface Goal {
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

interface EnhancedGoalCardProps {
  goal: Goal;
  onView: (id: string) => void;
  onAchieve: (id: string) => void;
  onUpdate?: (id: string, amount: number) => void;
}

const EnhancedGoalCard: React.FC<EnhancedGoalCardProps> = ({
  goal,
  onView,
  onAchieve,
  onUpdate
}) => {
  const navigate = useNavigate();
  const progress = goal.targetAmount > 0 
    ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) 
    : 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const formatFrequency = (freq: string) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };
  
  const calculateRemainingAmount = () => {
    return Math.max(0, goal.targetAmount - goal.savedAmount);
  };
  
  const calculateTimeLeft = () => {
    const endDate = new Date(goal.endDate);
    const today = new Date();
    
    if (endDate <= today) return 'Expired';
    
    const diffTime = Math.abs(endDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days left`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} left`;
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}
      className="bg-card rounded-lg border border-border overflow-hidden transition-all h-full flex flex-col"
    >
      <div className="p-5 flex-1">
        {/* Header with progress ring and title */}
        <div className="flex items-start gap-3 mb-4">
          {/* Progress ring with percentage */}
          <div className="relative flex-shrink-0">
            <ProgressRing progress={progress} size={60} strokeWidth={5} />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
              {Math.round(progress)}%
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-card-foreground">
              {goal.title}
            </h3>
            {goal.category && (
              <span className="text-sm text-muted-foreground">
                {goal.category}
              </span>
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4">
          {goal.description || `Save for a ${goal.title.toLowerCase()}`}
        </p>
        
        {/* Stats in vertical layout with improved spacing */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground w-16">Target:</span>
            <span className="font-medium text-card-foreground">{formatCurrency(goal.targetAmount)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground w-16">Saved:</span>
            <span className="font-medium text-card-foreground">{formatCurrency(goal.savedAmount)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground w-16">Save:</span>
            <span className="font-medium text-card-foreground">{formatFrequency(goal.saveFrequency)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span className="text-muted-foreground w-16">Time:</span>
            <span className="font-medium text-card-foreground">{calculateTimeLeft()}</span>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex border-t border-border mt-auto">
        <button
          onClick={() => navigate(`/goals/${goal.id}`)}
          className="flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <ArrowRight size={14} />
          View Details
        </button>
        
        <div className="w-px bg-border" />
        
        <button
          onClick={() => onAchieve(goal.id)}
          className="flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
        >
          <CheckCircle size={14} />
          Mark Achieved
        </button>
      </div>
    </motion.div>
  );
};

export default EnhancedGoalCard;