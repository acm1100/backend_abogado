import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/configuration';

// Importar todas las entidades
import { Empresa } from '../entities/empresa.entity';
import { Suscripcion } from '../entities/suscripcion.entity';
import { Rol } from '../entities/rol.entity';
import { Permiso } from '../entities/permiso.entity';
import { RolPermiso } from '../entities/rol-permiso.entity';
import { Usuario } from '../entities/usuario.entity';
import { Cliente } from '../entities/cliente.entity';
import { ContactoCliente } from '../entities/contacto-cliente.entity';
import { Caso } from '../entities/caso.entity';
import { TipoProyecto } from '../entities/tipo-proyecto.entity';
import { EstadoProyecto } from '../entities/estado-proyecto.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { ProyectoColaborador } from '../entities/proyecto-colaborador.entity';
import { Tarea } from '../entities/tarea.entity';
import { FlujoTrabajo } from '../entities/flujo-trabajo.entity';
import { EtapaFlujo } from '../entities/etapa-flujo.entity';
import { TipoActividad } from '../entities/tipo-actividad.entity';
import { RegistroTiempo } from '../entities/registro-tiempo.entity';
import { CategoriaGasto } from '../entities/categoria-gasto.entity';
import { Gasto } from '../entities/gasto.entity';
import { Tarifa } from '../entities/tarifa.entity';
import { Factura } from '../entities/factura.entity';
import { FacturaDetalle } from '../entities/factura-detalle.entity';
import { Pago } from '../entities/pago.entity';
import { RecordatorioCobranza } from '../entities/recordatorio-cobranza.entity';
import { TipoEvento } from '../entities/tipo-evento.entity';
import { EventoAgenda } from '../entities/evento-agenda.entity';
import { EventoInvitado } from '../entities/evento-invitado.entity';
import { PlantillaNotificacion } from '../entities/plantilla-notificacion.entity';
import { Notificacion } from '../entities/notificacion.entity';
import { CategoriaDocumento } from '../entities/categoria-documento.entity';
import { PlantillaDocumento } from '../entities/plantilla-documento.entity';
import { Documento } from '../entities/documento.entity';
import { DocumentoVersion } from '../entities/documento-version.entity';
import { DocumentoPermiso } from '../entities/documento-permiso.entity';
import { Bitacora } from '../entities/bitacora.entity';

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

          // Registro de todas las entidades
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
            ContactoCliente,
            Caso,
            
            // Gestión de proyectos
            TipoProyecto,
            EstadoProyecto,
            Proyecto,
            ProyectoColaborador,
            Tarea,
            
            // Workflows
            FlujoTrabajo,
            EtapaFlujo,
            
            // Tiempo y gastos
            TipoActividad,
            RegistroTiempo,
            CategoriaGasto,
            Gasto,
            
            // Facturación
            Tarifa,
            Factura,
            FacturaDetalle,
            Pago,
            RecordatorioCobranza,
            
            // Agenda
            TipoEvento,
            EventoAgenda,
            EventoInvitado,
            
            // Notificaciones
            PlantillaNotificacion,
            Notificacion,
            
            // Documentos
            CategoriaDocumento,
            PlantillaDocumento,
            Documento,
            DocumentoVersion,
            DocumentoPermiso,
            
            // Auditoría
            Bitacora,
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
    console.log('🗃️  Módulo de base de datos inicializado');
  }
}
