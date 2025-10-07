import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGastoDto, ComprobanteGastoDto, ProveedorGastoDto } from './create-gasto.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsUUID,
  IsDateString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoGasto } from '../../../entities/gasto.entity';

export class UpdateComprobanteGastoDto extends PartialType(ComprobanteGastoDto) {}

export class UpdateProveedorGastoDto extends PartialType(ProveedorGastoDto) {}

export class UpdateGastoDto extends PartialType(
  OmitType(CreateGastoDto, ['comprobante', 'proveedor'] as const)
) {
  @ApiPropertyOptional({
    description: 'Información actualizada del comprobante',
    type: UpdateComprobanteGastoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateComprobanteGastoDto)
  comprobante?: UpdateComprobanteGastoDto;

  @ApiPropertyOptional({
    description: 'Información actualizada del proveedor',
    type: UpdateProveedorGastoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProveedorGastoDto)
  proveedor?: UpdateProveedorGastoDto;

  @ApiPropertyOptional({
    description: 'Estado del gasto',
    enum: EstadoGasto,
    example: EstadoGasto.APROBADO,
  })
  @IsOptional()
  @IsEnum(EstadoGasto)
  estado?: EstadoGasto;

  @ApiPropertyOptional({
    description: 'Motivo de la actualización',
    example: 'Corrección de monto por error de digitación',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoActualizacion?: string;
}

export class CambiarEstadoGastoDto {
  @ApiPropertyOptional({
    description: 'Nuevo estado del gasto',
    enum: EstadoGasto,
    example: EstadoGasto.APROBADO,
  })
  @IsEnum(EstadoGasto, {
    message: 'Estado de gasto no válido',
  })
  estado: EstadoGasto;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Aprobado por el supervisor directo',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Se requiere documentación adicional',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vigencia del cambio',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaVigencia?: string;
}

export class AsignarGastoDto {
  @ApiPropertyOptional({
    description: 'ID del caso al que asignar el gasto',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'ID del proyecto al que asignar el gasto',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'ID del cliente al que asignar el gasto',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Si el gasto debe ser reembolsable',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  reembolsable?: boolean;

  @ApiPropertyOptional({
    description: 'Si el gasto debe ser facturable',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  facturable?: boolean;

  @ApiPropertyOptional({
    description: 'Porcentaje de markup para facturación',
    example: 15.00,
  })
  @IsOptional()
  porcentajeMarkup?: number;

  @ApiPropertyOptional({
    description: 'Motivo de la asignación',
    example: 'Reasignación por cambio de responsable',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivo?: string;
}

export class ReembolsoGastoDto {
  @ApiPropertyOptional({
    description: 'Monto a reembolsar',
    example: 150.50,
  })
  @IsOptional()
  montoReembolso?: number;

  @ApiPropertyOptional({
    description: 'Método de reembolso',
    example: 'TRANSFERENCIA_BANCARIA',
    enum: ['EFECTIVO', 'TRANSFERENCIA_BANCARIA', 'CHEQUE', 'DESCUENTO_NOMINA'],
  })
  @IsOptional()
  @IsEnum(['EFECTIVO', 'TRANSFERENCIA_BANCARIA', 'CHEQUE', 'DESCUENTO_NOMINA'])
  metodoReembolso?: string;

  @ApiPropertyOptional({
    description: 'Cuenta bancaria para reembolso',
    example: '191-123456789-0-12',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  cuentaBancaria?: string;

  @ApiPropertyOptional({
    description: 'Fecha programada de reembolso',
    example: '2024-01-30',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaReembolso?: string;

  @ApiPropertyOptional({
    description: 'Observaciones del reembolso',
    example: 'Reembolso aprobado por gerencia',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Referencia bancaria o número de cheque',
    example: 'TRF-20240115-001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  referencia?: string;
}
