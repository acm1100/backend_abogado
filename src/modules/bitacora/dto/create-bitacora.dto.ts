import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums para el módulo de bitácora
export enum TipoEvento {
  // Eventos de autenticación
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FALLIDO = 'LOGIN_FALLIDO',
  CAMBIO_PASSWORD = 'CAMBIO_PASSWORD',
  RECUPERACION_PASSWORD = 'RECUPERACION_PASSWORD',
  
  // Eventos CRUD generales
  CREAR = 'CREAR',
  LEER = 'LEER',
  ACTUALIZAR = 'ACTUALIZAR',
  ELIMINAR = 'ELIMINAR',
  
  // Eventos específicos de módulos
  CLIENTE_CREADO = 'CLIENTE_CREADO',
  CLIENTE_ACTUALIZADO = 'CLIENTE_ACTUALIZADO',
  CLIENTE_ELIMINADO = 'CLIENTE_ELIMINADO',
  
  CASO_CREADO = 'CASO_CREADO',
  CASO_ACTUALIZADO = 'CASO_ACTUALIZADO',
  CASO_CERRADO = 'CASO_CERRADO',
  CASO_REABIERTO = 'CASO_REABIERTO',
  
  DOCUMENTO_SUBIDO = 'DOCUMENTO_SUBIDO',
  DOCUMENTO_DESCARGADO = 'DOCUMENTO_DESCARGADO',
  DOCUMENTO_ELIMINADO = 'DOCUMENTO_ELIMINADO',
  DOCUMENTO_COMPARTIDO = 'DOCUMENTO_COMPARTIDO',
  
  FACTURA_GENERADA = 'FACTURA_GENERADA',
  FACTURA_ENVIADA = 'FACTURA_ENVIADA',
  FACTURA_PAGADA = 'FACTURA_PAGADA',
  FACTURA_ANULADA = 'FACTURA_ANULADA',
  
  GASTO_REGISTRADO = 'GASTO_REGISTRADO',
  GASTO_APROBADO = 'GASTO_APROBADO',
  GASTO_RECHAZADO = 'GASTO_RECHAZADO',
  
  PROYECTO_CREADO = 'PROYECTO_CREADO',
  PROYECTO_ACTUALIZADO = 'PROYECTO_ACTUALIZADO',
  PROYECTO_INICIADO = 'PROYECTO_INICIADO',
  PROYECTO_PAUSADO = 'PROYECTO_PAUSADO',
  PROYECTO_COMPLETADO = 'PROYECTO_COMPLETADO',
  
  TIEMPO_REGISTRADO = 'TIEMPO_REGISTRADO',
  TIEMPO_APROBADO = 'TIEMPO_APROBADO',
  TIEMPO_FACTURADO = 'TIEMPO_FACTURADO',
  
  // Eventos de flujos de trabajo
  FLUJO_INICIADO = 'FLUJO_INICIADO',
  FLUJO_COMPLETADO = 'FLUJO_COMPLETADO',
  TAREA_ASIGNADA = 'TAREA_ASIGNADA',
  TAREA_COMPLETADA = 'TAREA_COMPLETADA',
  
  // Eventos de sistema
  CONFIGURACION_CAMBIADA = 'CONFIGURACION_CAMBIADA',
  BACKUP_REALIZADO = 'BACKUP_REALIZADO',
  ERROR_SISTEMA = 'ERROR_SISTEMA',
  ALERTA_SEGURIDAD = 'ALERTA_SEGURIDAD',
  
  // Eventos de compliance
  ACCESO_DATOS_SENSIBLES = 'ACCESO_DATOS_SENSIBLES',
  EXPORTACION_DATOS = 'EXPORTACION_DATOS',
  MODIFICACION_AUDITORIA = 'MODIFICACION_AUDITORIA',
  VIOLACION_POLITICA = 'VIOLACION_POLITICA',
}

export enum NivelEvento {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  DEBUG = 'DEBUG'
}

export enum ModuloEvento {
  AUTHENTICATION = 'AUTHENTICATION',
  USUARIOS = 'USUARIOS',
  EMPRESAS = 'EMPRESAS',
  ROLES = 'ROLES',
  CLIENTES = 'CLIENTES',
  CASOS = 'CASOS',
  DOCUMENTOS = 'DOCUMENTOS',
  FACTURACION = 'FACTURACION',
  GASTOS = 'GASTOS',
  PROYECTOS = 'PROYECTOS',
  REGISTROS_TIEMPO = 'REGISTROS_TIEMPO',
  FLUJOS_TRABAJO = 'FLUJOS_TRABAJO',
  BITACORA = 'BITACORA',
  SISTEMA = 'SISTEMA',
  REPORTES = 'REPORTES'
}

export enum EstadoEvento {
  PENDIENTE = 'PENDIENTE',
  PROCESADO = 'PROCESADO',
  FALLIDO = 'FALLIDO',
  ARCHIVADO = 'ARCHIVADO'
}

// DTOs para datos contextuales
export class InformacionSesionDto {
  @ApiProperty({ description: 'Dirección IP del usuario' })
  @IsString()
  direccionIp: string;

  @ApiPropertyOptional({ description: 'User Agent del navegador' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'ID de sesión' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Ubicación geográfica' })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ description: 'Dispositivo utilizado' })
  @IsOptional()
  @IsString()
  dispositivo?: string;
}

export class DetallesRecursoDto {
  @ApiProperty({ description: 'ID del recurso afectado' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Tipo de recurso' })
  @IsString()
  tipo: string;

  @ApiPropertyOptional({ description: 'Nombre del recurso' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción del recurso' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Propietario del recurso' })
  @IsOptional()
  @IsString()
  propietario?: string;

  @ApiPropertyOptional({ description: 'Estado anterior del recurso' })
  @IsOptional()
  @IsObject()
  estadoAnterior?: any;

  @ApiPropertyOptional({ description: 'Estado nuevo del recurso' })
  @IsOptional()
  @IsObject()
  estadoNuevo?: any;
}

export class CambiosRealizadosDto {
  @ApiPropertyOptional({ description: 'Campos modificados' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  camposModificados?: string[];

  @ApiPropertyOptional({ description: 'Valores anteriores' })
  @IsOptional()
  @IsObject()
  valoresAnteriores?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Valores nuevos' })
  @IsOptional()
  @IsObject()
  valoresNuevos?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Motivo del cambio' })
  @IsOptional()
  @IsString()
  motivoCambio?: string;

  @ApiPropertyOptional({ description: 'Usuario que autorizó el cambio' })
  @IsOptional()
  @IsString()
  autorizadoPor?: string;
}

export class InformacionErrorDto {
  @ApiProperty({ description: 'Código de error' })
  @IsString()
  codigoError: string;

  @ApiProperty({ description: 'Mensaje de error' })
  @IsString()
  mensajeError: string;

  @ApiPropertyOptional({ description: 'Stack trace del error' })
  @IsOptional()
  @IsString()
  stackTrace?: string;

  @ApiPropertyOptional({ description: 'Archivo donde ocurrió el error' })
  @IsOptional()
  @IsString()
  archivo?: string;

  @ApiPropertyOptional({ description: 'Línea donde ocurrió el error' })
  @IsOptional()
  @IsNumber()
  linea?: number;

  @ApiPropertyOptional({ description: 'Función donde ocurrió el error' })
  @IsOptional()
  @IsString()
  funcion?: string;

  @ApiPropertyOptional({ description: 'Datos de contexto del error' })
  @IsOptional()
  @IsObject()
  contextoError?: any;
}

export class MetricasRendimientoDto {
  @ApiPropertyOptional({ description: 'Tiempo de respuesta en milisegundos' })
  @IsOptional()
  @IsNumber()
  tiempoRespuesta?: number;

  @ApiPropertyOptional({ description: 'Uso de memoria en bytes' })
  @IsOptional()
  @IsNumber()
  usoMemoria?: number;

  @ApiPropertyOptional({ description: 'Uso de CPU en porcentaje' })
  @IsOptional()
  @IsNumber()
  usoCpu?: number;

  @ApiPropertyOptional({ description: 'Número de consultas de base de datos' })
  @IsOptional()
  @IsNumber()
  consultasDb?: number;

  @ApiPropertyOptional({ description: 'Tiempo total de consultas de base de datos' })
  @IsOptional()
  @IsNumber()
  tiempoConsultasDb?: number;

  @ApiPropertyOptional({ description: 'Tamaño de la respuesta en bytes' })
  @IsOptional()
  @IsNumber()
  tamanoRespuesta?: number;
}

export class EtiquetasEventoDto {
  @ApiPropertyOptional({ description: 'Prioridad del evento' })
  @IsOptional()
  @IsString()
  prioridad?: string;

  @ApiPropertyOptional({ description: 'Categoría del evento' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Subcategoría del evento' })
  @IsOptional()
  @IsString()
  subcategoria?: string;

  @ApiPropertyOptional({ description: 'Etiquetas personalizadas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetasPersonalizadas?: string[];

  @ApiPropertyOptional({ description: 'Ambiente donde ocurrió el evento' })
  @IsOptional()
  @IsString()
  ambiente?: string;

  @ApiPropertyOptional({ description: 'Versión de la aplicación' })
  @IsOptional()
  @IsString()
  version?: string;
}

export class ContextoEmpresarialDto {
  @ApiPropertyOptional({ description: 'Área de la empresa' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional({ description: 'Proyecto asociado' })
  @IsOptional()
  @IsString()
  proyectoId?: string;

  @ApiPropertyOptional({ description: 'Cliente asociado' })
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'Caso asociado' })
  @IsOptional()
  @IsString()
  casoId?: string;

  @ApiPropertyOptional({ description: 'Costo asociado' })
  @IsOptional()
  @IsNumber()
  costoAsociado?: number;

  @ApiPropertyOptional({ description: 'Impacto en facturación' })
  @IsOptional()
  @IsBoolean()
  impactoFacturacion?: boolean;
}

// DTO principal para crear entrada de bitácora
export class CreateBitacoraDto {
  @ApiProperty({ description: 'Tipo de evento', enum: TipoEvento })
  @IsEnum(TipoEvento)
  tipoEvento: TipoEvento;

  @ApiProperty({ description: 'Módulo que genera el evento', enum: ModuloEvento })
  @IsEnum(ModuloEvento)
  modulo: ModuloEvento;

  @ApiProperty({ description: 'Descripción del evento' })
  @IsString()
  descripcion: string;

  @ApiPropertyOptional({ description: 'Descripción detallada del evento' })
  @IsOptional()
  @IsString()
  descripcionDetallada?: string;

  @ApiProperty({ description: 'Nivel de importancia del evento', enum: NivelEvento })
  @IsEnum(NivelEvento)
  nivel: NivelEvento;

  @ApiPropertyOptional({ description: 'Estado del evento', enum: EstadoEvento })
  @IsOptional()
  @IsEnum(EstadoEvento)
  estado?: EstadoEvento = EstadoEvento.PENDIENTE;

  @ApiPropertyOptional({ description: 'ID del usuario que genera el evento' })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiPropertyOptional({ description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  usuarioNombre?: string;

  @ApiPropertyOptional({ description: 'ID de la empresa' })
  @IsOptional()
  @IsString()
  empresaId?: string;

  @ApiPropertyOptional({ description: 'Información de la sesión' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InformacionSesionDto)
  informacionSesion?: InformacionSesionDto;

  @ApiPropertyOptional({ description: 'Detalles del recurso afectado' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DetallesRecursoDto)
  detallesRecurso?: DetallesRecursoDto;

  @ApiPropertyOptional({ description: 'Cambios realizados' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CambiosRealizadosDto)
  cambiosRealizados?: CambiosRealizadosDto;

  @ApiPropertyOptional({ description: 'Información de error si aplica' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InformacionErrorDto)
  informacionError?: InformacionErrorDto;

  @ApiPropertyOptional({ description: 'Métricas de rendimiento' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetricasRendimientoDto)
  metricasRendimiento?: MetricasRendimientoDto;

  @ApiPropertyOptional({ description: 'Etiquetas del evento' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EtiquetasEventoDto)
  etiquetasEvento?: EtiquetasEventoDto;

  @ApiPropertyOptional({ description: 'Contexto empresarial' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContextoEmpresarialDto)
  contextoEmpresarial?: ContextoEmpresarialDto;

  @ApiPropertyOptional({ description: 'Fecha y hora del evento' })
  @IsOptional()
  @IsDateString()
  fechaEvento?: string;

  @ApiPropertyOptional({ description: 'Duración del evento en milisegundos' })
  @IsOptional()
  @IsNumber()
  duracionEvento?: number;

  @ApiPropertyOptional({ description: 'Datos adicionales en formato JSON' })
  @IsOptional()
  @IsObject()
  datosAdicionales?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Requiere notificación inmediata' })
  @IsOptional()
  @IsBoolean()
  requiereNotificacion?: boolean = false;

  @ApiPropertyOptional({ description: 'Nivel de retención en días' })
  @IsOptional()
  @IsNumber()
  nivelRetencion?: number;

  @ApiPropertyOptional({ description: 'Es evento crítico para compliance' })
  @IsOptional()
  @IsBoolean()
  criticoCompliance?: boolean = false;

  @ApiPropertyOptional({ description: 'Hash de integridad del evento' })
  @IsOptional()
  @IsString()
  hashIntegridad?: string;

  @ApiPropertyOptional({ description: 'Correlación con otros eventos' })
  @IsOptional()
  @IsString()
  correlacionId?: string;

  @ApiPropertyOptional({ description: 'ID de transacción' })
  @IsOptional()
  @IsString()
  transaccionId?: string;
}

// DTOs para eventos específicos de diferentes módulos
export class EventoAutenticacionDto extends CreateBitacoraDto {
  @ApiProperty({ description: 'Método de autenticación utilizado' })
  @IsString()
  metodoAutenticacion: string;

  @ApiPropertyOptional({ description: 'Resultado del intento de autenticación' })
  @IsOptional()
  @IsBoolean()
  exitoso?: boolean;

  @ApiPropertyOptional({ description: 'Motivo de fallo si aplica' })
  @IsOptional()
  @IsString()
  motivoFallo?: string;

  @ApiPropertyOptional({ description: 'Número de intentos fallidos consecutivos' })
  @IsOptional()
  @IsNumber()
  intentosFallidosConsecutivos?: number;
}

export class EventoCRUDDto extends CreateBitacoraDto {
  @ApiProperty({ description: 'Acción realizada (CREATE, READ, UPDATE, DELETE)' })
  @IsString()
  accion: string;

  @ApiProperty({ description: 'Tabla o entidad afectada' })
  @IsString()
  entidadAfectada: string;

  @ApiPropertyOptional({ description: 'Número de registros afectados' })
  @IsOptional()
  @IsNumber()
  registrosAfectados?: number;

  @ApiPropertyOptional({ description: 'Filtros aplicados en la operación' })
  @IsOptional()
  @IsObject()
  filtrosAplicados?: any;
}

export class EventoComplianceDto extends CreateBitacoraDto {
  @ApiProperty({ description: 'Regulación o norma asociada' })
  @IsString()
  regulacionAsociada: string;

  @ApiPropertyOptional({ description: 'Nivel de cumplimiento' })
  @IsOptional()
  @IsString()
  nivelCumplimiento?: string;

  @ApiPropertyOptional({ description: 'Acciones correctivas requeridas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accionesCorrectivas?: string[];

  @ApiPropertyOptional({ description: 'Responsable de compliance' })
  @IsOptional()
  @IsString()
  responsableCompliance?: string;

  @ApiPropertyOptional({ description: 'Fecha límite para acciones correctivas' })
  @IsOptional()
  @IsDateString()
  fechaLimiteAcciones?: string;
}
