import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para extraer y validar el Tenant ID del header
 * Establece el tenant ID en el request para uso posterior
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extraer tenant ID del header
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(tenantId)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Formato de Tenant ID inválido. Debe ser un UUID válido.',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }

      // Almacenar en el request para uso posterior
      (req as any).tenantId = tenantId;
      
      // Establecer configuración de contexto para la aplicación
      process.env.CURRENT_TENANT_ID = tenantId;
    }

    // Continuar con el siguiente middleware
    next();
  }
}
