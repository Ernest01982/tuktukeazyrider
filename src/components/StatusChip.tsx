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
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'REQUESTED': return 'Finding Driver';
      case 'ASSIGNED': return 'Driver Assigned';
      case 'ENROUTE': return 'Driver En Route';
      case 'STARTED': return 'Trip Started';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status.replace('_', ' ');
    }
  };

  return (
    <span className={`
      inline-block rounded-full font-semibold tracking-wide
      ${getStatusColor(status)}
      ${sizeClasses[size]}
    `}>
      {getStatusText(status)}
    </span>
  );
};