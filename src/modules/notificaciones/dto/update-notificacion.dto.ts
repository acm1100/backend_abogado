import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateNotificacionDto } from './create-notificacion.dto';
import { IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum EstadoNotificacion {
  PENDIENTE = 'pendiente',
  ENVIADA = 'enviada',
  ENTREGADA = 'entregada',
  LEIDA = 'leida',
  ERROR = 'error',
  CANCELADA = 'cancelada',
  EXPIRADA = 'expirada'
}

export class UpdateNotificacionDto extends PartialType(
  OmitType(CreateNotificacionDto, ['destinatarios'] as const)
) {
  @ApiPropertyOptional({ 
    description: 'Estado de la notificación',
    enum: EstadoNotificacion,
    enumName: 'EstadoNotificacion'
  })
  @IsOptional()
  @IsEnum(EstadoNotificacion)
  estado?: EstadoNotificacion;

  @ApiPropertyOptional({ description: 'Si la notificación está activa' })
  @IsOptional()
  @IsBoolean()
  esActiva?: boolean;

  @ApiPropertyOptional({ description: 'Fecha de último intento de envío' })
  @IsOptional()
  @IsDateString()
  fechaUltimoIntento?: string;

  @ApiPropertyOptional({ description: 'Número de intentos realizados' })
  @IsOptional()
  numeroIntentos?: number;

  @ApiPropertyOptional({ description: 'Mensaje de error si existe' })
  @IsOptional()
  mensajeError?: string;
}

export class MarcarLeidaDto {
  @ApiPropertyOptional({ description: 'Fecha y hora de lectura' })
  @IsOptional()
  @IsDateString()
  fechaLectura?: string;
}

export class ProgramarEnvioDto {
  @ApiProperty({ description: 'Nueva fecha programada de envío' })
  @IsDateString()
  fechaProgramada: string;

  @ApiPropertyOptional({ description: 'Zona horaria para el envío' })
  @IsOptional()
  zonaHoraria?: string;
}

export class CancelarNotificacionDto {
  @ApiPropertyOptional({ description: 'Motivo de cancelación' })
  @IsOptional()
  motivoCancelacion?: string;
}
