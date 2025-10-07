import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsDateString, IsBoolean, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  CreateBitacoraDto, 
  TipoEvento, 
  NivelEvento, 
  ModuloEvento, 
  EstadoEvento 
} from './create-bitacora.dto';

// DTO para actualizar estado de eventos de bitácora
export class UpdateBitacoraDto extends PartialType(CreateBitacoraDto) {
  @ApiPropertyOptional({ description: 'Nuevo estado del evento', enum: EstadoEvento })
  @IsOptional()
  @IsEnum(EstadoEvento)
  estado?: EstadoEvento;

  @ApiPropertyOptional({ description: 'Notas adicionales sobre la actualización' })
  @IsOptional()
  @IsString()
  notasActualizacion?: string;

  @ApiPropertyOptional({ description: 'Usuario que realiza la actualización' })
  @IsOptional()
  @IsString()
  actualizadoPor?: string;

  @ApiPropertyOptional({ description: 'Fecha de la actualización' })
  @IsOptional()
  @IsDateString()
  fechaActualizacion?: string;

  @ApiPropertyOptional({ description: 'Motivo de la actualización' })
  @IsOptional()
  @IsString()
  motivoActualizacion?: string;
}

// DTO para filtros de búsqueda en la bitácora
export class FiltrosBitacoraDto {
  @ApiPropertyOptional({ description: 'Tipo de evento a filtrar', enum: TipoEvento })
  @IsOptional()
  @IsEnum(TipoEvento)
  tipoEvento?: TipoEvento;

  @ApiPropertyOptional({ description: 'Tipos de eventos múltiples', enum: TipoEvento, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TipoEvento, { each: true })
  tiposEvento?: TipoEvento[];

  @ApiPropertyOptional({ description: 'Módulo a filtrar', enum: ModuloEvento })
  @IsOptional()
  @IsEnum(ModuloEvento)
  modulo?: ModuloEvento;

  @ApiPropertyOptional({ description: 'Múltiples módulos', enum: ModuloEvento, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ModuloEvento, { each: true })
  modulos?: ModuloEvento[];

  @ApiPropertyOptional({ description: 'Nivel del evento', enum: NivelEvento })
  @IsOptional()
  @IsEnum(NivelEvento)
  nivel?: NivelEvento;

  @ApiPropertyOptional({ description: 'Múltiples niveles', enum: NivelEvento, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(NivelEvento, { each: true })
  niveles?: NivelEvento[];

  @ApiPropertyOptional({ description: 'Estado del evento', enum: EstadoEvento })
  @IsOptional()
  @IsEnum(EstadoEvento)
  estado?: EstadoEvento;

  @ApiPropertyOptional({ description: 'ID del usuario' })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({ description: 'IDs de usuarios múltiples' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  usuarioIds?: string[];

  @ApiPropertyOptional({ description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  usuarioNombre?: string;

  @ApiPropertyOptional({ description: 'ID de la empresa' })
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO string)' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO string)' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ description: 'Fecha de evento específica' })
  @IsOptional()
  @IsDateString()
  fechaEvento?: string;

  @ApiPropertyOptional({ description: 'Rango de horas (0-23)' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  rangoHoras?: number[];

  @ApiPropertyOptional({ description: 'Días de la semana (0=domingo, 6=sábado)' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  diasSemana?: number[];

  @ApiPropertyOptional({ description: 'Dirección IP' })
  @IsOptional()
  @IsString()
  direccionIp?: string;

  @ApiPropertyOptional({ description: 'ID del recurso afectado' })
  @IsOptional()
  @IsString()
  recursoId?: string;

  @ApiPropertyOptional({ description: 'Tipo de recurso' })
  @IsOptional()
  @IsString()
  tipoRecurso?: string;

  @ApiPropertyOptional({ description: 'Búsqueda en descripción' })
  @IsOptional()
  @IsString()
  busquedaDescripcion?: string;

  @ApiPropertyOptional({ description: 'Búsqueda en descripción detallada' })
  @IsOptional()
  @IsString()
  busquedaDetallada?: string;

  @ApiPropertyOptional({ description: 'Búsqueda general (texto libre)' })
  @IsOptional()
  @IsString()
  busquedaGeneral?: string;

  @ApiPropertyOptional({ description: 'Solo eventos críticos para compliance' })
  @IsOptional()
  @IsBoolean()
  soloCriticosCompliance?: boolean;

  @ApiPropertyOptional({ description: 'Solo eventos que requieren notificación' })
  @IsOptional()
  @IsBoolean()
  soloConNotificacion?: boolean;

  @ApiPropertyOptional({ description: 'Solo eventos con errores' })
  @IsOptional()
  @IsBoolean()
  soloConErrores?: boolean;

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
  etiquetas?: string[];

  @ApiPropertyOptional({ description: 'ID de correlación' })
  @IsOptional()
  @IsString()
  correlacionId?: string;

  @ApiPropertyOptional({ description: 'ID de transacción' })
  @IsOptional()
  @IsString()
  transaccionId?: string;

  @ApiPropertyOptional({ description: 'Tiempo mínimo de respuesta (ms)' })
  @IsOptional()
  @IsNumber()
  tiempoRespuestaMin?: number;

  @ApiPropertyOptional({ description: 'Tiempo máximo de respuesta (ms)' })
  @IsOptional()
  @IsNumber()
  tiempoRespuestaMax?: number;

  @ApiPropertyOptional({ description: 'Cliente asociado al evento' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'Caso asociado al evento' })
  @IsOptional()
  @IsUUID()
  casoId?: string;

  @ApiPropertyOptional({ description: 'Proyecto asociado al evento' })
  @IsOptional()
  @IsUUID()
  proyectoId?: string;

  @ApiPropertyOptional({ description: 'Código de error específico' })
  @IsOptional()
  @IsString()
  codigoError?: string;

  @ApiPropertyOptional({ description: 'Archivo donde ocurrió el evento' })
  @IsOptional()
  @IsString()
  archivo?: string;

  @ApiPropertyOptional({ description: 'Función donde ocurrió el evento' })
  @IsOptional()
  @IsString()
  funcion?: string;

  @ApiPropertyOptional({ description: 'Ambiente (desarrollo, producción, etc.)' })
  @IsOptional()
  @IsString()
  ambiente?: string;

  @ApiPropertyOptional({ description: 'Versión de la aplicación' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Área de la empresa' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional({ description: 'Solo eventos con impacto en facturación' })
  @IsOptional()
  @IsBoolean()
  soloConImpactoFacturacion?: boolean;

  @ApiPropertyOptional({ description: 'Costo mínimo asociado' })
  @IsOptional()
  @IsNumber()
  costoMin?: number;

  @ApiPropertyOptional({ description: 'Costo máximo asociado' })
  @IsOptional()
  @IsNumber()
  costoMax?: number;

  @ApiPropertyOptional({ description: 'Duración mínima del evento (ms)' })
  @IsOptional()
  @IsNumber()
  duracionMin?: number;

  @ApiPropertyOptional({ description: 'Duración máxima del evento (ms)' })
  @IsOptional()
  @IsNumber()
  duracionMax?: number;

  @ApiPropertyOptional({ description: 'Campos específicos a retornar' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  campos?: string[];

  @ApiPropertyOptional({ description: 'Excluir campos específicos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excluirCampos?: string[];

  @ApiPropertyOptional({ description: 'Agrupar por campo específico' })
  @IsOptional()
  @IsString()
  agruparPor?: string;

  @ApiPropertyOptional({ description: 'Ordenar por campo específico' })
  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @ApiPropertyOptional({ description: 'Dirección del ordenamiento (ASC/DESC)' })
  @IsOptional()
  @IsString()
  direccionOrden?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Página para paginación' })
  @IsOptional()
  @IsNumber()
  pagina?: number;

  @ApiPropertyOptional({ description: 'Límite de registros por página' })
  @IsOptional()
  @IsNumber()
  limite?: number;

  @ApiPropertyOptional({ description: 'Incluir datos adicionales detallados' })
  @IsOptional()
  @IsBoolean()
  incluirDatosDetallados?: boolean;

  @ApiPropertyOptional({ description: 'Incluir métricas de rendimiento' })
  @IsOptional()
  @IsBoolean()
  incluirMetricas?: boolean;

  @ApiPropertyOptional({ description: 'Incluir información de sesión' })
  @IsOptional()
  @IsBoolean()
  incluirSesion?: boolean;

  @ApiPropertyOptional({ description: 'Incluir cambios realizados' })
  @IsOptional()
  @IsBoolean()
  incluirCambios?: boolean;
}

// DTO para generar reportes de auditoría
export class GenerarReporteAuditoriaDto {
  @ApiProperty({ description: 'Tipo de reporte' })
  @IsString()
  tipoReporte: 'COMPLIANCE' | 'SEGURIDAD' | 'ACTIVIDAD_USUARIO' | 'ERRORES_SISTEMA' | 'RENDIMIENTO' | 'PERSONALIZADO';

  @ApiProperty({ description: 'Formato del reporte' })
  @IsString()
  formato: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

  @ApiProperty({ description: 'Filtros para el reporte' })
  @ValidateNested()
  @Type(() => FiltrosBitacoraDto)
  filtros: FiltrosBitacoraDto;

  @ApiPropertyOptional({ description: 'Incluir gráficos estadísticos' })
  @IsOptional()
  @IsBoolean()
  incluirGraficos?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir resumen ejecutivo' })
  @IsOptional()
  @IsBoolean()
  incluirResumenEjecutivo?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir recomendaciones' })
  @IsOptional()
  @IsBoolean()
  incluirRecomendaciones?: boolean = false;

  @ApiPropertyOptional({ description: 'Plantilla personalizada' })
  @IsOptional()
  @IsString()
  plantillaPersonalizada?: string;

  @ApiPropertyOptional({ description: 'Destinatarios del reporte' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinatarios?: string[];

  @ApiPropertyOptional({ description: 'Enviar automáticamente' })
  @IsOptional()
  @IsBoolean()
  enviarAutomaticamente?: boolean = false;

  @ApiPropertyOptional({ description: 'Programar generación recurrente' })
  @IsOptional()
  @IsString()
  programacionRecurrente?: 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL';

  @ApiPropertyOptional({ description: 'Configuración específica por tipo de reporte' })
  @IsOptional()
  @IsObject()
  configuracionEspecifica?: any;
}

// DTO para configurar alertas de auditoría
export class ConfigurarAlertaAuditoriaDto {
  @ApiProperty({ description: 'Nombre de la alerta' })
  @IsString()
  nombreAlerta: string;

  @ApiProperty({ description: 'Descripción de la alerta' })
  @IsString()
  descripcion: string;

  @ApiProperty({ description: 'Condiciones que disparan la alerta' })
  @ValidateNested()
  @Type(() => FiltrosBitacoraDto)
  condicionesDisparo: FiltrosBitacoraDto;

  @ApiProperty({ description: 'Nivel de severidad de la alerta' })
  @IsEnum(NivelEvento)
  nivelSeveridad: NivelEvento;

  @ApiPropertyOptional({ description: 'Frecuencia de evaluación en minutos' })
  @IsOptional()
  @IsNumber()
  frecuenciaEvaluacion?: number = 15;

  @ApiPropertyOptional({ description: 'Número máximo de eventos antes de alertar' })
  @IsOptional()
  @IsNumber()
  umbralEventos?: number = 1;

  @ApiPropertyOptional({ description: 'Ventana de tiempo para evaluar umbral (minutos)' })
  @IsOptional()
  @IsNumber()
  ventanaTiempo?: number = 60;

  @ApiPropertyOptional({ description: 'Destinatarios de la alerta' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinatarios?: string[];

  @ApiPropertyOptional({ description: 'Canales de notificación' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  canalesNotificacion?: string[];

  @ApiPropertyOptional({ description: 'Plantilla de mensaje de alerta' })
  @IsOptional()
  @IsString()
  plantillaMensaje?: string;

  @ApiPropertyOptional({ description: 'Activar alerta' })
  @IsOptional()
  @IsBoolean()
  activa?: boolean = true;

  @ApiPropertyOptional({ description: 'Suprimir duplicados por periodo (minutos)' })
  @IsOptional()
  @IsNumber()
  suprimirDuplicados?: number = 60;

  @ApiPropertyOptional({ description: 'Escalamiento automático' })
  @IsOptional()
  @IsObject()
  escalamientoAutomatico?: {
    habilitado: boolean;
    tiempoEspera: number; // minutos
    destinatariosEscalamiento: string[];
  };

  @ApiPropertyOptional({ description: 'Acciones automáticas a ejecutar' })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  accionesAutomaticas?: Array<{
    tipo: string;
    parametros: any;
  }>;
}

// DTO para configurar retención de datos
export class ConfigurarRetencionDto {
  @ApiProperty({ description: 'Módulo para configurar retención', enum: ModuloEvento })
  @IsEnum(ModuloEvento)
  modulo: ModuloEvento;

  @ApiProperty({ description: 'Nivel de evento para configurar retención', enum: NivelEvento })
  @IsEnum(NivelEvento)
  nivel: NivelEvento;

  @ApiProperty({ description: 'Días de retención' })
  @IsNumber()
  diasRetencion: number;

  @ApiPropertyOptional({ description: 'Archivar automáticamente después del periodo' })
  @IsOptional()
  @IsBoolean()
  archivarAutomaticamente?: boolean = true;

  @ApiPropertyOptional({ description: 'Comprimir eventos archivados' })
  @IsOptional()
  @IsBoolean()
  comprimirArchivados?: boolean = true;

  @ApiPropertyOptional({ description: 'Eliminar permanentemente después de archivado (días)' })
  @IsOptional()
  @IsNumber()
  diasEliminacionPermanente?: number;

  @ApiPropertyOptional({ description: 'Excepciones para eventos críticos' })
  @IsOptional()
  @IsBoolean()
  excepcionEventosCriticos?: boolean = true;

  @ApiPropertyOptional({ description: 'Criterios adicionales para retención' })
  @IsOptional()
  @IsObject()
  criteriosAdicionales?: any;
}

// DTO para estadísticas y métricas de auditoría
export class EstadisticasAuditoriaDto {
  @ApiPropertyOptional({ description: 'Filtros para las estadísticas' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FiltrosBitacoraDto)
  filtros?: FiltrosBitacoraDto;

  @ApiPropertyOptional({ description: 'Tipo de agrupación para estadísticas' })
  @IsOptional()
  @IsString()
  tipoAgrupacion?: 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL' | 'HORA' | 'MODULO' | 'USUARIO' | 'TIPO_EVENTO';

  @ApiPropertyOptional({ description: 'Incluir tendencias' })
  @IsOptional()
  @IsBoolean()
  incluirTendencias?: boolean = true;

  @ApiPropertyOptional({ description: 'Incluir comparación con periodo anterior' })
  @IsOptional()
  @IsBoolean()
  incluirComparacion?: boolean = false;

  @ApiPropertyOptional({ description: 'Métricas específicas a calcular' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metricasEspecificas?: string[];

  @ApiPropertyOptional({ description: 'Formato de respuesta' })
  @IsOptional()
  @IsString()
  formatoRespuesta?: 'DETALLADO' | 'RESUMIDO' | 'GRAFICO';
}

// DTO para exportar datos de auditoría
export class ExportarDatosAuditoriaDto {
  @ApiProperty({ description: 'Filtros para la exportación' })
  @ValidateNested()
  @Type(() => FiltrosBitacoraDto)
  filtros: FiltrosBitacoraDto;

  @ApiProperty({ description: 'Formato de exportación' })
  @IsString()
  formato: 'JSON' | 'CSV' | 'EXCEL' | 'XML';

  @ApiPropertyOptional({ description: 'Incluir datos sensibles (requiere permisos especiales)' })
  @IsOptional()
  @IsBoolean()
  incluirDatosSensibles?: boolean = false;

  @ApiPropertyOptional({ description: 'Comprimir archivo de exportación' })
  @IsOptional()
  @IsBoolean()
  comprimirArchivo?: boolean = false;

  @ApiPropertyOptional({ description: 'Proteger con contraseña' })
  @IsOptional()
  @IsBoolean()
  protegerConPassword?: boolean = false;

  @ApiPropertyOptional({ description: 'Cifrar datos exportados' })
  @IsOptional()
  @IsBoolean()
  cifrarDatos?: boolean = false;

  @ApiPropertyOptional({ description: 'Razón de la exportación (para auditoría)' })
  @IsOptional()
  @IsString()
  razonExportacion?: string;

  @ApiPropertyOptional({ description: 'Destinatario autorizado' })
  @IsOptional()
  @IsString()
  destinatarioAutorizado?: string;

  @ApiPropertyOptional({ description: 'Fecha de caducidad del archivo exportado' })
  @IsOptional()
  @IsDateString()
  fechaCaducidad?: string;
}
