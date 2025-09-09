import React from 'react';
import { getStatusColor } from '../lib/utils';

interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`
      inline-block rounded-full font-semibold uppercase tracking-wide
      ${getStatusColor(status)}
      ${sizeClasses[size]}
    `}>
      {status.replace('_', ' ')}
    </span>
  );
};