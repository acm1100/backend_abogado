import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/configuration';

// Importar todas las entidades reales
import { BaseEntity } from '../entities/base.entity';
import { Empresa } from '../entities/empresa.entity';
import { Suscripcion } from '../entities/suscripcion.entity';
import { Rol } from '../entities/rol.entity';
import { Permiso } from '../entities/permiso.entity';
import { RolPermiso } from '../entities/rol-permiso.entity';
import { Usuario } from '../entities/usuario.entity';
import { Cliente } from '../entities/cliente.entity';
import { Caso } from '../entities/caso.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { FlujoTrabajo } from '../entities/flujo_trabajo.entity';
import { Gasto } from '../entities/gasto.entity';
import { Facturacion } from '../entities/facturacion.entity';
import { Documentacion } from '../entities/documentacion.entity';
import { Evento } from '../entities/evento.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get<DatabaseConfig>('app.database');
        
        return {
          type: 'postgres',
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.database,
          ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
          synchronize: databaseConfig.synchronize, // Solo true en desarrollo
          logging: databaseConfig.logging,
          maxQueryExecutionTime: 5000, // Log queries que tomen más de 5s
          
          // Pool de conexiones optimizado
          extra: {
            max: databaseConfig.maxConnections,
            connectionTimeoutMillis: databaseConfig.connectionTimeout,
            idleTimeoutMillis: 30000,
            statement_timeout: 60000,
            query_timeout: 60000,
            // Configuraciones específicas para PostgreSQL
            application_name: 'AbogadosAPI',
          },

          // Registro de todas las entidades reales
          entities: [
            // Core multi-tenant y usuarios
            Empresa,
            Suscripcion,
            Rol,
            Permiso,
            RolPermiso,
            Usuario,
            
            // CRM jurídico
            Cliente,
            Caso,
            
            // Gestión de proyectos
            Proyecto,
            
            // Workflows
            FlujoTrabajo,
            
            // Gastos
            Gasto,
            
            // Facturación
            Facturacion,
            
            // Documentos
            Documentacion,
            
            // Eventos/Agenda
            Evento,
          ],

          // Migraciones
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: false, // Las ejecutaremos manualmente
          migrationsTableName: 'migrations_history',

          // Configuración de timezone para PostgreSQL
          timezone: 'America/Lima',
          
          // Configuraciones adicionales para producción
          cache: {
            type: 'redis',
            options: {
              host: configService.get('app.redis.host'),
              port: configService.get('app.redis.port'),
              password: configService.get('app.redis.password'),
              db: configService.get('app.redis.db'),
            },
            duration: 300000, // 5 minutos de cache
          },

          // Configuración de charset
          charset: 'utf8mb4',
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {
  constructor() {
    console.log('Módulo de base de datos inicializado');
  }
}
