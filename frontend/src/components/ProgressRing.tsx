import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  className = '',
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  // Calculate radius and circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  // Determine color based on progress
  const getColor = () => {
    if (normalizedProgress < 25) return 'var(--warning)';
    if (normalizedProgress < 50) return 'var(--warning)';
    if (normalizedProgress < 75) return 'var(--amber-500)';
    return 'var(--success)';
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          // stroke="var(--primary)"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease-in-out',
          }}
        />
      </svg>

      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-foreground font-bold text-lg">
          {Math.round(normalizedProgress)}%
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;