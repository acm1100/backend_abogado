import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsObject, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfiguracionEmpresaDto {
  @ApiProperty({
    description: 'Configuración de facturación',
    example: { 
      monedaPorDefecto: 'MXN',
      impuestosPorDefecto: 16,
      terminosPago: 30
    }
  })
  @IsOptional()
  @IsObject()
  facturacion?: {
    monedaPorDefecto?: string;
    impuestosPorDefecto?: number;
    terminosPago?: number;
  };

  @ApiProperty({
    description: 'Configuración de notificaciones',
    example: {
      emailNotificaciones: true,
      smsNotificaciones: false,
      frecuenciaResumenes: 'semanal'
    }
  })
  @IsOptional()
  @IsObject()
  notificaciones?: {
    emailNotificaciones?: boolean;
    smsNotificaciones?: boolean;
    frecuenciaResumenes?: string;
  };

  @ApiProperty({
    description: 'Configuración de seguridad',
    example: {
      autenticacionDoble: true,
      sesionExpiracion: 8,
      intentosMaximos: 3
    }
  })
  @IsOptional()
  @IsObject()
  seguridad?: {
    autenticacionDoble?: boolean;
    sesionExpiracion?: number;
    intentosMaximos?: number;
  };

  @ApiProperty({
    description: 'Configuración de reportes',
    example: {
      formatoPorDefecto: 'PDF',
      incluirLogos: true,
      plantillaPorDefecto: 'empresarial'
    }
  })
  @IsOptional()
  @IsObject()
  reportes?: {
    formatoPorDefecto?: string;
    incluirLogos?: boolean;
    plantillaPorDefecto?: string;
  };
}