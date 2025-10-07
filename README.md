# PAB Legal Management System

## Descripción

API REST para sistema de gestión integral de bufetes de abogados. Desarrollado con NestJS, TypeScript y PostgreSQL para el manejo completo de casos legales, clientes, documentos y facturación.

## Características

### Multi-tenant
Arquitectura que permite múltiples empresas con aislamiento completo de datos.

### Gestión de Usuarios
Sistema de roles y permisos con autenticación JWT y control de acceso granular.

### CRM Jurídico
Administración completa de clientes, casos legales e historial de interacciones.

### Gestión Documental
Almacenamiento seguro con plantillas personalizables y control de versiones.

### Facturación
Sistema automatizado de facturación con control de gastos y registro de tiempo.

### Reportes
Generación de reportes personalizables y métricas de productividad.

### Notificaciones
Sistema de alertas por email y recordatorios automáticos.

### Agenda
Gestión de citas, audiencias y eventos con recordatorios.

## Stack Tecnológico

- Backend: NestJS + TypeScript
- Base de Datos: PostgreSQL + TypeORM  
- Cache: Redis
- Autenticación: JWT + Passport
- Documentación: Swagger/OpenAPI
- Validación: class-validator + class-transformer
- Testing: Jest
- Logging: Winston

## Estructura del Proyecto

```
src/
├── common/                 # Utilidades compartidas
│   ├── decorators/        # Decoradores personalizados
│   ├── guards/           # Guards de autenticación y autorización
│   ├── interceptors/     # Interceptores globales
│   └── middleware/       # Middleware personalizado
├── config/               # Configuración de la aplicación
├── database/            # Configuración de base de datos
├── entities/            # Entidades de TypeORM
├── modules/             # Módulos de la aplicación
│   ├── auth/           # Autenticación y autorización
│   ├── usuarios/       # Gestión de usuarios
│   ├── empresas/       # Gestión de empresas
│   ├── roles/          # Gestión de roles y permisos
│   ├── clientes/       # Gestión de clientes
│   ├── casos/          # Gestión de casos legales
│   ├── documentos/     # Gestión documental
│   ├── proyectos/      # Gestión de proyectos
│   ├── facturacion/    # Facturación y cobranza
│   ├── gastos/         # Control de gastos
│   ├── reportes/       # Reportes y analytics
│   ├── agenda/         # Calendario y eventos
│   ├── notificaciones/ # Sistema de notificaciones
│   ├── plantillas/     # Plantillas de documentos
│   ├── bitacora/       # Auditoría y logs
│   └── health/         # Health checks
├── app.module.ts        # Módulo principal
└── main.ts             # Punto de entrada
```

## Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Instalación

```bash
git clone <repository-url>
cd backend-app-abogados
npm install
cp .env.example .env
```

Configurar variables en `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=pab_legal

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

REDIS_HOST=localhost
REDIS_PORT=6379
```

### Iniciar aplicación

```bash
# Desarrollo
npm run start:dev

# Producción  
npm run build
npm run start:prod
```

## API Documentation

Documentación Swagger disponible en: `http://localhost:3000/docs`

### Endpoints

- `POST /auth/login` - Autenticación
- `GET /usuarios` - Listar usuarios  
- `GET /casos` - Listar casos
- `GET /health` - Health check

## Sistema de Permisos

Roles disponibles:
- Super Admin
- Admin Empresa  
- Abogado Senior/Junior
- Asistente Legal
- Contador
- Recepcionista

Permisos granulares por módulo (crear, leer, actualizar, eliminar).

## Testing

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Monitoreo

Health checks disponibles en `/health` con métricas de rendimiento y estado de servicios.

## Deployment

Usar Docker para producción:

```bash
docker-compose up -d
```

## Licencia

Propietario - PAB Development Team
