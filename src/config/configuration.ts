import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  synchronize: boolean;
  logging: boolean;
  maxConnections: number;
  connectionTimeout: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface AppConfig {
  port: number;
  environment: string;
  apiVersion: string;
  corsOrigins: string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

export interface FileStorageConfig {
  provider: 'local' | 's3' | 'gcs';
  localPath: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
  };
}

export interface NotificationConfig {
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    from: string;
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
    };
    sendgrid?: {
      apiKey: string;
    };
  };
  sms: {
    provider: 'twilio' | 'nexmo';
    twilio?: {
      accountSid: string;
      authToken: string;
      from: string;
    };
  };
}

export interface SecurityConfig {
  bcryptRounds: number;
  jwtSecret: string;
  encryptionKey: string;
  sessionSecret: string;
  corsOrigins: string[];
  trustProxy: boolean;
}

export default registerAs('app', () => ({
  // Configuración de la aplicación
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutos
  } as AppConfig,

  // Configuración de base de datos
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'abogados_db',
    ssl: process.env.DATABASE_SSL === 'true',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10) || 10,
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT, 10) || 60000,
  } as DatabaseConfig,

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as JwtConfig,

  // Configuración de seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key',
    encryptionKey: process.env.ENCRYPTION_KEY || 'super-secret-encryption-key-32-chars',
    sessionSecret: process.env.SESSION_SECRET || 'super-secret-session-key',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    trustProxy: process.env.TRUST_PROXY === 'true',
  } as SecurityConfig,

  // Configuración de almacenamiento de archivos
  storage: {
    provider: (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'gcs') || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ],
    s3: process.env.STORAGE_PROVIDER === 's3' ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1',
    } : undefined,
  } as FileStorageConfig,

  // Configuración de notificaciones
  notifications: {
    email: {
      provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'mailgun') || 'smtp',
      from: process.env.EMAIL_FROM || 'noreply@despacho-legal.com',
      smtp: process.env.EMAIL_PROVIDER === 'smtp' ? {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      sendgrid: process.env.EMAIL_PROVIDER === 'sendgrid' ? {
        apiKey: process.env.SENDGRID_API_KEY,
      } : undefined,
    },
    sms: {
      provider: (process.env.SMS_PROVIDER as 'twilio' | 'nexmo') || 'twilio',
      twilio: process.env.SMS_PROVIDER === 'twilio' ? {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        from: process.env.TWILIO_FROM,
      } : undefined,
    },
  } as NotificationConfig,

  // Configuración específica para Perú
  peru: {
    // Configuración de validaciones específicas
    validation: {
      ruc: {
        enabled: process.env.VALIDATE_RUC === 'true',
        apiUrl: process.env.RUC_VALIDATION_API_URL,
        apiKey: process.env.RUC_VALIDATION_API_KEY,
      },
      dni: {
        enabled: process.env.VALIDATE_DNI === 'true',
        apiUrl: process.env.DNI_VALIDATION_API_URL,
        apiKey: process.env.DNI_VALIDATION_API_KEY,
      },
    },
    // Configuración de facturación electrónica
    invoicing: {
      enabled: process.env.ELECTRONIC_INVOICING === 'true',
      provider: process.env.INVOICING_PROVIDER || 'sunat',
      certificate: process.env.SUNAT_CERTIFICATE,
      ruc: process.env.COMPANY_RUC,
      username: process.env.SUNAT_USERNAME,
      password: process.env.SUNAT_PASSWORD,
      environment: process.env.SUNAT_ENVIRONMENT || 'beta', // beta o production
    },
    // Configuración de zona horaria y moneda
    locale: {
      timezone: process.env.TIMEZONE || 'America/Lima',
      currency: process.env.CURRENCY || 'PEN',
      language: process.env.LANGUAGE || 'es',
    },
  },

  // Configuración de Redis para caché y sesiones
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600, // 1 hora
  },

  // Configuración de monitoreo
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL || 'info',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000,
  },
}));
