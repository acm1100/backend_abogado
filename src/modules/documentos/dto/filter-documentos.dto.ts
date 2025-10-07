import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  TipoDocumento,
  EstadoDocumento,
  CategoriaDocumento,
} from '../../../entities/documentacion.entity';

export class FilterDocumentosDto {
  @ApiPropertyOptional({
    description: 'Buscar por nombre, descripción o contenido',
    example: 'demanda civil',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de documento',
    enum: TipoDocumento,
    example: TipoDocumento.LEGAL,
  })
  @IsOptional()
  @IsEnum(TipoDocumento)
  tipo?: TipoDocumento;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría del documento',
    enum: CategoriaDocumento,
    example: CategoriaDocumento.DEMANDA,
  })
  @IsOptional()
  @IsEnum(CategoriaDocumento)
  categoria?: CategoriaDocumento;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del documento',
    enum: EstadoDocumento,
    example: EstadoDocumento.PUBLICADO,
  })
  @IsOptional()
  @IsEnum(EstadoDocumento)
  estado?: EstadoDocumento;

  @ApiPropertyOptional({
    description: 'Filtrar por caso ID',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por cliente ID',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por proyecto ID',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por usuario creador ID',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  usuarioCreadorId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo MIME',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  tipoMime?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por autor (metadatos)',
    example: 'Dr. Juan Pérez',
  })
  @IsOptional()
  @IsString()
  autor?: string;

  @ApiPropertyOptional({
    description: 'Fecha de creación desde',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaCreacionDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de creación hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaCreacionHasta?: string;

  @ApiPropertyOptional({
    description: 'Fecha de modificación desde',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaModificacionDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de modificación hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaModificacionHasta?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento desde',
    example: '2024-06-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimientoDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimientoHasta?: string;

  @ApiPropertyOptional({
    description: 'Tamaño mínimo del archivo en bytes',
    example: 1024,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || undefined)
  tamanoMinimo?: number;

  @ApiPropertyOptional({
    description: 'Tamaño máximo del archivo en bytes',
    example: 10485760, // 10MB
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || undefined)
  tamanoMaximo?: number;

  @ApiPropertyOptional({
    description: 'Solo documentos confidenciales',
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
    description: 'Solo documentos activos',
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
    description: 'Solo documentos firmados',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  firmado?: boolean;

  @ApiPropertyOptional({
    description: 'Solo plantillas',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  esPlantilla?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por etiquetas',
    example: ['urgente', 'confidencial'],
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
    description: 'Filtrar por palabras clave (metadatos)',
    example: ['contrato', 'demanda'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(keyword => keyword.trim());
    }
    return value;
  })
  palabrasClave?: string[];

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
      'fechaModificacion',
      'fechaVencimiento',
      'nombre',
      'tamano',
      'tipo',
      'categoria',
      'estado',
    ],
    default: 'fechaCreacion',
  })
  @IsOptional()
  @IsEnum([
    'fechaCreacion',
    'fechaModificacion',
    'fechaVencimiento',
    'nombre',
    'tamano',
    'tipo',
    'categoria',
    'estado',
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
