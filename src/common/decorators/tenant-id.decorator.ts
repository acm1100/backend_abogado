import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para extraer el Tenant ID (empresa_id) de la request
 * El tenant ID puede venir del header X-Tenant-ID o del usuario autenticado
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Prioridad 1: Header X-Tenant-ID
    const tenantFromHeader = request.headers['x-tenant-id'];
    if (tenantFromHeader) {
      return tenantFromHeader;
    }
    
    // Prioridad 2: Usuario autenticado
    const user = request.user;
    if (user?.empresaId) {
      return user.empresaId;
    }
    
    // Prioridad 3: Query parameter (para casos especiales)
    const tenantFromQuery = request.query?.tenantId;
    if (tenantFromQuery) {
      return tenantFromQuery;
    }
    
    throw new Error('Tenant ID no encontrado en la request');
  },
);

/**
 * Decorador para obtener el usuario actual con información de tenant
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Decorador para obtener información específica del usuario
 */
export const UserInfo = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return data ? user?.[data] : user;
  },
);
