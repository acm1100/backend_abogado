import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import configuration from './config/configuration';

// Base de datos
import { DatabaseModule } from './database/database.module';

// Middleware personalizado
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import { AuthModule } from './modules/auth/auth.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { RolesModule } from './modules/roles/roles.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { CasosModule } from './modules/casos/casos.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { FlujosTrabajoModule } from './modules/flujos-trabajo/flujos-trabajo.module';
import { RegistrosTiempoModule } from './modules/registros-tiempo/registros-tiempo.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { PlantillasModule } from './modules/plantillas/plantillas.module';
import { GastosModule } from './modules/gastos/gastos.module';
import { FacturacionModule } from './modules/facturacion/facturacion.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { BitacoraModule } from './modules/bitacora/bitacora.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 segundo
            limit: 10, // 10 requests por segundo
          },
          {
            name: 'medium',
            ttl: 60000, // 1 minuto
            limit: 100, // 100 requests por minuto
          },
          {
            name: 'long',
            ttl: 900000, // 15 minutos
            limit: 1000, // 1000 requests por 15 minutos
          },
        ],
      }),
    }),

    // Programación de tareas
    ScheduleModule.forRoot(),

    // Sistema de eventos
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Cache con Redis
    CacheModule.registerAsync({
      useFactory: () => ({
        store: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB, 10) || 0,
        ttl: 300, // 5 minutos por defecto
        max: 1000, // máximo 1000 elementos en cache
      }),
      isGlobal: true,
    }),

    // Carga de archivos
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: './uploads',
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB
          files: 10, // máximo 10 archivos por request
        },
        fileFilter: (req, file, callback) => {
          const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
          ];
          
          if (allowedMimes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new Error('Tipo de archivo no permitido'), false);
          }
        },
      }),
    }),

    // Servir archivos estáticos
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Base de datos
    DatabaseModule,


    AuthModule,
    EmpresasModule,
    UsuariosModule,
    RolesModule,

    ClientesModule,
    CasosModule,
    ProyectosModule,
    FlujosTrabajoModule,
    RegistrosTiempoModule,
    DocumentosModule,
    PlantillasModule,
    GastosModule,
    FacturacionModule,
    ReportesModule,
    NotificacionesModule,
    BitacoraModule,
    AgendaModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    // Providers globales si es necesario
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware para extraer tenant ID de headers
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Middleware de logging
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        { path: '/health', method: RequestMethod.GET },
        { path: '/docs', method: RequestMethod.GET },
        { path: '/uploads/(.*)', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
