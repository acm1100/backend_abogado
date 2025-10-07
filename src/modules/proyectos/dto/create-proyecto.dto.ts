import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  IsObject,
  IsNumber,
  IsDateString,
  Length,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  IsInt,
  IsDecimal,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Tipos de proyecto
export enum TipoProyecto {
  CONSULTORIA = 'consultoria',
  CONSULTORIA_LEGAL = 'consultoria_legal',
  LITIGIO = 'litigio',
  PROCESO_JUDICIAL = 'proceso_judicial',
  TRANSACCIONAL = 'transaccional',
  TRANSACCION_COMERCIAL = 'transaccion_comercial',
  COMPLIANCE = 'compliance',
  CORPORATIVO = 'corporativo',
  FUSION_ADQUISICION = 'fusion_adquisicion',
  INMOBILIARIO = 'inmobiliario',
  LABORAL = 'laboral',
  TRIBUTARIO = 'tributario',
  PENAL = 'penal',
  ADMINISTRATIVO = 'administrativo',
  REGULATORIO = 'regulatorio',
  PROPIEDAD_INTELECTUAL = 'propiedad_intelectual',
  INTERNACIONAL = 'internacional',
  INVESTIGACION_LEGAL = 'investigacion_legal',
  OTROS = 'otros'
}

// Estados del proyecto
export enum EstadoProyecto {
  PLANIFICACION = 'planificacion',
  EN_PROGRESO = 'en_progreso',
  EN_REVISION = 'en_revision',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  CERRADO = 'cerrado',
  FACTURADO = 'facturado'
}

// Prioridades
export enum PrioridadProyecto {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
  URGENTE = 'urgente'
}

export class PresupuestoProyectoDto {
  @ApiProperty({
    description: 'Presupuesto inicial estimado',
    example: 50000.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  presupuestoInicial: number;

  @ApiProperty({
    description: 'Moneda del presupuesto',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @IsEnum(['PEN', 'USD', 'EUR'])
  moneda: string;

  @ApiPropertyOptional({
    description: 'Presupuesto aprobado por el cliente',
    example: 45000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  presupuestoAprobado?: number;

  @ApiPropertyOptional({
    description: 'Gastos ejecutados hasta la fecha',
    example: 15000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gastosEjecutados?: number;

  @ApiPropertyOptional({
    description: 'Ingresos generados hasta la fecha',
    example: 25000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ingresosGenerados?: number;

  @ApiPropertyOptional({
    description: 'Contingencias (% del presupuesto)',
    example: 10.0,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  porcentajeContingencia?: number = 10;

  @ApiPropertyOptional({
    description: 'Desglose detallado del presupuesto',
  })
  @IsOptional()
  @IsObject()
  desglose?: {
    honorarios?: {
      sociosDirectores?: number;
      asociados?: number;
      juniors?: number;
      paralegales?: number;
    };
    gastos?: {
      externos?: number;
      internos?: number;
      viaticos?: number;
      documentacion?: number;
    };
    terceros?: {
      peritos?: number;
      consultores?: number;
      procuradores?: number;
      notarias?: number;
    };
  };
}

export class HitoProyectoDto {
  @ApiProperty({
    description: 'Nombre del hito',
    example: 'Presentación de demanda',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del hito',
    example: 'Presentación formal de la demanda ante el juzgado competente',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion?: string;

  @ApiProperty({
    description: 'Fecha programada del hito',
    example: '2024-02-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaProgramada: string;

  @ApiPropertyOptional({
    description: 'Fecha real de cumplimiento',
    example: '2024-02-12',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaReal?: string;

  @ApiProperty({
    description: 'Si el hito es crítico para el proyecto',
    example: true,
    default: false,
  })
  @IsBoolean()
  esCritico: boolean = false;

  @ApiPropertyOptional({
    description: 'Porcentaje de avance que representa este hito',
    example: 25.0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeAvance?: number;

  @ApiPropertyOptional({
    description: 'ID del usuario responsable del hito',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  responsableId?: string;

  @ApiPropertyOptional({
    description: 'Estado del hito',
    example: 'PENDIENTE',
    enum: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'ATRASADO', 'CANCELADO'],
    default: 'PENDIENTE',
  })
  @IsOptional()
  @IsEnum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'ATRASADO', 'CANCELADO'])
  estado?: string = 'PENDIENTE';

  @ApiPropertyOptional({
    description: 'Dependencias (IDs de otros hitos que deben completarse antes)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencias?: string[];

  @ApiPropertyOptional({
    description: 'Entregables asociados al hito',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entregables?: string[];
}

export class RecursoProyectoDto {
  @ApiProperty({
    description: 'ID del usuario asignado como recurso',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsUUID(4)
  usuarioId: string;

  @ApiProperty({
    description: 'Rol del recurso en el proyecto',
    example: 'SOCIO_DIRECTOR',
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
    description: 'Porcentaje de dedicación al proyecto',
    example: 50.0,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100)
  porcentajeDedicacion?: number = 100;

  @ApiPropertyOptional({
    description: 'Tarifa por hora del recurso para este proyecto',
    example: 150.00,
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
    description: 'Responsabilidades específicas en el proyecto',
    example: ['Redacción de escritos', 'Coordinación con cliente', 'Supervisión de juniors'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsabilidades?: string[];

  @ApiPropertyOptional({
    description: 'Si es el líder del proyecto',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esLider?: boolean = false;

  @ApiPropertyOptional({
    description: 'Horas estimadas de trabajo',
    example: 120.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  horasEstimadas?: number;
}

export class CreateProyectoDto {
  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Demanda Laboral - Despido Arbitrario ABC S.A.C.',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @Length(5, 200, {
    message: 'El nombre debe tener entre 5 y 200 caracteres',
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del proyecto',
    example: 'Proceso judicial por despido arbitrario de trabajador con 15 años de antigüedad',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  descripcion?: string;

  @ApiProperty({
    description: 'Tipo de proyecto',
    enum: TipoProyecto,
    example: TipoProyecto.LITIGIO,
  })
  @IsEnum(TipoProyecto, {
    message: 'Tipo de proyecto no válido',
  })
  tipo: TipoProyecto;

  @ApiProperty({
    description: 'ID del cliente asociado',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsUUID(4, {
    message: 'ID del cliente debe ser un UUID válido',
  })
  clienteId: string;

  @ApiPropertyOptional({
    description: 'ID del caso asociado (si aplica)',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiProperty({
    description: 'Fecha de inicio del proyecto',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString({}, {
    message: 'Fecha de inicio no válida',
  })
  fechaInicio: string;

  @ApiPropertyOptional({
    description: 'Fecha estimada de finalización',
    example: '2024-06-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaFinEstimada?: string;

  @ApiPropertyOptional({
    description: 'Fecha real de finalización',
    example: '2024-06-10',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaFinReal?: string;

  @ApiProperty({
    description: 'Prioridad del proyecto',
    enum: PrioridadProyecto,
    example: PrioridadProyecto.ALTA,
  })
  @IsEnum(PrioridadProyecto, {
    message: 'Prioridad no válida',
  })
  prioridad: PrioridadProyecto;

  @ApiProperty({
    description: 'Información presupuestaria del proyecto',
    type: PresupuestoProyectoDto,
  })
  @ValidateNested()
  @Type(() => PresupuestoProyectoDto)
  presupuesto: PresupuestoProyectoDto;

  @ApiPropertyOptional({
    description: 'Lista de hitos del proyecto',
    type: [HitoProyectoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HitoProyectoDto)
  hitos?: HitoProyectoDto[];

  @ApiProperty({
    description: 'Recursos asignados al proyecto',
    type: [RecursoProyectoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecursoProyectoDto)
  @ArrayMinSize(1, {
    message: 'El proyecto debe tener al menos un recurso asignado',
  })
  recursos: RecursoProyectoDto[];

  @ApiPropertyOptional({
    description: 'Estado inicial del proyecto',
    enum: EstadoProyecto,
    example: EstadoProyecto.PLANIFICACION,
    default: EstadoProyecto.PLANIFICACION,
  })
  @IsOptional()
  @IsEnum(EstadoProyecto)
  estado?: EstadoProyecto = EstadoProyecto.PLANIFICACION;

  @ApiPropertyOptional({
    description: 'Objetivos específicos del proyecto',
    example: [
      'Obtener sentencia favorable',
      'Lograr indemnización completa',
      'Establecer precedente jurisprudencial'
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objetivos?: string[];

  @ApiPropertyOptional({
    description: 'Riesgos identificados del proyecto',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riesgos?: string[];

  @ApiPropertyOptional({
    description: 'Área de práctica legal',
    example: 'DERECHO_LABORAL',
    enum: [
      'DERECHO_CIVIL',
      'DERECHO_PENAL',
      'DERECHO_LABORAL',
      'DERECHO_TRIBUTARIO',
      'DERECHO_SOCIETARIO',
      'DERECHO_ADMINISTRATIVO',
      'DERECHO_CONSTITUCIONAL',
      'DERECHO_INTERNACIONAL',
      'DERECHO_AMBIENTAL',
      'PROPIEDAD_INTELECTUAL',
      'DERECHO_INMOBILIARIO',
      'DERECHO_FINANCIERO',
      'COMPLIANCE',
      'OTROS'
    ],
  })
  @IsOptional()
  @IsEnum([
    'DERECHO_CIVIL',
    'DERECHO_PENAL',
    'DERECHO_LABORAL',
    'DERECHO_TRIBUTARIO',
    'DERECHO_SOCIETARIO',
    'DERECHO_ADMINISTRATIVO',
    'DERECHO_CONSTITUCIONAL',
    'DERECHO_INTERNACIONAL',
    'DERECHO_AMBIENTAL',
    'PROPIEDAD_INTELECTUAL',
    'DERECHO_INMOBILIARIO',
    'DERECHO_FINANCIERO',
    'COMPLIANCE',
    'OTROS'
  ])
  areaPractica?: string;

  @ApiPropertyOptional({
    description: 'Etiquetas del proyecto',
    example: ['urgente', 'alto-valor', 'cliente-vip'],
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
    description: 'Configuración específica del proyecto',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    // Facturación
    facturacion?: {
      modalidad?: 'HORAS' | 'FIJO' | 'EXITOSO' | 'MIXTO';
      frecuenciaFacturacion?: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'BIMESTRAL';
      anticipoRequerido?: boolean;
      porcentajeAnticipo?: number;
    };
    
    // Comunicación
    comunicacion?: {
      frecuenciaReportes?: 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
      canalPreferido?: 'EMAIL' | 'TELEFONO' | 'REUNION' | 'VIDEOLLAMADA';
      contactoPrincipal?: string; // ID del contacto en el cliente
    };
    
    // Gestión documental
    documentos?: {
      organizacionCarpetas?: string;
      versionadoAutomatico?: boolean;
      firmaDigitalRequerida?: boolean;
      compartirConCliente?: boolean;
    };
    
    // Control de calidad
    calidad?: {
      revisionObligatoria?: boolean;
      nivelRevision?: 'ASOCIADO' | 'SOCIO' | 'SOCIO_DIRECTOR';
      checklistCalidad?: string[];
    };
    
    // Métricas y KPIs
    metricas?: {
      seguimientoTiempo?: boolean;
      controlPresupuesto?: boolean;
      alertasDesviacion?: boolean;
      umbralAlertaPresupuesto?: number; // porcentaje
    };
  };

  @ApiPropertyOptional({
    description: 'Si el proyecto está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'IDs de documentos asociados al proyecto',
    example: ['uuid-documento-1', 'uuid-documento-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  documentosAsociados?: string[];

  @ApiPropertyOptional({
    description: 'Metadatos adicionales del proyecto',
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    tribunalCompetente?: string;
    numeroExpediente?: string;
    magistradoPonente?: string;
    especialidadJudicial?: string;
    instancia?: 'PRIMERA' | 'SEGUNDA' | 'CASACION' | 'CONSTITUCIONAL';
    tipoMoneda?: 'NACIONAL' | 'EXTRANJERA';
    montoEnControvesia?: number;
    fechaNotificacion?: string;
    plazosVencimiento?: Array<{
      descripcion: string;
      fecha: string;
      critico: boolean;
    }>;
  };
}
