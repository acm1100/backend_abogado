import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  Length,
  Min,
  Max,
  ValidateNested,
  IsNotEmpty,
  Matches,
  IsDecimal,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoRegistroTiempo {
  TRABAJO_DIRECTO = 'TRABAJO_DIRECTO',
  REUNION = 'REUNION',
  INVESTIGACION = 'INVESTIGACION',
  REDACCION = 'REDACCION',
  AUDIENCIA = 'AUDIENCIA',
  NEGOCIACION = 'NEGOCIACION',
  REVISION = 'REVISION',
  CONSULTA = 'CONSULTA',
  DESPLAZAMIENTO = 'DESPLAZAMIENTO',
  CAPACITACION = 'CAPACITACION',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  OTRO = 'OTRO'
}

export enum EstadoRegistroTiempo {
  BORRADOR = 'BORRADOR',
  PENDIENTE_APROBACION = 'PENDIENTE_APROBACION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  FACTURADO = 'FACTURADO',
  NO_FACTURABLE = 'NO_FACTURABLE'
}

export enum CategoriaTiempo {
  FACTURABLE = 'FACTURABLE',
  NO_FACTURABLE = 'NO_FACTURABLE',
  INTERNO = 'INTERNO',
  PROMOCIONAL = 'PROMOCIONAL',
  CAPACITACION = 'CAPACITACION',
  ADMINISTRATIVO = 'ADMINISTRATIVO'
}

export class DetalleActividadDto {
  @ApiProperty({
    description: 'Descripción de la actividad específica',
    example: 'Revisión de cláusulas contractuales sección 3.2',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  descripcion: string;

  @ApiProperty({
    description: 'Horas dedicadas a esta actividad específica',
    example: 1.5,
    minimum: 0.1,
    maximum: 24,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(24)
  horas: number;

  @ApiPropertyOptional({
    description: 'Tipo específico de la actividad',
    enum: TipoRegistroTiempo,
    example: TipoRegistroTiempo.REVISION,
  })
  @IsOptional()
  @IsEnum(TipoRegistroTiempo)
  tipoActividad?: TipoRegistroTiempo;

  @ApiPropertyOptional({
    description: 'Documentos relacionados con esta actividad',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  documentosRelacionados?: string[];
}

export class ConfiguracionFacturacionDto {
  @ApiProperty({
    description: 'Es facturable al cliente',
    example: true,
    default: true,
  })
  @IsBoolean()
  facturable: boolean = true;

  @ApiPropertyOptional({
    description: 'Tarifa por hora específica para este registro',
    example: 150.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaHora?: number;

  @ApiPropertyOptional({
    description: 'Moneda de la tarifa',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @IsOptional()
  @IsEnum(['PEN', 'USD', 'EUR'])
  moneda?: string = 'PEN';

  @ApiPropertyOptional({
    description: 'Porcentaje de descuento aplicado',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeDescuento?: number = 0;

  @ApiPropertyOptional({
    description: 'Motivo del descuento',
    example: 'Descuento por volumen de trabajo',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  motivoDescuento?: string;

  @ApiPropertyOptional({
    description: 'Código de centro de costos',
    example: 'CC001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  centroCostos?: string;

  @ApiPropertyOptional({
    description: 'Requiere aprobación especial para facturación',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean = false;
}

export class CreateRegistroTiempoDto {
  @ApiProperty({
    description: 'ID del cliente al que se imputa el tiempo',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsUUID(4)
  clienteId: string;

  @ApiPropertyOptional({
    description: 'ID del caso específico (si aplica)',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'ID del proyecto específico (si aplica)',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiProperty({
    description: 'Fecha del registro de tiempo',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fecha: string;

  @ApiProperty({
    description: 'Hora de inicio del trabajo',
    example: '09:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Hora de inicio debe tener formato HH:MM'
  })
  horaInicio: string;

  @ApiProperty({
    description: 'Hora de fin del trabajo',
    example: '12:30',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Hora de fin debe tener formato HH:MM'
  })
  horaFin: string;

  @ApiPropertyOptional({
    description: 'Total de horas trabajadas (calculado automáticamente)',
    example: 3.5,
    minimum: 0.1,
    maximum: 24,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(24)
  totalHoras?: number;

  @ApiProperty({
    description: 'Descripción general del trabajo realizado',
    example: 'Revisión de contrato de servicios profesionales y elaboración de observaciones',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de registro de tiempo',
    enum: TipoRegistroTiempo,
    example: TipoRegistroTiempo.REVISION,
  })
  @IsEnum(TipoRegistroTiempo, {
    message: 'Tipo de registro no válido',
  })
  tipo: TipoRegistroTiempo;

  @ApiProperty({
    description: 'Categoría del tiempo registrado',
    enum: CategoriaTiempo,
    example: CategoriaTiempo.FACTURABLE,
  })
  @IsEnum(CategoriaTiempo, {
    message: 'Categoría de tiempo no válida',
  })
  categoria: CategoriaTiempo;

  @ApiPropertyOptional({
    description: 'Detalles específicos de actividades realizadas',
    type: [DetalleActividadDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleActividadDto)
  detallesActividades?: DetalleActividadDto[];

  @ApiPropertyOptional({
    description: 'Configuración de facturación para este registro',
    type: ConfiguracionFacturacionDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionFacturacionDto)
  configuracionFacturacion?: ConfiguracionFacturacionDto;

  @ApiPropertyOptional({
    description: 'Estado inicial del registro',
    enum: EstadoRegistroTiempo,
    example: EstadoRegistroTiempo.BORRADOR,
    default: EstadoRegistroTiempo.BORRADOR,
  })
  @IsOptional()
  @IsEnum(EstadoRegistroTiempo)
  estado?: EstadoRegistroTiempo = EstadoRegistroTiempo.BORRADOR;

  @ApiPropertyOptional({
    description: 'Ubicación donde se realizó el trabajo',
    example: 'Oficina principal - Sala de reuniones 3',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Participantes en la actividad (para reuniones)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantes?: string[];

  @ApiPropertyOptional({
    description: 'Recursos utilizados',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recursos?: string[];

  @ApiPropertyOptional({
    description: 'Resultados obtenidos',
    example: 'Se identificaron 5 cláusulas que requieren modificación',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  resultados?: string;

  @ApiPropertyOptional({
    description: 'Próximos pasos o acciones requeridas',
    example: 'Coordinar reunión con cliente para revisar observaciones',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  proximosPasos?: string;

  @ApiPropertyOptional({
    description: 'Documentos generados durante la actividad',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  documentosGenerados?: string[];

  @ApiPropertyOptional({
    description: 'Referencias a normativas o jurisprudencia consultada',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referenciasLegales?: string[];

  @ApiPropertyOptional({
    description: 'Nivel de complejidad de la tarea (1-10)',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  nivelComplejidad?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de avance en la tarea/caso',
    example: 25.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeAvance?: number;

  @ApiPropertyOptional({
    description: 'Requiere seguimiento posterior',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereSeguimiento?: boolean = false;

  @ApiPropertyOptional({
    description: 'Fecha de seguimiento programado',
    example: '2024-01-20',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaSeguimiento?: string;

  @ApiPropertyOptional({
    description: 'Observaciones internas (no visibles al cliente)',
    example: 'Cliente muestra resistencia a las modificaciones propuestas',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacionesInternas?: string;

  @ApiPropertyOptional({
    description: 'Tags o etiquetas para categorización adicional',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Gastos incurridos durante la actividad',
    example: 45.50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gastosAsociados?: number;

  @ApiPropertyOptional({
    description: 'Descripción de los gastos incurridos',
    example: 'Transporte a sede del cliente',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  descripcionGastos?: string;

  @ApiPropertyOptional({
    description: 'Es tiempo extra o fuera del horario normal',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esTiempoExtra?: boolean = false;

  @ApiPropertyOptional({
    description: 'Multiplicador de tarifa para tiempo extra',
    example: 1.5,
    minimum: 1,
    maximum: 3,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(3)
  multiplicadorTiempoExtra?: number;

  @ApiPropertyOptional({
    description: 'Requiere validación de supervisor',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereValidacion?: boolean = false;

  @ApiPropertyOptional({
    description: 'ID del supervisor que debe validar',
    example: 'uuid-supervisor-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  supervisorId?: string;

  @ApiPropertyOptional({
    description: 'Configuración de notificaciones',
    type: 'object',
  })
  @IsOptional()
  configuracionNotificaciones?: {
    notificarCliente?: boolean;
    notificarSupervisor?: boolean;
    notificarEquipo?: boolean;
    incluirDetalles?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Configuración de reportes',
    type: 'object',
  })
  @IsOptional()
  configuracionReportes?: {
    incluirEnReporteDiario?: boolean;
    incluirEnReporteSemanal?: boolean;
    incluirEnReporteMensual?: boolean;
    visibleEnDashboard?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Información de contexto del dispositivo/ubicación',
    type: 'object',
  })
  @IsOptional()
  contextoDispositivo?: {
    tipoDispositivo?: string;
    ubicacionGPS?: {
      latitud?: number;
      longitud?: number;
    };
    direccionIP?: string;
    navegador?: string;
  };
}

export class IniciarTemporizadorDto {
  @ApiProperty({
    description: 'ID del cliente al que se imputa el tiempo',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsUUID(4)
  clienteId: string;

  @ApiPropertyOptional({
    description: 'ID del caso específico (si aplica)',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'ID del proyecto específico (si aplica)',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiProperty({
    description: 'Descripción de la actividad a realizar',
    example: 'Revisión de contrato de servicios',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  descripcionActividad: string;

  @ApiProperty({
    description: 'Tipo de actividad',
    enum: TipoRegistroTiempo,
    example: TipoRegistroTiempo.REVISION,
  })
  @IsEnum(TipoRegistroTiempo)
  tipo: TipoRegistroTiempo;

  @ApiPropertyOptional({
    description: 'Categoría del tiempo',
    enum: CategoriaTiempo,
    example: CategoriaTiempo.FACTURABLE,
    default: CategoriaTiempo.FACTURABLE,
  })
  @IsOptional()
  @IsEnum(CategoriaTiempo)
  categoria?: CategoriaTiempo = CategoriaTiempo.FACTURABLE;
}

export class DetenerTemporizadorDto {
  @ApiProperty({
    description: 'Descripción final del trabajo realizado',
    example: 'Se completó la revisión del contrato identificando 3 cláusulas para modificar',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  descripcionFinal: string;

  @ApiPropertyOptional({
    description: 'Resultados obtenidos',
    example: 'Se identificaron inconsistencias en cláusulas 5.2 y 7.1',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  resultados?: string;

  @ApiPropertyOptional({
    description: 'Próximos pasos requeridos',
    example: 'Coordinar reunión con cliente para revisar modificaciones',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  proximosPasos?: string;

  @ApiPropertyOptional({
    description: 'Configuración de facturación',
    type: ConfiguracionFacturacionDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionFacturacionDto)
  configuracionFacturacion?: ConfiguracionFacturacionDto;

  @ApiPropertyOptional({
    description: 'Estado final del registro',
    enum: EstadoRegistroTiempo,
    example: EstadoRegistroTiempo.PENDIENTE_APROBACION,
    default: EstadoRegistroTiempo.BORRADOR,
  })
  @IsOptional()
  @IsEnum(EstadoRegistroTiempo)
  estado?: EstadoRegistroTiempo = EstadoRegistroTiempo.BORRADOR;
}
