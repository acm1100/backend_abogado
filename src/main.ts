import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  app.use(helmet.default());
  app.use(compression());

  // CORS configuración
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['health', 'docs'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Pipes globales para validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Guards globales
  const reflector = app.get('Reflector');
  
  // Interceptores globales
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );

  // Documentación Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema de Gestión de Despacho de Abogados - API')
    .setDescription(
      'API REST para gestión integral de despachos de abogados en Perú. ' +
      'Incluye manejo de casos, clientes, facturación, tiempo, documentos y más.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-ID',
        in: 'header',
        description: 'ID de la empresa (multi-tenant)',
      },
      'X-Tenant-ID',
    )
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Empresas', 'Gestión de empresas (multi-tenant)')
    .addTag('Usuarios', 'Gestión de usuarios')
    .addTag('Roles', 'Sistema de roles y permisos (RBAC)')
    .addTag('Clientes', 'CRM jurídico - gestión de clientes')
    .addTag('Casos', 'Gestión de casos legales')
    .addTag('Proyectos', 'Gestión de proyectos y tareas')
    .addTag('Tiempo', 'Registro de tiempo facturable')
    .addTag('Gastos', 'Gestión de gastos y reembolsos')
    .addTag('Facturación', 'Sistema de facturación y cobranza')
    .addTag('Documentos', 'Gestión documental con versionado')
    .addTag('Agenda', 'Calendario y eventos')
    .addTag('Notificaciones', 'Sistema de notificaciones')
    .addTag('Reportes', 'Reportes y dashboards')
    .addTag('Workflows', 'Flujos de trabajo automatizados')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Puerto del servidor
  const port = configService.get('PORT', 3000);
  
  await app.listen(port);
  
  logger.log(`Aplicación iniciada en: http://localhost:${port}`);
  logger.log(`Documentación disponible en: http://localhost:${port}/docs`);
  logger.log(`Entorno: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exit(1);
});
