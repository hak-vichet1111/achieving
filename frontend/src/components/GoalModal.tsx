import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Clock, Tag, CheckCircle } from 'lucide-react';

interface GoalModalProps {
  onSubmit: (goal: any) => void;
  onCancel: () => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('');
  const [saveFrequency, setSaveFrequency] = useState('monthly');
  const [duration, setDuration] = useState('6');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [saveAmount, setSaveAmount] = useState('');
  
  // Calculate end date and saving schedule when duration or start date changes
  useEffect(() => {
    if (startDate && duration) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(start.getMonth() + parseInt(duration));
      setEndDate(end.toISOString().split('T')[0]);
      
      // Calculate saving amount per period
      if (targetAmount) {
        const target = parseFloat(targetAmount);
        const months = parseInt(duration);
        
        let amountPerPeriod = 0;
        
        switch (saveFrequency) {
          case 'daily':
            // Approximate days in the selected months
            const days = months * 30;
            amountPerPeriod = target / days;
            break;
          case 'weekly':
            // Approximate weeks in the selected months
            const weeks = months * 4.33;
            amountPerPeriod = target / weeks;
            break;
          case 'monthly':
            amountPerPeriod = target / months;
            break;
          default:
            amountPerPeriod = target / months;
        }
        
        setSaveAmount(amountPerPeriod.toFixed(2));
      }
    }
  }, [startDate, duration, targetAmount, saveFrequency]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !targetAmount || !saveFrequency || !duration) return;
    
    const newGoal = {
      title,
      description,
      targetAmount: parseFloat(targetAmount),
      savedAmount: 0,
      category,
      saveFrequency,
      duration: parseInt(duration),
      startDate,
      endDate,
      status: 'active',
    };
    
    onSubmit(newGoal);
  };
  
  const categories = [
    'Transportation', 'Housing', 'Education', 'Travel', 
    'Emergency', 'Retirement', 'Investment', 'Other'
  ];
  
  const formatCurrency = (value: string) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(parseFloat(value));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Goal Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            placeholder="What do you want to achieve?"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all min-h-[80px]"
            placeholder="Add details about your goal..."
          />
        </div>
      </div>
      
      {/* Financial Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="text-primary" size={18} />
          <h3 className="text-lg font-semibold">Financial Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-foreground mb-1">
              Target Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                id="targetAmount"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Time and Saving Schedule */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="text-primary" size={18} />
          <h3 className="text-lg font-semibold">Time and Saving Schedule</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="saveFrequency" className="block text-sm font-medium text-foreground mb-1">
              Save Frequency *
            </label>
            <select
              id="saveFrequency"
              value={saveFrequency}
              onChange={(e) => setSaveFrequency(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-foreground mb-1">
              Duration (months) *
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              min="1"
              max="60"
              required
            />
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              required
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none transition-all"
              disabled
            />
          </div>
        </div>
      </div>
      
      {/* Saving Schedule Summary */}
      {saveAmount && targetAmount && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-primary" size={18} />
            <h3 className="text-lg font-semibold">Saving Schedule</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Target Amount:</p>
              <p className="font-semibold">{formatCurrency(targetAmount)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">You need to save:</p>
              <p className="font-semibold">
                {formatCurrency(saveAmount)} {saveFrequency === 'daily' ? 'daily' : saveFrequency === 'weekly' ? 'weekly' : 'monthly'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Duration:</p>
              <p className="font-semibold">{duration} months</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Completion Date:</p>
              <p className="font-semibold">{new Date(endDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          disabled={!title || !targetAmount || !saveFrequency || !duration}
        >
          Create Goal
        </motion.button>
      </div>
    </form>
  );
};

export default GoalModal;