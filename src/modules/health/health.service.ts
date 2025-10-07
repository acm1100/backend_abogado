import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async checkHealth() {
    const startTime = Date.now();
    
    try {
      // Verificar conexión a la base de datos
      const dbHealth = await this.checkDatabase();
      
      // Verificar memoria
      const memoryUsage = process.memoryUsage();
      
      // Tiempo de respuesta
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        database: dbHealth,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkDatabase(): Promise<{ status: string; responseTime: string }> {
    const startTime = Date.now();
    
    try {
      await this.connection.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        responseTime: 'N/A',
      };
    }
  }

  async getDetailedHealth() {
    const basicHealth = await this.checkHealth();
    
    if (basicHealth.status === 'error') {
      return basicHealth;
    }

    try {
      // Estadísticas adicionales de la base de datos
      const dbStats = await this.getDatabaseStats();
      
      return {
        ...basicHealth,
        database: {
          ...basicHealth.database,
          ...dbStats,
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          pid: process.pid,
        },
      };
    } catch (error) {
      return {
        ...basicHealth,
        warning: 'Could not retrieve detailed statistics',
        warningDetails: error.message,
      };
    }
  }

  private async getDatabaseStats() {
    try {
      // Obtener información de la base de datos PostgreSQL
      const [connectionInfo] = await this.connection.query(`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as version
      `);

      const [connectionCount] = await this.connection.query(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);

      return {
        databaseName: connectionInfo.database_name,
        currentUser: connectionInfo.current_user,
        version: connectionInfo.version,
        activeConnections: parseInt(connectionCount.active_connections),
      };
    } catch (error) {
      return {
        error: 'Could not retrieve database statistics',
        details: error.message,
      };
    }
  }

  async checkReadiness() {
    try {
      // Verificar que todos los servicios críticos estén disponibles
      await this.connection.query('SELECT 1');
      
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
        },
      };
    } catch (error) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'failed',
        },
        error: error.message,
      };
    }
  }

  async checkLiveness() {
    // Verificación simple para confirmar que la aplicación está viva
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
