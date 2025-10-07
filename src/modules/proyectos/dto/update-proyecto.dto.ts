import { PartialType, OmitType } from '@nestjs/swagger';
import { 
  CreateProyectoDto, 
  PresupuestoProyectoDto, 
  HitoProyectoDto, 
  RecursoProyectoDto,
  EstadoProyecto,
  PrioridadProyecto,
  TipoProyecto
} from './create-proyecto.dto';
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
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePresupuestoProyectoDto extends PartialType(PresupuestoProyectoDto) {}

export class UpdateHitoProyectoDto extends PartialType(HitoProyectoDto) {
  @ApiPropertyOptional({
    description: 'ID del hito (para actualizar hito existente)',
    example: 'uuid-hito-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  id?: string;
}

export class UpdateRecursoProyectoDto extends PartialType(RecursoProyectoDto) {
  @ApiPropertyOptional({
    description: 'ID del recurso (para actualizar recurso existente)',
    example: 'uuid-recurso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  id?: string;
}

export class UpdateProyectoDto extends PartialType(
  OmitType(CreateProyectoDto, ['presupuesto', 'hitos', 'recursos'] as const)
) {
  @ApiPropertyOptional({
    description: 'Información presupuestaria actualizada',
    type: UpdatePresupuestoProyectoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePresupuestoProyectoDto)
  presupuesto?: UpdatePresupuestoProyectoDto;

  @ApiPropertyOptional({
    description: 'Hitos actualizados del proyecto',
    type: [UpdateHitoProyectoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateHitoProyectoDto)
  hitos?: UpdateHitoProyectoDto[];

  @ApiPropertyOptional({
    description: 'Recursos actualizados del proyecto',
    type: [UpdateRecursoProyectoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRecursoProyectoDto)
  recursos?: UpdateRecursoProyectoDto[];

  @ApiPropertyOptional({
    description: 'Estado del proyecto',
    enum: EstadoProyecto,
    example: EstadoProyecto.EN_PROGRESO,
  })
  @IsOptional()
  @IsEnum(EstadoProyecto)
  estado?: EstadoProyecto;

  @ApiPropertyOptional({
    description: 'Motivo de la actualización',
    example: 'Actualización de cronograma por retrasos en documentación',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoActualizacion?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje de avance del proyecto',
    example: 45.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeAvance?: number;
}

export class CambiarEstadoProyectoDto {
  @ApiPropertyOptional({
    description: 'Nuevo estado del proyecto',
    enum: EstadoProyecto,
    example: EstadoProyecto.EN_PROGRESO,
  })
  @IsEnum(EstadoProyecto, {
    message: 'Estado de proyecto no válido',
  })
  estado: EstadoProyecto;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Inicio formal del proyecto tras aprobación del cliente',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Se requiere reunión semanal de seguimiento',
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

  @ApiPropertyOptional({
    description: 'Actualizar fechas automáticamente según el nuevo estado',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  actualizarFechas?: boolean = true;
}

export class AsignarRecursoDto {
  @ApiPropertyOptional({
    description: 'ID del usuario a asignar',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsUUID(4)
  usuarioId: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario en el proyecto',
    example: 'ASOCIADO',
    enum: [
      'SOCIO_DIRECTOR',
      'SOCIO',
      'ASOCIADO_SENIOR',
      'ASOCIADO',
      'JUNIOR',
      'PARALEGAL',
      'ASISTENTE',
      'CONSULTOR_EXTERNO',
      'ESPECIALISTA'
    ],
  })
  @IsEnum([
    'SOCIO_DIRECTOR',
    'SOCIO',
    'ASOCIADO_SENIOR',
    'ASOCIADO',
    'JUNIOR',
    'PARALEGAL',
    'ASISTENTE',
    'CONSULTOR_EXTERNO',
    'ESPECIALISTA'
  ])
  rol: string;

  @ApiPropertyOptional({
    description: 'Porcentaje de dedicación',
    example: 25.0,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100)
  porcentajeDedicacion?: number = 100;

  @ApiPropertyOptional({
    description: 'Tarifa por hora específica',
    example: 120.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaHora?: number;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de la asignación',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin de la asignación',
    example: '2024-06-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Responsabilidades específicas',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsabilidades?: string[];

  @ApiPropertyOptional({
    description: 'Motivo de la asignación',
    example: 'Experiencia especializada en derecho laboral',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivo?: string;
}

export class ActualizarHitoDto {
  @ApiPropertyOptional({
    description: 'ID del hito a actualizar',
    example: 'uuid-hito-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  hitoId?: string;

  @ApiPropertyOptional({
    description: 'Datos actualizados del hito',
    type: UpdateHitoProyectoDto,
  })
  @ValidateNested()
  @Type(() => UpdateHitoProyectoDto)
  datosHito: UpdateHitoProyectoDto;

  @ApiPropertyOptional({
    description: 'Operación a realizar',
    example: 'ACTUALIZAR',
    enum: ['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'COMPLETAR'],
  })
  @IsOptional()
  @IsEnum(['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'COMPLETAR'])
  operacion?: string = 'ACTUALIZAR';

  @ApiPropertyOptional({
    description: 'Comentarios sobre la actualización',
    example: 'Hito completado antes de lo previsto',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  comentarios?: string;
}

export class ActualizarPresupuestoDto {
  @ApiPropertyOptional({
    description: 'Nuevo presupuesto inicial',
    example: 55000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  presupuestoInicial?: number;

  @ApiPropertyOptional({
    description: 'Nuevo presupuesto aprobado',
    example: 50000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  presupuestoAprobado?: number;

  @ApiPropertyOptional({
    description: 'Motivo del cambio presupuestario',
    example: 'Incremento por complejidad adicional del caso',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Requiere aprobación del cliente',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean = true;

  @ApiPropertyOptional({
    description: 'Desglose detallado de los cambios',
  })
  @IsOptional()
  @IsObject()
  desgloseCambios?: {
    incrementoHonorarios?: number;
    incrementoGastos?: number;
    incrementoTerceros?: number;
    justificacionIncremento?: string;
  };
}

export class ReportarAvanceDto {
  @ApiPropertyOptional({
    description: 'Porcentaje de avance reportado',
    example: 65.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeAvance: number;

  @ApiPropertyOptional({
    description: 'Actividades completadas',
    example: [
      'Revisión de expediente completa',
      'Preparación de demanda',
      'Reunión con cliente'
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actividadesCompletadas?: string[];

  @ApiPropertyOptional({
    description: 'Próximas actividades planificadas',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  proximasActividades?: string[];

  @ApiPropertyOptional({
    description: 'Obstáculos o impedimentos identificados',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  obstaculos?: string[];

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Proyecto avanza según cronograma establecido',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Fecha del reporte',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaReporte?: string;

  @ApiPropertyOptional({
    description: 'Horas trabajadas desde el último reporte',
    example: 15.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  horasTrabajadas?: number;

  @ApiPropertyOptional({
    description: 'Gastos incurridos desde el último reporte',
    example: 850.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gastosIncurridos?: number;
}

export class CerrarProyectoDto {
  @ApiPropertyOptional({
    description: 'Fecha real de cierre',
    example: '2024-06-10',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaCierre: string;

  @ApiPropertyOptional({
    description: 'Resultado del proyecto',
    example: 'EXITOSO',
    enum: ['EXITOSO', 'PARCIALMENTE_EXITOSO', 'FALLIDO', 'CANCELADO_CLIENTE', 'CANCELADO_INTERNO'],
  })
  @IsEnum(['EXITOSO', 'PARCIALMENTE_EXITOSO', 'FALLIDO', 'CANCELADO_CLIENTE', 'CANCELADO_INTERNO'])
  resultado: string;

  @ApiPropertyOptional({
    description: 'Resumen ejecutivo del proyecto',
    example: 'Proyecto completado exitosamente obteniendo sentencia favorable',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  resumenEjecutivo?: string;

  @ApiPropertyOptional({
    description: 'Objetivos cumplidos',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objetivosCumplidos?: string[];

  @ApiPropertyOptional({
    description: 'Lecciones aprendidas',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leccionesAprendidas?: string[];

  @ApiPropertyOptional({
    description: 'Costos finales del proyecto',
    example: 48500.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costosFinales?: number;

  @ApiPropertyOptional({
    description: 'Ingresos finales del proyecto',
    example: 52000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ingresosFinales?: number;

  @ApiPropertyOptional({
    description: 'Evaluación de satisfacción del cliente (1-10)',
    example: 9,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  satisfaccionCliente?: number;

  @ApiPropertyOptional({
    description: 'Documentos finales a entregar',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  documentosFinales?: string[];

  @ApiPropertyOptional({
    description: 'Requiere seguimiento post-cierre',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereSeguimiento?: boolean = false;
}
