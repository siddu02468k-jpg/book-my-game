export interface SystemErrorLog {
  id: string;
  timestamp: string;
  method?: string;
  url?: string;
  status: number;
  message: string;
  stack?: string;
}

class SystemMonitor {
  private totalRequests: number = 0;
  private errorLogs: SystemErrorLog[] = [];
  private readonly maxErrorLogs: number = 30;
  private startTime: number = Date.now();
  private lastBackupTime: string | null = null;

  public recordRequest(): void {
    this.totalRequests++;
  }

  public recordError(error: any, method?: string, url?: string, status: number = 500): void {
    const errorEntry: SystemErrorLog = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      message: error?.message || String(error) || 'Unknown internal error',
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
    };

    this.errorLogs.unshift(errorEntry);
    if (this.errorLogs.length > this.maxErrorLogs) {
      this.errorLogs.pop();
    }
  }

  public recordBackup(): void {
    this.lastBackupTime = new Date().toISOString();
  }

  public getMetrics(dbStats?: { venues: number; bookings: number; users: number }): {
    status: 'healthy' | 'warning' | 'critical';
    uptimeSeconds: number;
    uptimeFormatted: string;
    totalRequests: number;
    errorCount: number;
    memory: {
      rssMB: number;
      heapUsedMB: number;
      heapTotalMB: number;
    };
    lastBackup: string | null;
    database: {
      venues: number;
      bookings: number;
      users: number;
    };
    recentErrors: SystemErrorLog[];
  } {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;
    const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

    const mem = process.memoryUsage();
    const recentErrors = this.errorLogs.slice(0, 10);
    
    // Status assessment
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (this.errorLogs.length > 15) {
      status = 'critical';
    } else if (this.errorLogs.length > 0) {
      status = 'warning';
    }

    return {
      status,
      uptimeSeconds: uptimeSec,
      uptimeFormatted,
      totalRequests: this.totalRequests,
      errorCount: this.errorLogs.length,
      memory: {
        rssMB: Math.round(mem.rss / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      },
      lastBackup: this.lastBackupTime,
      database: dbStats || { venues: 0, bookings: 0, users: 0 },
      recentErrors
    };
  }
}

export const monitor = new SystemMonitor();
