import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  Length,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TipoEvento, EstadoEvento, PrioridadEvento } from '../../../entities/evento.entity';

export class CreateEventoDto {
  @ApiProperty({
    description: 'Título del evento',
    example: 'Audiencia Civil - Caso Pérez vs. López',
    maxLength: 200,
  })
  @IsString()
  @Length(1, 200)
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del evento',
    example: 'Primera audiencia del proceso civil. Recordar llevar expediente completo.',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Tipo de evento',
    enum: TipoEvento,
    example: TipoEvento.AUDIENCIA,
  })
  @IsEnum(TipoEvento)
  tipo: TipoEvento;

  @ApiPropertyOptional({
    description: 'Estado del evento',
    enum: EstadoEvento,
    example: EstadoEvento.PENDIENTE,
    default: EstadoEvento.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(EstadoEvento)
  estado?: EstadoEvento;

  @ApiPropertyOptional({
    description: 'Prioridad del evento',
    enum: PrioridadEvento,
    example: PrioridadEvento.ALTA,
    default: PrioridadEvento.NORMAL,
  })
  @IsOptional()
  @IsEnum(PrioridadEvento)
  prioridad?: PrioridadEvento;

  @ApiProperty({
    description: 'Fecha y hora de inicio del evento',
    example: '2024-02-15T10:00:00Z',
  })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin del evento',
    example: '2024-02-15T11:30:00Z',
  })
  @IsDateString()
  fechaFin: string;

  @ApiPropertyOptional({
    description: 'Si el evento dura todo el día',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esTodoDia?: boolean;

  @ApiPropertyOptional({
    description: 'Ubicación del evento',
    example: 'Juzgado Civil de Lima - Sala 5',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Confirmar asistencia del cliente 24 horas antes',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Si debe activar recordatorio',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  recordatorioActivo?: boolean;

  @ApiPropertyOptional({
    description: 'Minutos antes del evento para el recordatorio',
    example: 30,
    minimum: 5,
    maximum: 10080, // 7 días
    default: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10080)
  minutosRecordatorio?: number;

  @ApiPropertyOptional({
    description: 'Color para mostrar en el calendario (código hex)',
    example: '#FF5733',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  color?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario responsable del evento',
    example: 'user-uuid-123',
  })
  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @ApiPropertyOptional({
    description: 'ID del caso relacionado',
    example: 'caso-uuid-456',
  })
  @IsOptional()
  @IsUUID()
  casoId?: string;

  @ApiPropertyOptional({
    description: 'ID del cliente relacionado',
    example: 'cliente-uuid-789',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales en formato JSON',
    example: { 
      recordatorio_email: true, 
      recordatorio_sms: false,
      invitados: ['email1@example.com', 'email2@example.com']
    },
  })
  @IsOptional()
  @IsObject()
  metadatos?: Record<string, any>;
}
