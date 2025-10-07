import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, IS_AUTH_ONLY_KEY } from '../decorators/public.decorator';
import { ALLOWED_USERS_KEY, ONLY_OWNER_KEY } from '../decorators/permissions.decorator';

/**
 * Guard principal para autenticación JWT
 * Maneja rutas públicas, privadas y verificación de propietario
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Verificar autenticación JWT
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar si el usuario está activo
    if (!user.activo) {
      throw new ForbiddenException('Usuario inactivo');
    }

    // Verificar si el usuario está bloqueado
    if (user.estaBloqueado) {
      throw new ForbiddenException('Usuario bloqueado temporalmente');
    }

    // Verificar tenant ID consistency
    const tenantIdHeader = request.headers['x-tenant-id'];
    if (tenantIdHeader && tenantIdHeader !== user.empresaId) {
      throw new ForbiddenException('Tenant ID no coincide con el usuario autenticado');
    }

    // Si es solo autenticación (sin permisos específicos), permitir acceso
    const isAuthOnly = this.reflector.getAllAndOverride<boolean>(IS_AUTH_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAuthOnly) {
      return true;
    }

    // Verificar usuarios específicos permitidos
    const allowedUsers = this.reflector.getAllAndOverride<string[]>(ALLOWED_USERS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (allowedUsers && !allowedUsers.includes(user.id)) {
      throw new ForbiddenException('Usuario no autorizado para este recurso');
    }

    // Verificar propiedad del recurso (se implementará en el servicio)
    const onlyOwner = this.reflector.getAllAndOverride<boolean>(ONLY_OWNER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (onlyOwner) {
      // Esta verificación se delega al RolesGuard que tiene acceso a los servicios
      request.requireOwnershipCheck = true;
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
      
      if (!token) {
        throw new UnauthorizedException('Token de acceso requerido');
      }

      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token de acceso expirado');
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token de acceso malformado');
      }

      throw new UnauthorizedException('Error de autenticación');
    }

    return user;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
