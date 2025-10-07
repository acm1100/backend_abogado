import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Verificación básica de salud',
    description: 'Endpoint para verificar el estado básico de la aplicación'
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de salud de la aplicación',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-02-15T10:30:00Z' },
        uptime: { type: 'number', example: 3600 },
        responseTime: { type: 'string', example: '15ms' },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'connected' },
            responseTime: { type: 'string', example: '5ms' }
          }
        }
      }
    }
  })
  async checkHealth() {
    return this.healthService.checkHealth();
  }

  @Get('detailed')
  @Public()
  @ApiOperation({ 
    summary: 'Verificación detallada de salud',
    description: 'Endpoint para obtener información detallada del estado de la aplicación'
  })
  @ApiResponse({
    status: 200,
    description: 'Estado detallado de salud de la aplicación',
  })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }

  @Get('ready')
  @Public()
  @ApiOperation({ 
    summary: 'Verificación de preparación',
    description: 'Verifica si la aplicación está lista para recibir tráfico'
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de preparación de la aplicación',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        timestamp: { type: 'string', example: '2024-02-15T10:30:00Z' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'ok' }
          }
        }
      }
    }
  })
  async checkReadiness() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  @Public()
  @ApiOperation({ 
    summary: 'Verificación de vitalidad',
    description: 'Verifica si la aplicación está funcionando (liveness probe)'
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de vitalidad de la aplicación',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'alive' },
        timestamp: { type: 'string', example: '2024-02-15T10:30:00Z' },
        uptime: { type: 'number', example: 3600 }
      }
    }
  })
  async checkLiveness() {
    return this.healthService.checkLiveness();
  }
}
