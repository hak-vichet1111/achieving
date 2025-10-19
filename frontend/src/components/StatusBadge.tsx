import React from 'react'
import type { Goal, GoalStatus } from '../types/goal'

const statusLabel: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const statusClass: Record<GoalStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-secondary text-secondary-foreground',
  completed: 'bg-accent text-accent-foreground',
}

// Badge status types for saving badges
type BadgeStatus = 'early' | 'onTime' | 'late' | 'missed';

interface StatusBadgeProps {
  status: GoalStatus | BadgeStatus;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  amount?: number;
  completed?: boolean;
  isSavingBadge?: boolean;
  onComplete?: () => void;
  onProgressChange?: (newAmount: number) => void;
  lastUpdatedAt?: string;
}

export default function StatusBadge({
  status,
  targetAmount,
  currentAmount,
  targetDate,
  amount,
  completed = false,
  isSavingBadge = false,
  onComplete,
  onProgressChange,
  lastUpdatedAt
}: StatusBadgeProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // If this is a saving badge
  if (isSavingBadge && amount && targetDate) {
    const badgeTargetAmount = amount;
    const badgeCurrentAmount = typeof currentAmount === 'number' ? currentAmount : (completed ? amount : 0);
    const progressPercentage = Math.min(100, Math.round((badgeCurrentAmount / badgeTargetAmount) * 100));
    const remainingAmount = Math.max(0, Math.round((badgeTargetAmount - badgeCurrentAmount) * 100) / 100);
    const targetDateObj = new Date(targetDate);

    // Determine badge status based on last update if available
    let badgeStatus = status;
    if (completed) {
      badgeStatus = 'completed';
    } else if (lastUpdatedAt) {
      const last = new Date(lastUpdatedAt);
      if (last > targetDateObj) {
        badgeStatus = 'late';
      } else if (last.toDateString() === targetDateObj.toDateString()) {
        badgeStatus = 'onTime';
      } else {
        badgeStatus = 'early';
      }
    } else {
      // No updates yet: default to date proximity
      const today = new Date();
      if (today > targetDateObj) {
        badgeStatus = 'late';
      } else if (today.toDateString() === targetDateObj.toDateString()) {
        badgeStatus = 'onTime';
      } else {
        badgeStatus = 'early';
      }
    }

    // Header date: show last updated if available; otherwise show due date
    const headerLabel = lastUpdatedAt ? 'Updated' : 'Due';
    const headerDateText = lastUpdatedAt
      ? new Date(lastUpdatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Background style: completed, time-based (today/past), waiting plan (future)
    const today = new Date();
    const isDueToday = today.toDateString() === targetDateObj.toDateString();
    const isPastDue = today > targetDateObj;
    const containerClasses = completed
        ? 'p-4 rounded-lg shadow-sm border bg-tint-accent'
        : isPastDue
            ? 'p-4 rounded-lg shadow-sm border bg-tint-destructive'
            : isDueToday
                ? 'p-4 rounded-lg shadow-sm border bg-tint-primary'
                : 'p-4 rounded-lg shadow-sm border bg-tint-muted';

    return (
      <div className={containerClasses}>
        {/* Header with date and status */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-muted-foreground text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="mr-1">{headerLabel}:</span>
            {headerDateText}
          </div>
          {badgeStatus === 'late' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive">
              Late
            </span>
          )}
          {badgeStatus === 'onTime' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              On Time
            </span>
          )}
          {badgeStatus === 'early' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              Early
            </span>
          )}
          {badgeStatus === 'completed' && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent">
              Completed
            </span>
          )}
        </div>

        {/* Target and Progress */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-sm text-muted-foreground">Target</div>
            <div className="text-2xl font-bold">{formatCurrency(badgeTargetAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(badgeCurrentAmount)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        {/* <div className="h-2 w-full bg-muted rounded-full mb-2">
          <div
            className="h-2 bg-primary rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div> */}

        {/* Progress Indicator */}
        {/* <div className="relative w-full h-1 bg-muted rounded-full mb-4">
          <div className="absolute top-0 left-0 h-1 bg-primary rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          <div
            className="absolute -top-1 h-3 w-3 bg-primary rounded-full border-2 border-background"
            style={{ left: `calc(${progressPercentage}% - 6px)` }}
          ></div>
        </div> */}

        {/* Interactive slider for saving progress */}
        {!completed && onProgressChange && (
          <input
            type="range"
            min={0}
            max={badgeTargetAmount}
            step={badgeTargetAmount % 1 === 0 ? 1 : 0.01}
            value={badgeCurrentAmount}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className="w-full accent-primary mb-4"
            aria-label="Adjust saved amount for this badge"
          />
        )}

        {/* Status Details */}
        <div className="flex justify-between text-sm">
          <div>
            <div className="text-muted-foreground">REMAINING</div>
            <div className="font-medium">{formatCurrency(remainingAmount)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">COMPLETE</div>
            <div className="font-medium text-primary">{progressPercentage}%</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">Status</div>
            <div className="text-sm font-medium">
              {completed
                ? 'Complete'
                : badgeCurrentAmount > 0
                  ? 'Saved'
                  : 'Not Saved'}
            </div>
          </div>
        </div>

        {/* Complete Button (only when progress is 100%) */}
        {!completed && onComplete && progressPercentage >= 100 && (
          <button
            onClick={onComplete}
            className="w-full mt-4 flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
            aria-label="Mark saving badge as completed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Complete</span>
          </button>
        )}
      </div>
    );
  }

  // Simple badge for when no amounts are provided
  if (!targetAmount && !currentAmount) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${statusClass[status as GoalStatus] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabel[status as GoalStatus] || status}
      </span>
    );
  }

  // Calculate progress percentage for goal badge
  const progressPercentage = targetAmount && currentAmount
    ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100)
    : 0;

  // Calculate remaining amount
  const remainingAmount = targetAmount && currentAmount
    ? targetAmount - currentAmount
    : 0;

  // Status color for the amount difference
  const amountStatusColor = remainingAmount <= 0 ? 'text-primary' : 'text-destructive';
  const amountDiffText = remainingAmount <= 0 ? '' : '-';

  // Background style for generic goal badge
  const today = new Date();
  const hasTargetDate = !!targetDate;
  const targetDateObj = hasTargetDate ? new Date(targetDate as string) : null;
  const isDueToday = hasTargetDate && today.toDateString() === targetDateObj!.toDateString();
  const isPastDue = hasTargetDate && today > (targetDateObj as Date);
  const genericContainerClasses = (status as GoalStatus) === 'completed'
      ? 'p-4 rounded-lg shadow-sm border bg-tint-accent max-w-md'
      : (isPastDue || isDueToday)
          ? `p-4 rounded-lg shadow-sm border ${isPastDue ? 'bg-tint-destructive' : 'bg-tint-primary'} max-w-md`
          : 'p-4 rounded-lg shadow-sm border bg-tint-muted max-w-md';

  return (
    <div className={genericContainerClasses}>
      {/* Header with date and status */}
      <div className="flex justify-between items-center mb-2">
        {targetDate && (
          <div className="flex items-center text-muted-foreground text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {status === 'in_progress' && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive">
            Late
          </span>
        )}
      </div>

      {/* Target and Progress */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-sm text-muted-foreground">Target</div>
          <div className="text-2xl font-bold">{formatCurrency(targetAmount || 0)}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Progress</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(currentAmount || 0)}</div>
        </div>
      </div>

      {/* Progress Bar */}
      {/* <div className="h-2 w-full bg-muted rounded-full mb-2">
        <div 
          className="h-2 bg-primary rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div> */}

      {/* Progress Indicator */}
      {/* <div className="relative w-full h-1 bg-muted rounded-full mb-4">
        <div className="absolute top-0 left-0 h-1 bg-primary rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        <div 
          className="absolute -top-1 h-3 w-3 bg-primary rounded-full border-2 border-background" 
          style={{ left: `calc(${progressPercentage}% - 6px)` }}
        ></div>
      </div> */}

      {/* Status Details */}
      <div className="flex justify-between text-sm">
        <div>
          <div className="text-muted-foreground">REMAINING</div>
          <div className="font-medium">{formatCurrency(remainingAmount)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">COMPLETE</div>
          <div className="font-medium text-primary">{progressPercentage}%</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">STATUS</div>
          <div className={`font-medium ${amountStatusColor}`}>{amountDiffText}{formatCurrency(Math.abs(remainingAmount))}</div>
        </div>
      </div>
    </div>
  );
}