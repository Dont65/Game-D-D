import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  icon?: React.ReactNode;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, max, color, icon }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="mb-3 group">
      <div className="flex justify-between items-end text-xs mb-1.5 font-ui tracking-wide text-dnd-primary/80">
        <span className="flex items-center gap-1.5 font-medium">{icon} {label}</span>
        <span className="opacity-70 group-hover:opacity-100 transition-opacity">{value} / {max}</span>
      </div>
      <div className="h-1.5 bg-dnd-bg rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ease-out ${color} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};