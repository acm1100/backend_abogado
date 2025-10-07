import { PartialType, OmitType } from '@nestjs/swagger';
import { 
  CreateFlujoTrabajoDto, 
  PasoFlujoDto, 
  TriggerFlujoDto,
  EstadoFlujoTrabajo,
  AccionPasoDto
} from './create-flujo-trabajo.dto';
import { CondicionPasoDto } from './condicion-paso.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsNumber,
  Length,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePasoFlujoDto extends PartialType(PasoFlujoDto) {}

export class UpdateTriggerFlujoDto extends PartialType(TriggerFlujoDto) {}

export class UpdateFlujoTrabajoDto extends PartialType(
  OmitType(CreateFlujoTrabajoDto, ['pasos', 'triggers'] as const)
) {
  @ApiPropertyOptional({
    description: 'Pasos actualizados del flujo',
    type: [UpdatePasoFlujoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePasoFlujoDto)
  pasos?: UpdatePasoFlujoDto[];

  @ApiPropertyOptional({
    description: 'Triggers actualizados del flujo',
    type: [UpdateTriggerFlujoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTriggerFlujoDto)
  triggers?: UpdateTriggerFlujoDto[];

  @ApiPropertyOptional({
    description: 'Estado del flujo de trabajo',
    enum: EstadoFlujoTrabajo,
    example: EstadoFlujoTrabajo.ACTIVO,
  })
  @IsOptional()
  @IsEnum(EstadoFlujoTrabajo)
  estado?: EstadoFlujoTrabajo;

  @ApiPropertyOptional({
    description: 'Motivo de la actualización',
    example: 'Corrección en el proceso de aprobación',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoActualizacion?: string;

  @ApiPropertyOptional({
    description: 'Nueva versión del flujo',
    example: '1.1.0',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  version?: string;
}

export class CambiarEstadoFlujoDto {
  @ApiPropertyOptional({
    description: 'Nuevo estado del flujo',
    enum: EstadoFlujoTrabajo,
    example: EstadoFlujoTrabajo.ACTIVO,
  })
  @IsEnum(EstadoFlujoTrabajo, {
    message: 'Estado de flujo no válido',
  })
  estado: EstadoFlujoTrabajo;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Activación del flujo tras pruebas exitosas',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Flujo validado por el equipo legal',
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

export class EjectutarFlujoDto {
  @ApiPropertyOptional({
    description: 'ID de la entidad que activa el flujo',
    example: 'uuid-entidad-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  entidadId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de entidad',
    example: 'GASTO',
    enum: ['CASO', 'GASTO', 'FACTURA', 'DOCUMENTO', 'PROYECTO', 'CLIENTE', 'USUARIO'],
  })
  @IsOptional()
  @IsEnum(['CASO', 'GASTO', 'FACTURA', 'DOCUMENTO', 'PROYECTO', 'CLIENTE', 'USUARIO'])
  tipoEntidad?: string;

  @ApiPropertyOptional({
    description: 'Datos contextuales para el flujo',
  })
  @IsOptional()
  @IsObject()
  datosContexto?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Usuario que ejecuta el flujo',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  usuarioEjecutor?: string;

  @ApiPropertyOptional({
    description: 'Prioridad de ejecución',
    example: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  prioridadEjecucion?: number;

  @ApiPropertyOptional({
    description: 'Si debe ejecutarse inmediatamente',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ejecutarInmediatamente?: boolean = false;

  @ApiPropertyOptional({
    description: 'Fecha programada de ejecución',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;
}

export class ActualizarPasoDto {
  @ApiPropertyOptional({
    description: 'ID del paso a actualizar',
    example: 'uuid-paso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  pasoId?: string;

  @ApiPropertyOptional({
    description: 'Orden del paso a actualizar',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  ordenPaso?: number;

  @ApiPropertyOptional({
    description: 'Datos actualizados del paso',
    type: UpdatePasoFlujoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePasoFlujoDto)
  datosPaso?: UpdatePasoFlujoDto;

  @ApiPropertyOptional({
    description: 'Operación a realizar',
    example: 'ACTUALIZAR',
    enum: ['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'MOVER'],
  })
  @IsOptional()
  @IsEnum(['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'MOVER'])
  operacion?: string;

  @ApiPropertyOptional({
    description: 'Nueva posición del paso (para mover)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  nuevaPosicion?: number;
}

export class DuplicarFlujoDto {
  @ApiPropertyOptional({
    description: 'Nuevo nombre para el flujo duplicado',
    example: 'Copia de Aprobación de Gastos',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  nuevoNombre: string;

  @ApiPropertyOptional({
    description: 'Nueva descripción',
    example: 'Copia del flujo original con modificaciones',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  nuevaDescripcion?: string;

  @ApiPropertyOptional({
    description: 'Si debe copiar los triggers',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  copiarTriggers?: boolean = false;

  @ApiPropertyOptional({
    description: 'Si debe activar inmediatamente',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  activarInmediatamente?: boolean = false;

  @ApiPropertyOptional({
    description: 'Pasos a excluir de la copia',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  pasosExcluir?: number[];
}

export class ImportarFlujoDto {
  @ApiPropertyOptional({
    description: 'Definición del flujo en formato JSON',
  })
  @IsObject()
  definicionFlujo: any;

  @ApiPropertyOptional({
    description: 'Si debe sobrescribir flujos existentes con el mismo nombre',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sobrescribir?: boolean = false;

  @ApiPropertyOptional({
    description: 'Validar estructura antes de importar',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  validarEstructura?: boolean = true;

  @ApiPropertyOptional({
    description: 'Mapeo de IDs de usuarios del sistema origen al destino',
  })
  @IsOptional()
  @IsObject()
  mapeoUsuarios?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Mapeo de IDs de roles del sistema origen al destino',
  })
  @IsOptional()
  @IsObject()
  mapeoRoles?: Record<string, string>;
}
