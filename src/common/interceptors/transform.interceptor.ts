import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { classToPlain } from 'class-transformer';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
  method: string;
  tenantId?: string;
  userId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: Record<string, any>;
}

/**
 * Interceptor para transformar y estandarizar las respuestas de la API
 * Aplica transformaciones de class-transformer y formatea la respuesta
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Transformar datos usando class-transformer
        const transformedData = data ? classToPlain(data) : data;

        // Extraer información de paginación si existe
        let pagination;
        let actualData = transformedData;

        if (transformedData && typeof transformedData === 'object') {
          if ('items' in transformedData && 'pagination' in transformedData) {
            // Formato de paginación estándar
            actualData = transformedData.items;
            pagination = transformedData.pagination;
          } else if ('data' in transformedData && 'meta' in transformedData) {
            // Formato alternativo
            actualData = transformedData.data;
            if (transformedData.meta.pagination) {
              pagination = transformedData.meta.pagination;
            }
          }
        }

        // Determinar el mensaje según el método HTTP
        const method = request.method;
        const statusCode = response.statusCode;
        
        let message = this.getDefaultMessage(method, statusCode);
        
        // Si los datos incluyen un mensaje personalizado, usarlo
        if (transformedData && typeof transformedData === 'object' && 'message' in transformedData) {
          message = transformedData.message;
        }

        const apiResponse: ApiResponse<T> = {
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          message,
          data: actualData,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          tenantId: request.user?.empresaId || request.headers['x-tenant-id'],
          userId: request.user?.id,
        };

        // Agregar paginación si existe
        if (pagination) {
          apiResponse.pagination = pagination;
        }

        // Agregar metadata adicional
        const meta: Record<string, any> = {
          processingTime: `${processingTime}ms`,
        };

        // Agregar información de rate limiting si existe
        if (response.getHeader('X-RateLimit-Limit')) {
          meta.rateLimit = {
            limit: response.getHeader('X-RateLimit-Limit'),
            remaining: response.getHeader('X-RateLimit-Remaining'),
            reset: response.getHeader('X-RateLimit-Reset'),
          };
        }

        // Agregar información del usuario si está disponible
        if (request.user) {
          meta.user = {
            id: request.user.id,
            nombre: request.user.nombreCompleto,
            rol: request.user.rol?.nombre,
          };
        }

        apiResponse.meta = meta;

        return apiResponse;
      }),
    );
  }

  /**
   * Obtiene el mensaje por defecto según el método HTTP y código de estado
   */
  private getDefaultMessage(method: string, statusCode: number): string {
    if (statusCode >= 400) {
      return 'Error en la operación';
    }

    switch (method) {
      case 'GET':
        return 'Datos obtenidos exitosamente';
      case 'POST':
        return 'Recurso creado exitosamente';
      case 'PUT':
      case 'PATCH':
        return 'Recurso actualizado exitosamente';
      case 'DELETE':
        return 'Recurso eliminado exitosamente';
      default:
        return 'Operación completada exitosamente';
    }
  }
}

/**
 * Interceptor específico para paginación
 */
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Establecer valores por defecto para paginación
    if (request.query) {
      request.query.page = parseInt(request.query.page) || 1;
      request.query.limit = Math.min(parseInt(request.query.limit) || 10, 100); // Máximo 100
      request.query.skip = (request.query.page - 1) * request.query.limit;
    }

    return next.handle();
  }
}

/**
 * Interceptor para logging de requests
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'];
    const ip = request.ip;
    const userId = request.user?.id;
    const tenantId = request.user?.empresaId || headers['x-tenant-id'];

    const startTime = Date.now();

    console.log(`📥 ${method} ${url}`, {
      userId,
      tenantId,
      ip,
      userAgent,
      query,
      params,
      ...(method !== 'GET' && { body }),
    });

    return next.handle().pipe(
      map((data) => {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        console.log(`📤 ${method} ${url} - ${processingTime}ms`, {
          userId,
          tenantId,
          processingTime,
        });

        return data;
      }),
    );
  }
}
