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
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Tipos de workflow
export enum TipoFlujoTrabajo {
  PROCESO_LEGAL = 'PROCESO_LEGAL',
  APROBACION_DOCUMENTO = 'APROBACION_DOCUMENTO',
  REVISION_CASO = 'REVISION_CASO',
  AUTORIZACION_GASTO = 'AUTORIZACION_GASTO',
  VALIDACION_FACTURA = 'VALIDACION_FACTURA',
  ONBOARDING_CLIENTE = 'ONBOARDING_CLIENTE',
  SEGUIMIENTO_PROYECTO = 'SEGUIMIENTO_PROYECTO',
  PROCESO_DISCIPLINARIO = 'PROCESO_DISCIPLINARIO',
  AUDITORIA_INTERNA = 'AUDITORIA_INTERNA',
  PERSONALIZADO = 'PERSONALIZADO',
}

// Estados del workflow
export enum EstadoFlujoTrabajo {
  BORRADOR = 'BORRADOR',
  ACTIVO = 'ACTIVO',
  PAUSADO = 'PAUSADO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
  ARCHIVADO = 'ARCHIVADO',
}

// Tipos de acciones en pasos
export enum TipoAccionPaso {
  APROBACION = 'APROBACION',
  REVISION = 'REVISION',
  NOTIFICACION = 'NOTIFICACION',
  ASIGNACION = 'ASIGNACION',
  DOCUMENTO = 'DOCUMENTO',
  FORMULARIO = 'FORMULARIO',
  INTEGRACION = 'INTEGRACION',
  ESPERA = 'ESPERA',
  CONDICION = 'CONDICION',
  PARALELO = 'PARALELO',
}

// Tipos de condiciones
export enum TipoCondicion {
  MONTO_MAYOR = 'MONTO_MAYOR',
  MONTO_MENOR = 'MONTO_MENOR',
  FECHA_VENCIMIENTO = 'FECHA_VENCIMIENTO',
  ESTADO_CASO = 'ESTADO_CASO',
  ROL_USUARIO = 'ROL_USUARIO',
  DOCUMENTO_PRESENTE = 'DOCUMENTO_PRESENTE',
  CAMPO_VALOR = 'CAMPO_VALOR',
  PERSONALIZADA = 'PERSONALIZADA',
}

export class CondicionPasoDto {
  @ApiProperty({
    description: 'Tipo de condición',
    enum: TipoCondicion,
    example: TipoCondicion.MONTO_MAYOR,
  })
  @IsEnum(TipoCondicion)
  tipo: TipoCondicion;

  @ApiProperty({
    description: 'Campo a evaluar',
    example: 'monto',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  campo: string;

  @ApiProperty({
    description: 'Operador de comparación',
    example: '>',
    enum: ['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains', 'in', 'not_in'],
  })
  @IsEnum(['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains', 'in', 'not_in'])
  operador: string;

  @ApiProperty({
    description: 'Valor a comparar',
    example: 1000,
  })
  valor: any;

  @ApiPropertyOptional({
    description: 'Descripción de la condición',
    example: 'Si el monto es mayor a 1000 soles',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  descripcion?: string;
}

export class AccionPasoDto {
  @ApiProperty({
    description: 'Tipo de acción',
    enum: TipoAccionPaso,
    example: TipoAccionPaso.APROBACION,
  })
  @IsEnum(TipoAccionPaso)
  tipo: TipoAccionPaso;

  @ApiPropertyOptional({
    description: 'Configuración específica de la acción',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    // Para aprobaciones
    aprobadores?: string[]; // IDs de usuarios
    requiereTodos?: boolean;
    timeoutHoras?: number; // Tiempo límite para aprobar
    
    // Para notificaciones
    destinatarios?: string[]; // IDs de usuarios o emails
    plantillaEmail?: string; // ID de plantilla
    canal?: 'EMAIL' | 'SMS' | 'PUSH' | 'TODOS';
    
    // Para documentos
    tipoDocumento?: string;
    plantillaDocumento?: string;
    generarAutomaticamente?: boolean;
    
    // Para formularios
    camposRequeridos?: string[];
    validaciones?: any[];
    
    // Para integraciones
    sistemaExterno?: string;
    endpoint?: string;
    metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    
    // Para esperas
    duracionHoras?: number;
    condicionSalida?: CondicionPasoDto;
  };

  @ApiPropertyOptional({
    description: 'Mensaje o instrucciones para la acción',
    example: 'Aprobar el gasto presentado',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  mensaje?: string;
}

export class PasoFlujoDto {
  @ApiProperty({
    description: 'Nombre del paso',
    example: 'Revisión inicial',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del paso',
    example: 'Revisión inicial del documento por el supervisor',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion?: string;

  @ApiProperty({
    description: 'Orden del paso en el flujo',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsInt()
  @Min(1)
  orden: number;

  @ApiProperty({
    description: 'Lista de acciones a ejecutar en este paso',
    type: [AccionPasoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccionPasoDto)
  @ArrayMinSize(1)
  acciones: AccionPasoDto[];

  @ApiPropertyOptional({
    description: 'Condiciones para ejecutar este paso',
    type: [CondicionPasoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CondicionPasoDto)
  condiciones?: CondicionPasoDto[];

  @ApiPropertyOptional({
    description: 'Si el paso es obligatorio',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  obligatorio?: boolean = true;

  @ApiPropertyOptional({
    description: 'Tiempo límite en horas para completar el paso',
    example: 24,
    minimum: 1,
    maximum: 8760, // 1 año
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8760)
  timeoutHoras?: number;

  @ApiPropertyOptional({
    description: 'IDs de usuarios asignados por defecto a este paso',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  usuariosAsignados?: string[];

  @ApiPropertyOptional({
    description: 'IDs de roles que pueden ejecutar este paso',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  rolesPermitidos?: string[];

  @ApiPropertyOptional({
    description: 'Si se puede ejecutar en paralelo con otros pasos',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ejecutarEnParalelo?: boolean = false;

  @ApiPropertyOptional({
    description: 'Paso siguiente en caso de éxito',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  pasoSiguienteExito?: number;

  @ApiPropertyOptional({
    description: 'Paso siguiente en caso de rechazo/fallo',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  pasoSiguienteFallo?: number;

  @ApiPropertyOptional({
    description: 'Configuración adicional del paso',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    notificarInicio?: boolean;
    notificarCompletion?: boolean;
    permitirEdicion?: boolean;
    requiereComentario?: boolean;
    documentosRequeridos?: string[];
    camposFormulario?: any[];
    validacionesCustom?: any[];
  };
}

export class TriggerFlujoDto {
  @ApiProperty({
    description: 'Evento que dispara el flujo',
    example: 'CREAR_GASTO',
    enum: [
      'CREAR_CASO', 'ACTUALIZAR_CASO', 'CERRAR_CASO',
      'CREAR_GASTO', 'APROBAR_GASTO', 'RECHAZAR_GASTO',
      'CREAR_FACTURA', 'PAGAR_FACTURA', 'VENCER_FACTURA',
      'SUBIR_DOCUMENTO', 'APROBAR_DOCUMENTO',
      'CREAR_PROYECTO', 'FINALIZAR_PROYECTO',
      'REGISTRO_TIEMPO', 'APROBAR_TIEMPO',
      'CREAR_CLIENTE', 'ACTUALIZAR_CLIENTE',
      'MANUAL', 'PROGRAMADO', 'WEBHOOK'
    ],
  })
  @IsEnum([
    'CREAR_CASO', 'ACTUALIZAR_CASO', 'CERRAR_CASO',
    'CREAR_GASTO', 'APROBAR_GASTO', 'RECHAZAR_GASTO',
    'CREAR_FACTURA', 'PAGAR_FACTURA', 'VENCER_FACTURA',
    'SUBIR_DOCUMENTO', 'APROBAR_DOCUMENTO',
    'CREAR_PROYECTO', 'FINALIZAR_PROYECTO',
    'REGISTRO_TIEMPO', 'APROBAR_TIEMPO',
    'CREAR_CLIENTE', 'ACTUALIZAR_CLIENTE',
    'MANUAL', 'PROGRAMADO', 'WEBHOOK'
  ])
  evento: string;

  @ApiPropertyOptional({
    description: 'Condiciones para disparar el flujo',
    type: [CondicionPasoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CondicionPasoDto)
  condiciones?: CondicionPasoDto[];

  @ApiPropertyOptional({
    description: 'Configuración específica del trigger',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    // Para triggers programados
    cron?: string; // Expresión cron
    fechaInicio?: string;
    fechaFin?: string;
    
    // Para webhooks
    endpoint?: string;
    secreto?: string;
    headers?: Record<string, string>;
    
    // Para triggers manuales
    usuariosAutorizados?: string[];
    rolesAutorizados?: string[];
  };
}

export class CreateFlujoTrabajoDto {
  @ApiProperty({
    description: 'Nombre del flujo de trabajo',
    example: 'Aprobación de Gastos Mayores',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100, {
    message: 'El nombre debe tener entre 3 y 100 caracteres',
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del flujo',
    example: 'Proceso automatizado para aprobar gastos superiores a 1000 soles',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descripcion?: string;

  @ApiProperty({
    description: 'Tipo de flujo de trabajo',
    enum: TipoFlujoTrabajo,
    example: TipoFlujoTrabajo.AUTORIZACION_GASTO,
  })
  @IsEnum(TipoFlujoTrabajo, {
    message: 'Tipo de flujo no válido',
  })
  tipo: TipoFlujoTrabajo;

  @ApiProperty({
    description: 'Lista de pasos del flujo',
    type: [PasoFlujoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PasoFlujoDto)
  @ArrayMinSize(1, {
    message: 'El flujo debe tener al menos un paso',
  })
  pasos: PasoFlujoDto[];

  @ApiPropertyOptional({
    description: 'Triggers que activan el flujo',
    type: [TriggerFlujoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TriggerFlujoDto)
  triggers?: TriggerFlujoDto[];

  @ApiPropertyOptional({
    description: 'Prioridad del flujo',
    example: 5,
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(10)
  prioridad?: number = 5;

  @ApiPropertyOptional({
    description: 'Si el flujo está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de vigencia',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin de vigencia',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Categorías o etiquetas del flujo',
    example: ['finanzas', 'aprobacion', 'gastos'],
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
    description: 'Configuración global del flujo',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    // Notificaciones
    notificaciones?: {
      enviarInicio?: boolean;
      enviarCompletion?: boolean;
      enviarError?: boolean;
      destinatarios?: string[];
    };
    
    // Reintentos
    reintentos?: {
      maximo?: number;
      intervaloMinutos?: number;
      backoffExponencial?: boolean;
    };
    
    // Timeout global
    timeoutHoras?: number;
    
    // Escalamiento
    escalamiento?: {
      habilitado?: boolean;
      nivelEscalamiento?: number;
      tiempoEspera?: number;
      usuariosEscalamiento?: string[];
    };
    
    // Auditoría
    auditoria?: {
      registrarTodosLosPasos?: boolean;
      mantenerHistorial?: boolean;
      notificarCambios?: boolean;
    };
    
    // Integración
    integraciones?: {
      sistemaExterno?: string;
      webhookCompletion?: string;
      sincronizarDatos?: boolean;
    };
  };

  @ApiPropertyOptional({
    description: 'Versión del flujo',
    example: '1.0.0',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  version?: string = '1.0.0';

  @ApiPropertyOptional({
    description: 'IDs de usuarios con permisos de administración del flujo',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  administradores?: string[];

  @ApiPropertyOptional({
    description: 'Si el flujo permite ejecución manual',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ejecucionManual?: boolean = false;

  @ApiPropertyOptional({
    description: 'Plantilla de datos inicial para el flujo',
  })
  @IsOptional()
  @IsObject()
  plantillaDatos?: Record<string, any>;
}
