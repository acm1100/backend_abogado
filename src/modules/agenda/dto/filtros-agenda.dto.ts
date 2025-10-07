import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEvento, EstadoEvento, PrioridadEvento } from '../../../entities/evento.entity';

export class FiltrosAgendaDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango de búsqueda',
    example: '2024-02-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango de búsqueda',
    example: '2024-02-29T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de evento',
    enum: TipoEvento,
    example: TipoEvento.AUDIENCIA,
  })
  @IsOptional()
  @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del evento',
    enum: EstadoEvento,
    example: EstadoEvento.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(EstadoEvento)
  estado?: EstadoEvento;

  @ApiPropertyOptional({
    description: 'Filtrar por prioridad',
    enum: PrioridadEvento,
    example: PrioridadEvento.ALTA,
  })
  @IsOptional()
  @IsEnum(PrioridadEvento)
  prioridad?: PrioridadEvento;

  @ApiPropertyOptional({
    description: 'ID del usuario responsable',
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
    description: 'Término de búsqueda en título y descripción',
    example: 'audiencia',
  })
  @IsOptional()
  @IsString()
  buscar?: string;
}
