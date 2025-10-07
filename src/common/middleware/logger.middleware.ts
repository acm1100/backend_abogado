import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para logging detallado de requests
 * Registra información de la petición para auditoría y debugging
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const tenantId = headers['x-tenant-id'];
    const authorization = headers.authorization ? 'Bearer ***' : 'None';

    const startTime = Date.now();

    // Log de request entrante
    this.logger.log(
      `[IN] ${method} ${originalUrl} - ${ip} - ${userAgent}`,
      {
        method,
        url: originalUrl,
        ip,
        userAgent,
        tenantId,
        authorization,
        timestamp: new Date().toISOString(),
      }
    );

    // Hook para capturar la respuesta
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const contentLength = data ? Buffer.byteLength(data, 'utf8') : 0;

      // Log de response
      const logger = new Logger('HTTP');
      logger.log(
        `[OUT] ${method} ${originalUrl} - ${res.statusCode} - ${processingTime}ms - ${contentLength}b`,
        {
          method,
          url: originalUrl,
          statusCode: res.statusCode,
          processingTime: `${processingTime}ms`,
          contentLength: `${contentLength}b`,
          tenantId,
          timestamp: new Date().toISOString(),
        }
      );

      return originalSend.call(this, data);
    };

    next();
  }
}

/**
 * Middleware para rate limiting personalizado por tenant
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly logger = new Logger('RateLimit');

  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const ip = req.ip;
    const key = tenantId ? `${tenantId}:${ip}` : ip;

    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 1000; // 1000 requests por ventana

    const record = this.requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Nueva ventana de tiempo
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Incrementar contador
      record.count++;
      
      if (record.count > maxRequests) {
        this.logger.warn(`Rate limit exceeded for ${key}`, {
          key,
          count: record.count,
          limit: maxRequests,
          resetTime: new Date(record.resetTime).toISOString(),
        });

        return res.status(429).json({
          success: false,
          statusCode: 429,
          message: 'Demasiadas peticiones. Intenta nuevamente más tarde.',
          timestamp: new Date().toISOString(),
          path: req.url,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
      }
    }

    // Agregar headers de rate limiting
    const remaining = Math.max(0, maxRequests - (record?.count || 1));
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil((record?.resetTime || now + windowMs) / 1000));

    next();
  }

  // Limpiar registros antiguos periódicamente
  cleanupOldRecords() {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}
