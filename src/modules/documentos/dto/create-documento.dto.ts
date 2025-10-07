import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  IsObject,
  IsNumber,
  Length,
  ValidateNested,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  TipoDocumento, 
  EstadoDocumento, 
  CategoriaDocumento 
} from '../../../entities/documentacion.entity';

export class MetadatosDocumentoDto {
  @ApiPropertyOptional({
    description: 'Autor del documento',
    example: 'Dr. Juan Pérez',
  })
  @IsOptional()
  @IsString()
  autor?: string;

  @ApiPropertyOptional({
    description: 'Asunto o tema del documento',
    example: 'Demanda por incumplimiento contractual',
  })
  @IsOptional()
  @IsString()
  asunto?: string;

  @ApiPropertyOptional({
    description: 'Palabras clave del documento',
    example: ['contrato', 'incumplimiento', 'demanda'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  palabrasClave?: string[];

  @ApiPropertyOptional({
    description: 'Idioma del documento',
    example: 'es',
    enum: ['es', 'en', 'pt', 'fr'],
  })
  @IsOptional()
  @IsEnum(['es', 'en', 'pt', 'fr'])
  idioma?: string;

  @ApiPropertyOptional({
    description: 'Número de páginas',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  numeroPaginas?: number;

  @ApiPropertyOptional({
    description: 'Fecha del documento original',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaDocumento?: string;

  @ApiPropertyOptional({
    description: 'Número de documento oficial',
    example: 'DOC-2024-001',
  })
  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @ApiPropertyOptional({
    description: 'Entidad emisora del documento',
    example: 'Poder Judicial del Perú',
  })
  @IsOptional()
  @IsString()
  entidadEmisora?: string;
}

export class ConfiguracionDocumentoDto {
  @ApiPropertyOptional({
    description: 'Si el documento requiere firma digital',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereFirma?: boolean = false;

  @ApiPropertyOptional({
    description: 'Si el documento es plantilla',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esPlantilla?: boolean = false;

  @ApiPropertyOptional({
    description: 'Si permite versionado',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  permiteVersionado?: boolean = true;

  @ApiPropertyOptional({
    description: 'Retención en días (0 = indefinido)',
    example: 2555, // 7 años
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  retencionDias?: number = 0;

  @ApiPropertyOptional({
    description: 'Si requiere aprobación antes de publicar',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean = false;

  @ApiPropertyOptional({
    description: 'Usuarios que pueden aprobar el documento',
    example: ['uuid-usuario-1', 'uuid-usuario-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  aprobadores?: string[];

  @ApiPropertyOptional({
    description: 'Configuración de acceso',
  })
  @IsOptional()
  @IsObject()
  acceso?: {
    publico?: boolean;
    equipoAsignado?: string[];
    rolesPermitidos?: string[];
    clientesPermitidos?: string[];
  };
}

export class CreateDocumentoDto {
  @ApiProperty({
    description: 'Nombre del documento',
    example: 'Demanda Civil - Caso ABC vs XYZ',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @Length(3, 200, {
    message: 'El nombre debe tener entre 3 y 200 caracteres',
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción del documento',
    example: 'Demanda presentada ante el Juzgado Civil por incumplimiento contractual',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @Length(10, 1000, {
    message: 'La descripción debe tener entre 10 y 1000 caracteres',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de documento',
    enum: TipoDocumento,
    example: TipoDocumento.LEGAL,
  })
  @IsEnum(TipoDocumento, {
    message: 'Tipo de documento no válido',
  })
  tipo: TipoDocumento;

  @ApiProperty({
    description: 'Categoría del documento',
    enum: CategoriaDocumento,
    example: CategoriaDocumento.DEMANDA,
  })
  @IsEnum(CategoriaDocumento, {
    message: 'Categoría de documento no válida',
  })
  categoria: CategoriaDocumento;

  @ApiProperty({
    description: 'Nombre del archivo original',
    example: 'demanda_caso_abc.pdf',
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  nombreArchivo: string;

  @ApiProperty({
    description: 'Tipo MIME del archivo',
    example: 'application/pdf',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  tipoMime: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 2048576,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'El tamaño debe ser mayor a 0 bytes' })
  tamano: number;

  @ApiProperty({
    description: 'Hash del archivo para verificación de integridad',
    example: 'sha256:abc123def456...',
    maxLength: 128,
  })
  @IsString()
  @Length(1, 128)
  hash: string;

  @ApiProperty({
    description: 'Ruta donde se almacena el archivo',
    example: '/uploads/documentos/2024/01/uuid-documento.pdf',
    maxLength: 500,
  })
  @IsString()
  @Length(1, 500)
  rutaArchivo: string;

  @ApiPropertyOptional({
    description: 'ID del caso asociado',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'ID del cliente asociado',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'ID del proyecto asociado',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'Estado inicial del documento',
    enum: EstadoDocumento,
    example: EstadoDocumento.BORRADOR,
    default: EstadoDocumento.BORRADOR,
  })
  @IsOptional()
  @IsEnum(EstadoDocumento)
  estado?: EstadoDocumento = EstadoDocumento.BORRADOR;

  @ApiPropertyOptional({
    description: 'Etiquetas del documento',
    example: ['urgente', 'confidencial', 'demanda'],
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
    description: 'Observaciones sobre el documento',
    example: 'Documento revisado por el área legal',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Si el documento es confidencial',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  confidencial?: boolean = false;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales del documento',
    type: MetadatosDocumentoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetadatosDocumentoDto)
  metadatos?: MetadatosDocumentoDto;

  @ApiPropertyOptional({
    description: 'Configuración específica del documento',
    type: ConfiguracionDocumentoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionDocumentoDto)
  configuracion?: ConfiguracionDocumentoDto;

  @ApiPropertyOptional({
    description: 'Si el documento está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;
}
