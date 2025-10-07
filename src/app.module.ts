import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';

// Base de datos
import { DatabaseModule } from './database/database.module';

// Middleware
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

// Módulos de la aplicación
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { RolesModule } from './modules/roles/roles.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { CasosModule } from './modules/casos/casos.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { FacturacionModule } from './modules/facturacion/facturacion.module';
import { GastosModule } from './modules/gastos/gastos.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { FlujosTrabajoModule } from './modules/flujos-trabajo/flujos-trabajo.module';
import { RegistrosTiempoModule } from './modules/registros-tiempo/registros-tiempo.module';
import { PlantillasModule } from './modules/plantillas/plantillas.module';
import { BitacoraModule } from './modules/bitacora/bitacora.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Base de datos
    DatabaseModule,

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 100, // 100 requests por minuto
    }]),

    // Módulos de autenticación y autorización
    AuthModule,
    UsuariosModule,
    RolesModule,

    // Módulos de negocio principales
    EmpresasModule,
    ClientesModule,
    CasosModule,
    ProyectosModule,

    // Módulos de facturación y finanzas
    FacturacionModule,
    GastosModule,

    // Módulos de gestión documental y tiempo
    DocumentosModule,
    RegistrosTiempoModule,
    PlantillasModule,

    // Módulos de comunicación y automatización
    AgendaModule,
    NotificacionesModule,
    FlujosTrabajoModule,

    // Módulos de análisis y utilidades
    ReportesModule,
    BitacoraModule,

    // Módulos básicos
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, TenantMiddleware)
      .forRoutes('*');
  }
}