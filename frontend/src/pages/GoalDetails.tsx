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

// Interface for saving badges
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
  const { goals, updateAmount, updateGoal } = useGoals();

  // All state hooks called unconditionally
  const [goal, setGoal] = useState<any>(undefined);
  const [editedGoal, setEditedGoal] = useState<any>(undefined);
  const [badges, setBadges] = useState<SavingBadge[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsMessage, setCongratsMessage] = useState('');
  const [showGoalCongrats, setShowGoalCongrats] = useState(false);

  // Helper: relative day label (e.g., “in 2 days”, “3 days ago”, “today”)
  const formatRelativeDays = (iso: string) => {
    try {
      const target = new Date(iso);
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);
      if (diffDays === 0) return 'today';
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      return rtf.format(diffDays, 'day');
    } catch {
      return '';
    }
  };

  // Helper: frequency-based period label (Day/Week/Month N)
  const formatPeriodLabel = (freq: string | undefined, id: string) => {
    const n = Number.parseInt(id, 10) || 0;
    switch ((freq || '').toLowerCase()) {
      case 'daily':
        return `Day ${n}`;
      case 'weekly':
        return `Week ${n}`;
      case 'monthly':
        return `Month ${n}`;
      default:
        return `Period ${n}`;
    }
  };

  // First useEffect: Load goal from context
  useEffect(() => {
    const foundGoal = goals.find(g => g.id === goalId);
    if (foundGoal) {
      const normalized = { ...foundGoal, savedAmount: (foundGoal as any).savedAmount ?? foundGoal.currentAmount ?? 0 };
      setGoal(normalized as any);
      setEditedGoal(normalized as any);
      setBadges(generateSavingBadgesFor(normalized));
    } else {
      setGoal(undefined);
      setEditedGoal(undefined);
      setBadges([]);
    }
  }, [goalId, goals]);

  // Second useEffect: Check for goal completion
  useEffect(() => {
    if (!goal || badges.length === 0) return;

    const allCompleted = badges.every(b => b.completed);
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
        console.error('Failed to save achieved goal to localStorage:', e);
      }
    }
  }, [goal, badges, showGoalCongrats]);

  // Recalculate badges on edit changes
  useEffect(() => {
    if (!isEditing || !goal || !editedGoal) return;

    const proposedFrequency = editedGoal.saveFrequency ?? goal.saveFrequency;
    const startBaseStr = editedGoal.startDate ?? goal.startDate;
    const startDateObj = new Date(startBaseStr);

    let effectiveEndStr = editedGoal.endDate ?? goal.endDate;
    if (proposedFrequency === 'monthly' && editedGoal.duration && !editedGoal.endDate) {
      const endCalc = new Date(startDateObj);
      endCalc.setMonth(endCalc.getMonth() + Number(editedGoal.duration));
      effectiveEndStr = endCalc.toISOString();
    }

    const previewGoal = {
      ...goal,
      ...editedGoal,
      startDate: startBaseStr,
      endDate: effectiveEndStr,
      targetAmount: editedGoal.targetAmount ?? goal.targetAmount,
      savedAmount: editedGoal.savedAmount ?? goal.savedAmount,
      saveFrequency: proposedFrequency
    } as any;

    setBadges(generateSavingBadgesFor(previewGoal));
  }, [isEditing, editedGoal?.saveFrequency, editedGoal?.duration, editedGoal?.targetAmount, editedGoal?.startDate, editedGoal?.endDate, editedGoal?.savedAmount, goal?.savedAmount]);

  // Loading state
  if (!goal) {
    if (goals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <p className="text-muted-foreground">Loading goal...</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <AlertCircle size={48} className="text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Goal Not Found</h2>
        <p className="text-muted-foreground mb-4">The goal you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/goals')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Back to Goals
        </button>
      </div>
    );
  }

  // Editing guard: disable structural edits once progress exists
  const hasProgress = !!goal && (((goal.savedAmount ?? goal.currentAmount ?? 0) > 0) || badges.some(b => b.completed || (b.progressAmount ?? 0) > 0));

  const viewGoal = (isEditing && editedGoal) ? editedGoal : goal;
  const currentProgress = Math.min(100, Math.round((viewGoal.savedAmount / viewGoal.targetAmount) * 100));
  // Summary view computed amounts
  const totalPeriodsView = badges.length;
  const plannedPerPeriod = totalPeriodsView > 0 ? Math.round(badges[0].amount * 100) / 100 : undefined;
  const remainingPeriodsView = badges.filter(b => !b.completed).length;
  const remainingToSaveNow = Math.max(0, (viewGoal.targetAmount ?? 0) - (viewGoal.savedAmount ?? 0));
  const suggestedPerPeriod = remainingPeriodsView > 0 ? Math.round((remainingToSaveNow / remainingPeriodsView) * 100) / 100 : undefined;
  const displayPerPeriod = suggestedPerPeriod ?? plannedPerPeriod;

  const handleSave = async () => {
    if (!goal || !editedGoal) return;
    const patch: any = {
      title: editedGoal.title,
      description: editedGoal.description,
      category: editedGoal.category,
      saveFrequency: editedGoal.saveFrequency,
      startDate: editedGoal.startDate,
      endDate: editedGoal.endDate,
      targetDate: editedGoal.targetDate ?? editedGoal.endDate,
    };
    if (!hasProgress) {
      patch.duration = editedGoal.duration;
      patch.targetAmount = editedGoal.targetAmount;
    }
    await updateGoal(goal.id, patch);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGoal(goal);
    setIsEditing(false);
  };

  const handleBadgeToggle = (badgeId: string) => {
    setBadges(prev => {
      const next = prev.map(badge =>
        badge.id === badgeId
          ? { ...badge, completed: !badge.completed, lastUpdatedAt: new Date().toISOString() }
          : badge
      );
      // Recompute saved amount from completed badges
      const total = next.reduce((sum, b) => sum + (b.completed ? b.amount : 0), 0);
      const rounded = Math.round(total * 100) / 100;
      setGoal(prevGoal => prevGoal ? { ...prevGoal, savedAmount: Math.min(prevGoal.targetAmount ?? 0, rounded) } : prevGoal);
      setEditedGoal(prevEdited => prevEdited ? { ...prevEdited, savedAmount: Math.min(prevEdited.targetAmount ?? 0, rounded) } : prevEdited);
      if (goal) {
        // Persist to backend (currentAmount)
        updateAmount(goal.id, rounded).catch(() => { });
      }

      // Show congratulation message
      setCongratsMessage('Great job! Keep up the momentum! 🎉');
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
      return next;
    });
  };

  // Live preview calculations for edit form
  const proposedTargetAmount = Number(editedGoal?.targetAmount ?? goal.targetAmount ?? 0);
  const proposedFrequency = editedGoal?.saveFrequency ?? goal.saveFrequency ?? '';
  const todayForCalc = new Date();
  const startBase = new Date(editedGoal?.startDate ?? goal.startDate);
  const startForRemaining = startBase < todayForCalc ? todayForCalc : startBase;
  let endForCalc: Date;
  if (editedGoal?.duration && (!editedGoal?.endDate || proposedFrequency === 'monthly')) {
    endForCalc = new Date(startForRemaining);
    endForCalc.setMonth(endForCalc.getMonth() + Number(editedGoal?.duration ?? 0));
  } else {
    endForCalc = new Date(editedGoal?.endDate ?? goal.endDate);
  }
  let periodsRemaining = 0;
  if (proposedFrequency === 'daily') {
    periodsRemaining = Math.max(0, Math.ceil((endForCalc.getTime() - startForRemaining.getTime()) / (1000 * 60 * 60 * 24)));
  } else if (proposedFrequency === 'weekly') {
    periodsRemaining = Math.max(0, Math.ceil((endForCalc.getTime() - startForRemaining.getTime()) / (1000 * 60 * 60 * 24 * 7)));
  } else if (proposedFrequency === 'monthly') {
    if (editedGoal?.duration) {
      periodsRemaining = Number(editedGoal.duration);
    } else {
      periodsRemaining = Math.max(0, ((endForCalc.getFullYear() - startForRemaining.getFullYear()) * 12 + endForCalc.getMonth() - startForRemaining.getMonth() + 1));
    }
  }
  const remainingToSave = Math.max(0, proposedTargetAmount - Number(goal.savedAmount ?? 0));
  const requiredPerPeriod = periodsRemaining > 0 ? Math.round((remainingToSave / periodsRemaining) * 100) / 100 : undefined;
  const periodLabel = proposedFrequency === 'daily' ? 'day' : proposedFrequency === 'weekly' ? 'week' : proposedFrequency === 'monthly' ? 'month' : '';

  return (
    <div className="w-full min-h-screen px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/goals')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Goals
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={goal.status} />
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1 text-sm border rounded-md hover:bg-accent"
            >
              <Edit size={16} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-1 text-sm border rounded-md hover:bg-accent"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Goal Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-6 border">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editedGoal.title}
                  onChange={(e) => setEditedGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-2xl font-bold bg-transparent border-b border-border focus:border-primary outline-none"
                />
                <textarea
                  value={editedGoal.description}
                  onChange={(e) => setEditedGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-muted-foreground bg-transparent border border-border rounded-md p-2 focus:border-primary outline-none resize-none"
                  rows={3}
                />

                {/* Extended fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Category</label>
                    <input
                      type="text"
                      value={editedGoal.category ?? ''}
                      onChange={(e) => setEditedGoal(prev => ({ ...prev, category: e.target.value || undefined }))}
                      className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary outline-none"
                      placeholder="e.g., Travel, Emergency Fund"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Save Frequency</label>
                    <select
                      value={editedGoal.saveFrequency ?? ''}
                      onChange={(e) => setEditedGoal(prev => ({ ...prev, saveFrequency: e.target.value || undefined }))}
                      className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary outline-none"
                    >
                      <option value="">Select frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Start Date</label>
                    <input
                      type="date"
                      value={editedGoal.startDate ? editedGoal.startDate.split('T')[0] : ''}
                      onChange={(e) => setEditedGoal(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">End Date</label>
                    <input
                      type="date"
                      value={editedGoal.endDate ? editedGoal.endDate.split('T')[0] : ''}
                      onChange={(e) => setEditedGoal(prev => ({ ...prev, endDate: e.target.value, targetDate: e.target.value }))}
                      className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Duration (months)</label>
                    <input
                      type="number"
                      min={0}
                      value={editedGoal.duration ?? 0}
                      onChange={(e) => setEditedGoal(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      disabled={hasProgress}
                      className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary outline-none"
                    />
                    {hasProgress && (
                      <p className="text-xs text-muted-foreground mt-1">Disabled after progress starts.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Target Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editedGoal.targetAmount ?? 0}
                      onChange={(e) => setEditedGoal(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                      disabled={hasProgress}
                      className="w-full bg-transparent border border-border rounded-md p-2 focus:border-primary outline-none"
                    />
                    {hasProgress && (
                      <p className="text-xs text-muted-foreground mt-1">Disabled after progress starts.</p>
                    )}
                  </div>
                  {/* Live reflection of required saving */}
                  <div className="md:col-span-2">
                    <div className="rounded-md border p-3 bg-muted/30">
                      <p className="text-sm">
                        Remaining to save: <span className="font-semibold">${remainingToSave.toLocaleString()}</span>
                      </p>
                      {proposedFrequency ? (
                        periodsRemaining && requiredPerPeriod !== undefined ? (
                          <p className="text-sm mt-1">
                            Needed per {periodLabel}: <span className="font-semibold">${requiredPerPeriod.toLocaleString()}</span>
                            ({periodsRemaining} {periodLabel}{periodsRemaining === 1 ? '' : 's'} remaining)
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            Check dates/duration; end must be after today to compute.
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          Select save frequency to see required per-period amount.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-2">{goal.title}</h1>
                <p className="text-muted-foreground mb-4">{goal.description}</p>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
              <div className="group flex items-center gap-3 rounded-xl border border-border bg-tint-muted p-4 shadow-sm hover:shadow-md transition-shadow min-h-[72px]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-tint-accent text-accent">
                  <DollarSign size={16} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="font-semibold">${goal.targetAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="group flex items-center gap-3 rounded-xl border border-border bg-tint-muted p-4 shadow-sm hover:shadow-md transition-shadow min-h-[72px]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-tint-primary text-primary">
                  <DollarSign size={16} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Saved</p>
                  <p className="font-semibold">${viewGoal.savedAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="group flex items-center gap-3 rounded-xl border border-border bg-tint-muted p-4 shadow-sm hover:shadow-md transition-shadow min-h-[72px]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-tint-secondary text-secondary-foreground">
                  <Calendar size={16} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{new Date(viewGoal.startDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="group flex items-center gap-3 rounded-xl border border-border bg-tint-muted p-4 shadow-sm hover:shadow-md transition-shadow min-h-[72px]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-tint-warning text-warning">
                  <Clock size={16} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Target Date</p>
                  <p className="font-semibold">{new Date(viewGoal.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{viewGoal.duration} months</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground">Save Frequency</p>
                <p className="font-semibold">{viewGoal.saveFrequency}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground">Save</p>
                <p className="font-semibold">{displayPerPeriod !== undefined ? `$${displayPerPeriod.toLocaleString()}/${viewGoal.saveFrequency}` : `—/${viewGoal.saveFrequency}`}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-semibold">{badges.filter(b => b.completed).length} of {totalPeriodsView}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-card rounded-lg p-6 border">
          <ProgressRing progress={currentProgress} size={120} strokeWidth={8} />
          <p className="text-2xl font-bold mt-4">{currentProgress}%</p>
          <p className="text-sm text-muted-foreground">Complete</p>
          <p className="text-sm text-muted-foreground mt-2">
            ${Math.max(0, (viewGoal.targetAmount - viewGoal.savedAmount)).toLocaleString()} remaining
          </p>
        </div>
      </div>

      {/* Saving Badges */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex items-center gap-2 mb-4">
          <Award className="text-yellow-500" size={20} />
          <h2 className="text-xl font-semibold">Saving Progress</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <motion.div
              key={badge.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${badge.completed
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                : 'bg-card hover:bg-accent'
                } ${badge.date === new Date().toISOString().split('T')[0] ? 'ring-2 ring-primary' : ''}`}
              tabIndex={0}
              data-badge-id={badge.id}
              title={`Due ${new Date(badge.date).toLocaleDateString()} • #${idx + 1} • ID:${badge.id} • ${goal?.saveFrequency ?? ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleBadgeToggle(badge.id); } }}
              onClick={() => handleBadgeToggle(badge.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Due</span>
                    <span className="text-sm font-semibold">{new Date(badge.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-0.5 inline-flex items-center text-xs text-muted-foreground divide-x divide-border">
                    <span className="pr-2">{formatRelativeDays(badge.date)}</span>
                    <span className="px-2">{formatPeriodLabel(goal?.saveFrequency, badge.id)}</span>
                    <span className="pl-2">{goal?.saveFrequency ?? '—'}</span>
                  </div>
                </div>
                {badge.completed ? (
                  <CheckCircle size={16} className="text-primary" />
                ) : (
                  <div className="w-4 h-4 border-2 border-muted-foreground rounded-full" />
                )}
              </div>
              <p className="text-lg font-bold">${badge.amount.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    badge.status === 'early' ? 'bg-tint-accent' :
                    badge.status === 'onTime' ? 'bg-tint-primary' :
                    badge.status === 'late' ? 'bg-tint-warning' :
                    'bg-tint-destructive'
                  }`}
                >
                  {badge.status === 'early' && <Sparkles size={12} />}
                  {badge.status === 'onTime' && <CheckCircle size={12} />}
                  {badge.status === 'late' && <AlertCircle size={12} />}
                  {badge.status === 'missed' && <XCircle size={12} />}
                  <span>
                    {badge.status === 'early' ? 'Early' :
                      badge.status === 'onTime' ? 'On Time' :
                        badge.status === 'late' ? 'Late' : 'Missed'}
                  </span>
                </motion.span>

                <span className={`text-xs px-2 py-1 rounded-full ${
                  (badge.progressAmount || 0) > badge.amount ? 'bg-tint-accent' :
                  (badge.progressAmount || 0) < badge.amount ? 'bg-tint-warning' :
                  'bg-tint-muted'
                }`}>
                  {(() => {
                    const diff = (badge.progressAmount || 0) - badge.amount;
                    if (diff > 0) return `Ahead $${Math.abs(diff).toFixed(2)}`;
                    if (diff < 0) return `Behind $${Math.abs(diff).toFixed(2)}`;
                    return 'On track';
                  })()}
                </span>
              </div>

              <div className="w-full h-1 bg-muted rounded-full mt-2">
                <div
                  className="h-1 bg-primary rounded-full"
                  style={{ width: `${Math.min(100, badge.amount > 0 ? Math.round(((badge.progressAmount || 0) / badge.amount) * 100) : 0)}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Congratulations Toast */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {congratsMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Completion Overlay */}
      <AnimatePresence>
        {showGoalCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowGoalCongrats(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card p-8 rounded-lg max-w-md mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Sparkles size={48} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
              <p className="text-muted-foreground mb-6">
                You've successfully achieved your goal: "{goal.title}"!
              </p>
              <button
                onClick={() => setShowGoalCongrats(false)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalDetails;

// Helper function to generate saving badges
const generateSavingBadgesFor = (g: any): SavingBadge[] => {
  if (!g) return [];

  const badges: SavingBadge[] = [];
  const startDate = new Date(g.startDate);
  const endDate = new Date(g.endDate);
  const today = new Date();

  let currentDate = new Date(startDate);
  let badgeAmount = 0;

  // Calculate amount per badge based on frequency
  switch (g.saveFrequency) {
    case 'daily':
      badgeAmount = g.targetAmount / (Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      break;
    case 'weekly':
      badgeAmount = g.targetAmount / (Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
      break;
    case 'monthly':
      badgeAmount = g.targetAmount / (
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        endDate.getMonth() - startDate.getMonth() + 1
      );
      break;
    default:
      badgeAmount = g.targetAmount / 12; // Default to monthly
  }

  // Round to 2 decimal places
  badgeAmount = Math.round(badgeAmount * 100) / 100;

  let badgeId = 1;
  while (currentDate <= endDate) {
    const isCompleted = g.savedAmount >= badgeAmount * badgeId;
    const progressAmount = Math.min(g.savedAmount - (badgeAmount * (badgeId - 1)), badgeAmount);

    let status: BadgeStatus = 'onTime';
    if (currentDate < today && !isCompleted) {
      status = 'missed';
    } else if (currentDate > today && isCompleted) {
      status = 'early';
    } else if (currentDate < today && isCompleted) {
      status = 'onTime';
    } else if (currentDate > today) {
      status = 'onTime';
    }

    badges.push({
      id: badgeId.toString(),
      date: currentDate.toISOString().split('T')[0],
      amount: badgeAmount,
      status,
      completed: isCompleted,
      progressAmount: Math.max(0, progressAmount)
    });

    badgeId++;

    // Move to next period
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
        currentDate.setMonth(currentDate.getMonth() + 1); // Default to monthly
    }
  }

  return badges;
};