export { 
  CreateFlujoTrabajoDto,
  PasoFlujoDto,
  AccionPasoDto,
  CondicionPasoDto,
  TriggerFlujoDto,
  TipoFlujoTrabajo,
  EstadoFlujoTrabajo,
  TipoAccionPaso,
  TipoCondicion
} from './create-flujo-trabajo.dto';

export { 
  UpdateFlujoTrabajoDto,
  UpdatePasoFlujoDto,
  UpdateTriggerFlujoDto,
  CambiarEstadoFlujoDto,
  EjectutarFlujoDto,
  ActualizarPasoDto,
  DuplicarFlujoDto,
  ImportarFlujoDto
} from './update-flujo-trabajo.dto';

// Tipos adicionales para gestión de workflows
export interface FiltrosFlujoTrabajoDto {
  tipo?: string;
  estado?: string;
  activo?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  prioridad?: number;
  usuarioCreador?: string;
  etiquetas?: string[];
  version?: string;
  administrador?: string;
  tieneEjecuciones?: boolean;
}

export interface EjecucionFlujoDto {
  id: string;
  flujoTrabajoId: string;
  entidadId?: string;
  tipoEntidad?: string;
  estado: 'INICIADO' | 'EN_PROGRESO' | 'COMPLETADO' | 'FALLIDO' | 'CANCELADO';
  pasoActual: number;
  datosContexto: Record<string, any>;
  usuarioEjecutor?: string;
  fechaInicio: Date;
  fechaCompletion?: Date;
  errores?: string[];
  resultados?: Record<string, any>;
  historialPasos: HistorialPasoDto[];
}

export interface HistorialPasoDto {
  pasoId: string;
  nombre: string;
  orden: number;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'FALLIDO' | 'OMITIDO';
  fechaInicio?: Date;
  fechaCompletion?: Date;
  usuarioAsignado?: string;
  usuarioEjecutor?: string;
  resultado?: 'APROBADO' | 'RECHAZADO' | 'COMPLETADO' | 'ERROR';
  comentarios?: string;
  datosEntrada?: Record<string, any>;
  datosSalida?: Record<string, any>;
  errores?: string[];
  tiempoEjecucion?: number; // en segundos
}

export interface EstadisticasFlujoDto {
  totalFlujos: number;
  flujosActivos: number;
  flujosPausados: number;
  totalEjecuciones: number;
  ejecucionesCompletadas: number;
  ejecucionesFallidas: number;
  tiempoPromedioEjecucion: number;
  tasaExito: number;
  flujosPopulares: Array<{
    flujoId: string;
    nombre: string;
    totalEjecuciones: number;
    tasaExito: number;
  }>;
  estadisticasPorTipo: Record<string, {
    cantidad: number;
    ejecuciones: number;
    tasaExito: number;
  }>;
  rendimientoPorPaso: Array<{
    pasoNombre: string;
    tiempoPromedio: number;
    tasaExito: number;
    cuellosBottella: boolean;
  }>;
}

export interface MetricasFlujoDto {
  flujoId: string;
  nombre: string;
  tipo: string;
  estado: string;
  totalEjecuciones: number;
  ejecucionesExitosas: number;
  ejecucionesFallidas: number;
  tasaExito: number;
  tiempoPromedioEjecucion: number;
  tiempoMinimoEjecucion: number;
  tiempoMaximoEjecucion: number;
  ultimaEjecucion?: Date;
  proximaEjecucion?: Date;
  usuariosMasActivos: Array<{
    usuarioId: string;
    nombre: string;
    ejecuciones: number;
  }>;
  pasosProblematicos: Array<{
    pasoId: string;
    nombre: string;
    tasaFallo: number;
    tiempoPromedio: number;
  }>;
  tendenciasUltimos30Dias: Array<{
    fecha: string;
    ejecuciones: number;
    exitos: number;
    fallos: number;
  }>;
}

export interface ConfiguracionNotificacionDto {
  habilitado: boolean;
  eventos: string[]; // INICIO, COMPLETION, ERROR, TIMEOUT, etc.
  destinatarios: {
    usuarios?: string[];
    roles?: string[];
    emails?: string[];
  };
  canales: ('EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK')[];
  plantillas: {
    email?: string;
    sms?: string;
    push?: string;
  };
  condiciones?: CondicionPasoDto[];
  configuracionAvanzada?: {
    agruparNotificaciones?: boolean;
    intervaloBatch?: number; // minutos
    reintentosMaximos?: number;
    escalamiento?: {
      habilitado: boolean;
      tiempoEspera: number; // minutos
      destinatariosEscalamiento: string[];
    };
  };
}

export interface PlantillaDatosDto {
  nombre: string;
  descripcion?: string;
  campos: Array<{
    nombre: string;
    tipo: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
    requerido: boolean;
    valorDefecto?: any;
    validaciones?: any[];
    descripcion?: string;
  }>;
  ejemploDatos: Record<string, any>;
}
