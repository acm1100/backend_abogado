import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  TipoCaso,
  EstadoCaso,
  PrioridadCaso,
} from '../../../entities/caso.entity';

export class FilterCasosDto {
  @ApiPropertyOptional({
    description: 'Buscar por título o descripción',
    example: 'incumplimiento',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de caso',
    enum: TipoCaso,
    example: TipoCaso.CIVIL,
  })
  @IsOptional()
  @IsEnum(TipoCaso)
  tipo?: TipoCaso;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del caso',
    enum: EstadoCaso,
    example: EstadoCaso.EN_PROCESO,
  })
  @IsOptional()
  @IsEnum(EstadoCaso)
  estado?: EstadoCaso;

  @ApiPropertyOptional({
    description: 'Filtrar por prioridad',
    enum: PrioridadCaso,
    example: PrioridadCaso.ALTA,
  })
  @IsOptional()
  @IsEnum(PrioridadCaso)
  prioridad?: PrioridadCaso;

  @ApiPropertyOptional({
    description: 'Filtrar por cliente ID',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por usuario responsable ID',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  usuarioId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por especialidad',
    example: 'Derecho Contractual',
  })
  @IsOptional()
  @IsString()
  especialidad?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por juzgado',
    example: '1er Juzgado Civil',
  })
  @IsOptional()
  @IsString()
  juzgado?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio desde',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaInicioDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaInicioHasta?: string;

  @ApiPropertyOptional({
    description: 'Fecha límite desde',
    example: '2024-06-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaLimiteDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha límite hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaLimiteHasta?: string;

  @ApiPropertyOptional({
    description: 'Solo casos confidenciales',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  confidencial?: boolean;

  @ApiPropertyOptional({
    description: 'Solo casos activos',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por etiquetas',
    example: ['urgente', 'corporativo'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim());
    }
    return value;
  })
  etiquetas?: string[];

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value) || 1)
  pagina?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const num = parseInt(value) || 20;
    return Math.min(Math.max(num, 1), 100); // Min 1, Max 100
  })
  limite?: number = 20;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    example: 'fechaCreacion',
    enum: [
      'fechaCreacion',
      'fechaActualizacion',
      'fechaInicio',
      'fechaLimite',
      'titulo',
      'prioridad',
      'estado',
      'montoReclamado',
    ],
    default: 'fechaCreacion',
  })
  @IsOptional()
  @IsEnum([
    'fechaCreacion',
    'fechaActualizacion',
    'fechaInicio',
    'fechaLimite',
    'titulo',
    'prioridad',
    'estado',
    'montoReclamado',
  ])
  ordenarPor?: string = 'fechaCreacion';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  direccion?: 'ASC' | 'DESC' = 'DESC';
}
