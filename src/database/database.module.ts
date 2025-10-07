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
import { Proyecto, TareaProyecto, HitoProyecto } from '../entities/proyecto.entity';
import { FlujoTrabajo, TareaFlujo, InstanciaFlujo, EjecucionTarea } from '../entities/flujo_trabajo.entity';
import { Gasto } from '../entities/gasto.entity';
import { Facturacion } from '../entities/facturacion.entity';
import { Documentacion } from '../entities/documentacion.entity';
import { Evento } from '../entities/evento.entity';
import { RegistroTiempo } from '../entities/registro-tiempo.entity';
import { Documento } from '../entities/documento.entity';
import { EventoAgenda } from '../entities/evento-agenda.entity';

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
            TareaProyecto,
            HitoProyecto,
            
            // Workflows
            FlujoTrabajo,
            TareaFlujo,
            InstanciaFlujo,
            EjecucionTarea,
            
            // Gastos
            Gasto,
            
            // Facturación
            Facturacion,
            
            // Documentos
            Documentacion,
            Documento,
            
            // Eventos/Agenda
            Evento,
            EventoAgenda,
            
            // Registros de tiempo
            RegistroTiempo,
          ],

          // Migraciones
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: false, // Las ejecutaremos manualmente
          migrationsTableName: 'migrations_history',

          // Configuración de timezone para PostgreSQL
          timezone: 'America/Lima',
          
          // Configuraciones adicionales para producción
          // TODO: Habilitar cache Redis después de configuración inicial
          // cache: {
          //   type: 'redis',
          //   options: {
          //     host: configService.get('app.redis.host'),
          //     port: configService.get('app.redis.port'),
          //     password: configService.get('app.redis.password'),
          //     db: configService.get('app.redis.db'),
          //   },
          //   duration: 300000, // 5 minutos de cache
          // },

          // Configuración adicional para PostgreSQL
          // charset no es necesario para PostgreSQL
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
