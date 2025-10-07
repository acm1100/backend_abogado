import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  ROLES_KEY,
  LEVEL_KEY,
  RequiredPermission,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard para verificación de roles y permisos (RBAC)
 * Trabaja en conjunto con JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Obtener requisitos de la metadata
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredLevel = this.reflector.getAllAndOverride<number>(LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay requisitos específicos, permitir acceso
    if (!requiredPermissions && !requiredRoles && requiredLevel === undefined) {
      return true;
    }

    // Verificar nivel jerárquico
    if (requiredLevel !== undefined) {
      if (!user.rol || user.rol.nivel > requiredLevel) {
        throw new ForbiddenException(
          `Nivel insuficiente. Requerido: ${requiredLevel}, actual: ${user.rol?.nivel || 'sin rol'}`
        );
      }
    }

    // Verificar roles específicos
    if (requiredRoles) {
      const hasRole = requiredRoles.some(role => 
        user.rol?.nombre.toLowerCase() === role.toLowerCase()
      );

      if (!hasRole) {
        throw new ForbiddenException(
          `Rol insuficiente. Requerido: ${requiredRoles.join(' o ')}, actual: ${user.rol?.nombre || 'sin rol'}`
        );
      }
    }

    // Verificar permisos específicos
    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        this.userHasPermission(user, permission.modulo, permission.accion)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission =>
          !this.userHasPermission(user, permission.modulo, permission.accion)
        );

        throw new ForbiddenException(
          `Permisos insuficientes. Faltantes: ${missingPermissions
            .map(p => `${p.modulo}.${p.accion}`)
            .join(', ')}`
        );
      }
    }

    // Verificar propiedad del recurso si es requerido
    if (request.requireOwnershipCheck) {
      const canAccess = await this.checkResourceOwnership(request, user);
      if (!canAccess) {
        throw new ForbiddenException('No tienes permisos para acceder a este recurso');
      }
    }

    return true;
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  private userHasPermission(user: any, modulo: string, accion: string): boolean {
    if (!user.rol || !user.rol.permisos) {
      return false;
    }

    return user.rol.permisos.some(
      (rp: any) =>
        rp.permiso.modulo === modulo &&
        rp.permiso.accion === accion &&
        rp.permiso.activo
    );
  }

  /**
   * Verifica la propiedad del recurso
   * Esta implementación básica puede ser extendida por servicios específicos
   */
  private async checkResourceOwnership(request: any, user: any): Promise<boolean> {
    // Obtener ID del recurso desde los parámetros
    const resourceId = request.params.id || request.params.clienteId || request.params.casoId;
    
    if (!resourceId) {
      // Si no hay ID de recurso específico, permitir acceso
      return true;
    }

    // Para recursos que el usuario puede poseer directamente
    const userOwnedResources = [
      'usuarios', 'perfil', 'configuracion'
    ];

    const path = request.route?.path || request.url;
    const isUserResource = userOwnedResources.some(resource => 
      path.includes(resource)
    );

    if (isUserResource && resourceId === user.id) {
      return true;
    }

    // Para otros recursos, verificar through relaciones
    // Esta lógica puede ser extendida por servicios específicos
    // Por ahora, permitir acceso si es administrador o gerente
    return user.rol && user.rol.nivel <= 2;
  }

  /**
   * Método auxiliar para verificar múltiples permisos
   */
  private userHasAnyPermission(user: any, permissions: RequiredPermission[]): boolean {
    return permissions.some(permission =>
      this.userHasPermission(user, permission.modulo, permission.accion)
    );
  }

  /**
   * Método auxiliar para verificar acceso a módulo
   */
  private userCanAccessModule(user: any, modulo: string): boolean {
    if (!user.rol || !user.rol.permisos) {
      return false;
    }

    return user.rol.permisos.some(
      (rp: any) => rp.permiso.modulo === modulo && rp.permiso.activo
    );
  }
}
