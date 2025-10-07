import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para marcar rutas como públicas (sin autenticación)
 * Uso: @Public() antes del método del controlador
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Decorador para marcar rutas que solo requieren autenticación básica
 * (sin verificación de permisos específicos)
 */
export const IS_AUTH_ONLY_KEY = 'isAuthOnly';
export const AuthOnly = () => SetMetadata(IS_AUTH_ONLY_KEY, true);
