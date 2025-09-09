import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatus: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium transition-all duration-300
      ${isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-secondary text-white'
      }
    `}>
      <div className="flex items-center justify-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Connection restored</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
};