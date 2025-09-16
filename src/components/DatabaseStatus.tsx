import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { dbDiagnostics, DatabaseHealthCheck } from '../lib/database-diagnostics';
import { Button } from './Button';

interface DatabaseStatusProps {
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({
  showDetails = false,
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const [healthCheck, setHealthCheck] = useState<DatabaseHealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<string>('');

  const performHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await dbDiagnostics.performHealthCheck();
      setHealthCheck(result);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const report = await dbDiagnostics.generateDiagnosticReport();
      setDiagnosticReport(report);
      setShowReport(true);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performHealthCheck();

    if (autoRefresh) {
      const interval = setInterval(performHealthCheck, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (!healthCheck && !loading) {
    return null;
  }

  const getStatusColor = () => {
    if (!healthCheck) return 'text-gray-500';
    if (healthCheck.isConnected && healthCheck.schemaValid && healthCheck.authWorking) {
      return 'text-green-500';
    }
    if (healthCheck.isConnected) {
      return 'text-yellow-500';
    }
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (!healthCheck) return <Database className="w-4 h-4" />;
    
    if (healthCheck.isConnected && healthCheck.schemaValid && healthCheck.authWorking) {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (!healthCheck) return 'Unknown';
    
    if (healthCheck.isConnected && healthCheck.schemaValid && healthCheck.authWorking) {
      return 'Healthy';
    }
    if (healthCheck.isConnected) {
      return 'Issues Detected';
    }
    return 'Disconnected';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <h3 className="font-semibold text-text">Database Status</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {healthCheck && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {healthCheck.latency.toFixed(0)}ms
              </div>
            )}
          </div>
        </div>

        {showDetails && healthCheck && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className={healthCheck.isConnected ? 'text-green-500' : 'text-red-500'}>
                  {healthCheck.isConnected ? '✅' : '❌'}
                </div>
                <span>Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={healthCheck.schemaValid ? 'text-green-500' : 'text-red-500'}>
                  {healthCheck.schemaValid ? '✅' : '❌'}
                </div>
                <span>Schema</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={healthCheck.authWorking ? 'text-green-500' : 'text-red-500'}>
                  {healthCheck.authWorking ? '✅' : '❌'}
                </div>
                <span>Auth</span>
              </div>
            </div>

            {healthCheck.errors.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-medium text-xs mb-1">Issues:</p>
                <ul className="text-red-700 text-xs space-y-1">
                  {healthCheck.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={performHealthCheck}
            loading={loading}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generateReport}
            loading={loading}
          >
            <Database className="w-3 h-3 mr-1" />
            Full Report
          </Button>
        </div>
      </div>

      {/* Diagnostic Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">Database Diagnostic Report</h3>
              <button
                onClick={() => setShowReport(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {diagnosticReport}
            </pre>
            
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowReport(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};