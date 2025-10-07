import { SetMetadata } from '@nestjs/common';

/**
 * Interfaz para definir permisos requeridos
 */
export interface RequiredPermission {
  modulo: string;
  accion: string;
}

/**
 * Decorador para requerir permisos específicos
 * Uso: @RequirePermissions('clientes.crear') o @RequirePermissions({ modulo: 'clientes', accion: 'crear' })
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: (RequiredPermission | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorador para requerir un rol específico o superior
 * Uso: @RequireRole('gerente')
 */
export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Decorador para requerir nivel jerárquico mínimo
 * Uso: @RequireLevel(2) // Nivel gerente o superior
 */
export const LEVEL_KEY = 'level';
export const RequireLevel = (level: number) =>
  SetMetadata(LEVEL_KEY, level);

/**
 * Decorador combinado para módulo y acción
 * Uso: @Permission('clientes', 'crear')
 */
export const Permission = (modulo: string, accion: string) =>
  RequirePermissions({ modulo, accion });

/**
 * Decorador para permisos con formato string "modulo:accion"
 * Uso: @Permissions('clientes:crear') o @Permissions('clientes:crear', 'usuarios:read')
 */
export const Permissions = (...permissions: string[]) => {
  const parsedPermissions = permissions.map(permission => {
    const [modulo, accion] = permission.split(':');
    return { modulo, accion };
  });
  return RequirePermissions(...parsedPermissions);
};

/**
 * Decoradores específicos para acciones comunes
 */
export const CanCreate = (modulo: string) => Permission(modulo, 'crear');
export const CanRead = (modulo: string) => Permission(modulo, 'leer');  
export const CanUpdate = (modulo: string) => Permission(modulo, 'actualizar');
export const CanDelete = (modulo: string) => Permission(modulo, 'eliminar');
export const CanApprove = (modulo: string) => Permission(modulo, 'aprobar');
export const CanExport = (modulo: string) => Permission(modulo, 'exportar');

/**
 * Decorador para acceso solo al propietario del recurso
 * Uso: @OnlyOwner() - verificará que el usuario sea el creador/propietario
 */
export const ONLY_OWNER_KEY = 'onlyOwner';
export const OnlyOwner = () => SetMetadata(ONLY_OWNER_KEY, true);

/**
 * Decorador para permitir acceso a usuarios específicos
 * Uso: @AllowUsers('usuario-id-1', 'usuario-id-2')
 */
export const ALLOWED_USERS_KEY = 'allowedUsers';
export const AllowUsers = (...userIds: string[]) =>
  SetMetadata(ALLOWED_USERS_KEY, userIds);
