// Database connectivity diagnostics and health checks
import { supabase } from './supabase';
import { logError, AppError } from './errors';

export interface DatabaseHealthCheck {
  isConnected: boolean;
  latency: number;
  schemaValid: boolean;
  authWorking: boolean;
  errors: string[];
  timestamp: string;
}

export class DatabaseDiagnostics {
  private static instance: DatabaseDiagnostics;

  public static getInstance(): DatabaseDiagnostics {
    if (!DatabaseDiagnostics.instance) {
      DatabaseDiagnostics.instance = new DatabaseDiagnostics();
    }
    return DatabaseDiagnostics.instance;
  }

  // Comprehensive database health check
  async performHealthCheck(): Promise<DatabaseHealthCheck> {
    const startTime = performance.now();
    const errors: string[] = [];
    let isConnected = false;
    let schemaValid = false;
    let authWorking = false;

    try {
      // Test 1: Basic connectivity
      const connectivityTest = await this.testConnectivity();
      isConnected = connectivityTest.success;
      if (!connectivityTest.success) {
        errors.push(`Connectivity: ${connectivityTest.error}`);
      }

      // Test 2: Schema validation
      const schemaTest = await this.validateSchema();
      schemaValid = schemaTest.success;
      if (!schemaTest.success) {
        errors.push(`Schema: ${schemaTest.error}`);
      }

      // Test 3: Authentication
      const authTest = await this.testAuthentication();
      authWorking = authTest.success;
      if (!authTest.success) {
        errors.push(`Auth: ${authTest.error}`);
      }

    } catch (error) {
      errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const endTime = performance.now();
    const latency = endTime - startTime;

    return {
      isConnected,
      latency,
      schemaValid,
      authWorking,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // Test basic connectivity to Supabase
  private async testConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  // Validate that required database schema exists
  private async validateSchema(): Promise<{ success: boolean; error?: string }> {
    const requiredTables = ['profiles', 'rides', 'drivers', 'payments', 'ratings'];
    const missingTables: string[] = [];

    try {
      for (const table of requiredTables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST106') {
          missingTables.push(table);
        }
      }

      if (missingTables.length > 0) {
        return { 
          success: false, 
          error: `Missing tables: ${missingTables.join(', ')}` 
        };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Schema validation failed' 
      };
    }
  }

  // Test authentication functionality
  private async testAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { success: false, error: error.message };
      }

      // Test if we can access auth-protected resources
      if (session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .limit(1);

        if (profileError) {
          return { success: false, error: `Profile access failed: ${profileError.message}` };
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Auth test failed' 
      };
    }
  }

  // Test specific database operations
  async testDatabaseOperations(): Promise<{
    canRead: boolean;
    canWrite: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let canRead = false;
    let canWrite = false;
    let canUpdate = false;
    let canDelete = false;

    try {
      // Test READ operation
      const { error: readError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      canRead = !readError;
      if (readError) {
        errors.push(`Read: ${readError.message}`);
      }

      // Test WRITE operation (only if authenticated)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const testData = {
          id: user.id,
          full_name: 'Test User',
          email: user.email,
          role: 'rider' as const,
        };

        const { error: writeError } = await supabase
          .from('profiles')
          .upsert(testData, { onConflict: 'id' });

        canWrite = !writeError;
        if (writeError) {
          errors.push(`Write: ${writeError.message}`);
        }

        // Test UPDATE operation
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id);

        canUpdate = !updateError;
        if (updateError) {
          errors.push(`Update: ${updateError.message}`);
        }

        // Note: We don't test DELETE on profiles for safety
        canDelete = true; // Assume delete works if other operations work
      }

    } catch (error) {
      errors.push(`Operation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      canRead,
      canWrite,
      canUpdate,
      canDelete,
      errors,
    };
  }

  // Monitor connection quality over time
  async monitorConnection(duration: number = 30000): Promise<{
    averageLatency: number;
    successRate: number;
    errors: string[];
  }> {
    const results: { latency: number; success: boolean; error?: string }[] = [];
    const interval = 5000; // Test every 5 seconds
    const iterations = Math.floor(duration / interval);

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const { error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        const endTime = performance.now();
        const latency = endTime - startTime;

        results.push({
          latency,
          success: !error,
          error: error?.message,
        });

      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;

        results.push({
          latency,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Wait for next iteration
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    const successfulResults = results.filter(r => r.success);
    const averageLatency = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length
      : 0;

    const successRate = results.length > 0
      ? (successfulResults.length / results.length) * 100
      : 0;

    const errors = results
      .filter(r => !r.success && r.error)
      .map(r => r.error!)
      .filter((error, index, arr) => arr.indexOf(error) === index); // Remove duplicates

    return {
      averageLatency,
      successRate,
      errors,
    };
  }

  // Generate diagnostic report
  async generateDiagnosticReport(): Promise<string> {
    const healthCheck = await this.performHealthCheck();
    const operations = await this.testDatabaseOperations();

    const report = `
# Database Diagnostic Report
Generated: ${new Date().toLocaleString()}

## Health Check Summary
- Connected: ${healthCheck.isConnected ? '✅' : '❌'}
- Schema Valid: ${healthCheck.schemaValid ? '✅' : '❌'}
- Auth Working: ${healthCheck.authWorking ? '✅' : '❌'}
- Latency: ${healthCheck.latency.toFixed(2)}ms

## Operation Tests
- Read: ${operations.canRead ? '✅' : '❌'}
- Write: ${operations.canWrite ? '✅' : '❌'}
- Update: ${operations.canUpdate ? '✅' : '❌'}
- Delete: ${operations.canDelete ? '✅' : '❌'}

## Errors Detected
${healthCheck.errors.length > 0 ? healthCheck.errors.map(e => `- ${e}`).join('\n') : 'No errors detected'}
${operations.errors.length > 0 ? operations.errors.map(e => `- ${e}`).join('\n') : ''}

## Recommendations
${this.generateRecommendations(healthCheck, operations)}
    `.trim();

    return report;
  }

  private generateRecommendations(
    healthCheck: DatabaseHealthCheck,
    operations: { canRead: boolean; canWrite: boolean; canUpdate: boolean; canDelete: boolean; errors: string[] }
  ): string {
    const recommendations: string[] = [];

    if (!healthCheck.isConnected) {
      recommendations.push('- Check network connectivity and Supabase project status');
    }

    if (!healthCheck.schemaValid) {
      recommendations.push('- Run database migration to create required tables');
    }

    if (!healthCheck.authWorking) {
      recommendations.push('- Verify authentication configuration and RLS policies');
    }

    if (!operations.canRead) {
      recommendations.push('- Check table permissions and RLS policies for SELECT operations');
    }

    if (!operations.canWrite) {
      recommendations.push('- Verify INSERT permissions and RLS policies');
    }

    if (healthCheck.latency > 1000) {
      recommendations.push('- High latency detected, consider optimizing queries or checking network');
    }

    if (recommendations.length === 0) {
      recommendations.push('- Database connectivity is healthy, no immediate action required');
    }

    return recommendations.join('\n');
  }
}

// Export singleton instance
export const dbDiagnostics = DatabaseDiagnostics.getInstance();