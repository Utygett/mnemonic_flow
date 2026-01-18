import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: string;
}

export function ProgressBar({ progress, color = '#4A6FA5', height = '8px' }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
      <div
        className="h-full transition-all duration-300 ease-out rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
