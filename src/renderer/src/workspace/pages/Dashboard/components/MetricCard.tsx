// MetricCard.tsx
import React from 'react';

interface MetricCardProps {
  title: string;
  mainValue: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, mainValue, icon, bgColor, iconColor }) => (
  <div className="px-3 w-full">
    <div className="flex items-center justify-between gap-6">
      <div className="flex flex-col">
        <p className="text-xl font-semibold text-black">{mainValue}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">{title}</p>
      </div>
      <div className={`p-2 rounded-full ${bgColor} ${iconColor}`}>{icon}</div>
    </div>
  </div>
);

export default MetricCard;
