import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In, MoreThan, LessThan } from 'typeorm';
import { 
  CreateBitacoraDto, 
  TipoEvento, 
  NivelEvento, 
  ModuloEvento, 
  EstadoEvento,
  EventoAutenticacionDto,
  EventoCRUDDto,
  EventoComplianceDto
} from './dto/create-bitacora.dto';
import {
  UpdateBitacoraDto,
  FiltrosBitacoraDto,
  GenerarReporteAuditoriaDto,
  ConfigurarAlertaAuditoriaDto,
  ConfigurarRetencionDto,
  EstadisticasAuditoriaDto,
  ExportarDatosAuditoriaDto
} from './dto/update-bitacora.dto';
import { Usuario } from '../../entities/usuario.entity';
import { Empresa } from '../../entities/empresa.entity';
import * as crypto from 'crypto';

// Entidad temporal para Bitácora
export class Bitacora {
  id: string;
  tipoEvento: TipoEvento;
  modulo: ModuloEvento;
  descripcion: string;
  descripcionDetallada?: string;
  nivel: NivelEvento;
  estado: EstadoEvento;
  usuarioId?: string;
  usuarioNombre?: string;
  empresaId?: string;
  fechaEvento: Date;
  duracionEvento?: number;
  informacionSesion?: any;
  detallesRecurso?: any;
  cambiosRealizados?: any;
  informacionError?: any;
  metricasRendimiento?: any;
  etiquetasEvento?: any;
  contextoEmpresarial?: any;
  datosAdicionales?: Record<string, any>;
  requiereNotificacion: boolean;
  nivelRetencion?: number;
  criticoCompliance: boolean;
  hashIntegridad?: string;
  correlacionId?: string;
  transaccionId?: string;
  fechaCreacion: Date;
  fechaActualizacion?: Date;
  actualizadoPor?: string;
  notasActualizacion?: string;
  motivoActualizacion?: string;
  procesado: boolean;
  archivar: boolean;
  fechaArchivado?: Date;
  
  // Relaciones
  usuario?: Usuario;
  empresa?: Empresa;
}

export interface EstadisticasAuditoria {
  totalEventos: number;
  eventosPorTipo: Record<TipoEvento, number>;
  eventosPorModulo: Record<ModuloEvento, number>;
  eventosPorNivel: Record<NivelEvento, number>;
  eventosPorEstado: Record<EstadoEvento, number>;
  eventosUltimas24h: number;
  eventosUltimaSemana: number;
  eventosUltimoMes: number;
  usuariosMasActivos: Array<{
    usuarioId: string;
    usuarioNombre: string;
    totalEventos: number;
  }>;
  modulosMasActivos: Array<{
    modulo: ModuloEvento;
    totalEventos: number;
  }>;
  eventosErrores: number;
  eventosWarning: number;
  eventosCriticos: number;
  tiempoPromedioRespuesta: number;
  tendenciaEventos: Array<{
    fecha: string;
    cantidad: number;
  }>;
  alertasActivas: number;
  cumplimientoRetencion: number;
  espacioUtilizado: number; // en bytes
  eventosComplianceRequeridos: number;
}

export interface ResultadoIntegridad {
  totalEventos: number;
  eventosVerificados: number;
  eventosCorruptos: number;
  eventosModificados: number;
  porcentajeIntegridad: number;
  detallesCorrupcion: Array<{
    eventoId: string;
    tipoProblema: string;
    descripcion: string;
    fechaDeteccion: Date;
  }>;
  recomendaciones: string[];
}

export interface ConfiguracionRetencion {
  modulo: ModuloEvento;
  nivel: NivelEvento;
  diasRetencion: number;
  archivarAutomaticamente: boolean;
  comprimirArchivados: boolean;
  diasEliminacionPermanente?: number;
  excepcionEventosCriticos: boolean;
  criteriosAdicionales?: any;
  fechaCreacion: Date;
  actualizadoPor: string;
}

export interface AlertaAuditoria {
  id: string;
  nombreAlerta: string;
  descripcion: string;
  condicionesDisparo: FiltrosBitacoraDto;
  nivelSeveridad: NivelEvento;
  frecuenciaEvaluacion: number;
  umbralEventos: number;
  ventanaTiempo: number;
  destinatarios: string[];
  canalesNotificacion: string[];
  plantillaMensaje?: string;
  activa: boolean;
  suprimirDuplicados: number;
  escalamientoAutomatico?: any;
  accionesAutomaticas?: Array<any>;
  fechaCreacion: Date;
  ultimaEvaluacion?: Date;
  ultimaActivacion?: Date;
  numeroActivaciones: number;
}

@Injectable()
export class BitacoraService {
  private configuracionesRetencion: Map<string, ConfiguracionRetencion> = new Map();
  private alertasActivas: Map<string, AlertaAuditoria> = new Map();

  constructor(
    @Inject('BITACORA_REPOSITORY')
    private bitacoraRepository: any, // Repository<Bitacora>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empresa) 
    private empresaRepository: Repository<Empresa>,
  ) {
    this.inicializarConfiguracionesPorDefecto();
    this.iniciarEvaluadorAlertas();
  }

  async create(createBitacoraDto: CreateBitacoraDto, contextoAdicional?: any): Promise<Bitacora> {
    // Generar hash de integridad
    const hashIntegridad = this.generarHashIntegridad(createBitacoraDto);

    // Crear entrada de bitácora
    const bitacora = {
      ...createBitacoraDto,
      id: crypto.randomUUID(),
      fechaEvento: createBitacoraDto.fechaEvento ? new Date(createBitacoraDto.fechaEvento) : new Date(),
      hashIntegridad,
      fechaCreacion: new Date(),
      procesado: false,
      archivar: false,
      estado: createBitacoraDto.estado || EstadoEvento.PENDIENTE,
      requiereNotificacion: createBitacoraDto.requiereNotificacion || false,
      criticoCompliance: createBitacoraDto.criticoCompliance || false,
      correlacionId: createBitacoraDto.correlacionId || crypto.randomUUID(),
      transaccionId: createBitacoraDto.transaccionId || crypto.randomUUID(),
      ...contextoAdicional
    } as Bitacora;

    // Aplicar configuración de retención
    await this.aplicarConfiguracionRetencion(bitacora);

    // Procesar evento inmediatamente si es crítico
    if (bitacora.nivel === NivelEvento.CRITICAL || bitacora.criticoCompliance) {
      await this.procesarEventoCritico(bitacora);
    }

    // Guardar en repositorio (simulado)
    const bitacoraGuardada = await this.bitacoraRepository.save(bitacora);

    // Evaluar alertas
    await this.evaluarAlertas(bitacoraGuardada);

    // Procesar notificaciones
    if (bitacora.requiereNotificacion) {
      await this.procesarNotificacion(bitacoraGuardada);
    }

    // Registrar métricas
    await this.actualizarMetricas(bitacoraGuardada);

    return bitacoraGuardada;
  }

  async registrarEventoAutenticacion(eventoDto: EventoAutenticacionDto): Promise<Bitacora> {
    const datosEspecificos = {
      metodoAutenticacion: eventoDto.metodoAutenticacion,
      exitoso: eventoDto.exitoso,
      motivoFallo: eventoDto.motivoFallo,
      intentosFallidosConsecutivos: eventoDto.intentosFallidosConsecutivos
    };

    return await this.create({
      ...eventoDto,
      datosAdicionales: { ...eventoDto.datosAdicionales, ...datosEspecificos },
      criticoCompliance: !eventoDto.exitoso || eventoDto.intentosFallidosConsecutivos > 3
    });
  }

  async registrarEventoCRUD(eventoDto: EventoCRUDDto): Promise<Bitacora> {
    const datosEspecificos = {
      accion: eventoDto.accion,
      entidadAfectada: eventoDto.entidadAfectada,
      registrosAfectados: eventoDto.registrosAfectados,
      filtrosAplicados: eventoDto.filtrosAplicados
    };

    return await this.create({
      ...eventoDto,
      datosAdicionales: { ...eventoDto.datosAdicionales, ...datosEspecificos },
      criticoCompliance: eventoDto.accion === 'DELETE' && eventoDto.registrosAfectados > 1
    });
  }

  async registrarEventoCompliance(eventoDto: EventoComplianceDto): Promise<Bitacora> {
    const datosEspecificos = {
      regulacionAsociada: eventoDto.regulacionAsociada,
      nivelCumplimiento: eventoDto.nivelCumplimiento,
      accionesCorrectivas: eventoDto.accionesCorrectivas,
      responsableCompliance: eventoDto.responsableCompliance,
      fechaLimiteAcciones: eventoDto.fechaLimiteAcciones
    };

    return await this.create({
      ...eventoDto,
      datosAdicionales: { ...eventoDto.datosAdicionales, ...datosEspecificos },
      criticoCompliance: true,
      requiereNotificacion: true,
      nivel: NivelEvento.CRITICAL
    });
  }

  async findAll(filtros: FiltrosBitacoraDto, empresaId?: string, page: number = 1, limit: number = 50) {
    // Construir query con filtros
    const whereConditions: any = {};

    if (empresaId) {
      whereConditions.empresaId = empresaId;
    }

    if (filtros.tipoEvento) {
      whereConditions.tipoEvento = filtros.tipoEvento;
    }

    if (filtros.tiposEvento && filtros.tiposEvento.length > 0) {
      whereConditions.tipoEvento = In(filtros.tiposEvento);
    }

    if (filtros.modulo) {
      whereConditions.modulo = filtros.modulo;
    }

    if (filtros.modulos && filtros.modulos.length > 0) {
      whereConditions.modulo = In(filtros.modulos);
    }

    if (filtros.nivel) {
      whereConditions.nivel = filtros.nivel;
    }

    if (filtros.niveles && filtros.niveles.length > 0) {
      whereConditions.nivel = In(filtros.niveles);
    }

    if (filtros.estado) {
      whereConditions.estado = filtros.estado;
    }

    if (filtros.usuarioId) {
      whereConditions.usuarioId = filtros.usuarioId;
    }

    if (filtros.usuarioIds && filtros.usuarioIds.length > 0) {
      whereConditions.usuarioId = In(filtros.usuarioIds);
    }

    if (filtros.fechaDesde && filtros.fechaHasta) {
      whereConditions.fechaEvento = Between(new Date(filtros.fechaDesde), new Date(filtros.fechaHasta));
    } else if (filtros.fechaDesde) {
      whereConditions.fechaEvento = MoreThan(new Date(filtros.fechaDesde));
    } else if (filtros.fechaHasta) {
      whereConditions.fechaEvento = LessThan(new Date(filtros.fechaHasta));
    }

    if (filtros.busquedaDescripcion) {
      whereConditions.descripcion = Like(`%${filtros.busquedaDescripcion}%`);
    }

    if (filtros.soloCriticosCompliance) {
      whereConditions.criticoCompliance = true;
    }

    if (filtros.soloConNotificacion) {
      whereConditions.requiereNotificacion = true;
    }

    if (filtros.correlacionId) {
      whereConditions.correlacionId = filtros.correlacionId;
    }

    if (filtros.transaccionId) {
      whereConditions.transaccionId = filtros.transaccionId;
    }

    // Opciones de consulta
    const queryOptions: any = {
      where: whereConditions,
      order: { fechaEvento: filtros.direccionOrden || 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    };

    // Incluir relaciones según filtros
    const relations = [];
    if (filtros.incluirSesion) relations.push('usuario');
    if (relations.length > 0) queryOptions.relations = relations;

    // Seleccionar campos específicos
    if (filtros.campos && filtros.campos.length > 0) {
      queryOptions.select = filtros.campos;
    }

    // Ejecutar consulta simulada
    const eventos = await this.bitacoraRepository.findAndCount(queryOptions);

    return {
      data: eventos[0] || [],
      total: eventos[1] || 0,
      page,
      limit,
      totalPages: Math.ceil((eventos[1] || 0) / limit)
    };
  }

  async findOne(id: string, empresaId?: string): Promise<Bitacora> {
    const whereConditions: any = { id };
    if (empresaId) {
      whereConditions.empresaId = empresaId;
    }

    const evento = await this.bitacoraRepository.findOne({
      where: whereConditions,
      relations: ['usuario', 'empresa']
    });

    if (!evento) {
      throw new NotFoundException('Evento de auditoría no encontrado');
    }

    // Verificar integridad del evento
    await this.verificarIntegridadEvento(evento);

    return evento;
  }

  async update(id: string, updateBitacoraDto: UpdateBitacoraDto, empresaId?: string, usuarioId?: string): Promise<Bitacora> {
    const evento = await this.findOne(id, empresaId);

    // Verificar permisos para modificar bitácora
    if (!this.puedeModificarBitacora(usuarioId, evento)) {
      throw new ForbiddenException('No tiene permisos para modificar este evento de auditoría');
    }

    // Registrar modificación de auditoría
    await this.registrarModificacionAuditoria(evento, updateBitacoraDto, usuarioId);

    // Actualizar evento
    Object.assign(evento, updateBitacoraDto);
    evento.fechaActualizacion = new Date();
    evento.actualizadoPor = usuarioId;

    // Recalcular hash de integridad
    evento.hashIntegridad = this.generarHashIntegridad(evento);

    const eventoActualizado = await this.bitacoraRepository.save(evento);

    return eventoActualizado;
  }

  async getEstadisticas(filtros?: FiltrosBitacoraDto, empresaId?: string): Promise<EstadisticasAuditoria> {
    const whereConditions: any = {};
    if (empresaId) whereConditions.empresaId = empresaId;

    // Aplicar filtros básicos
    if (filtros?.fechaDesde && filtros?.fechaHasta) {
      whereConditions.fechaEvento = Between(new Date(filtros.fechaDesde), new Date(filtros.fechaHasta));
    }

    const eventos = await this.bitacoraRepository.find({ where: whereConditions });

    // Calcular estadísticas
    const totalEventos = eventos.length;
    
    const eventosPorTipo = Object.values(TipoEvento).reduce((acc, tipo) => {
      acc[tipo] = eventos.filter(e => e.tipoEvento === tipo).length;
      return acc;
    }, {} as Record<TipoEvento, number>);

    const eventosPorModulo = Object.values(ModuloEvento).reduce((acc, modulo) => {
      acc[modulo] = eventos.filter(e => e.modulo === modulo).length;
      return acc;
    }, {} as Record<ModuloEvento, number>);

    const eventosPorNivel = Object.values(NivelEvento).reduce((acc, nivel) => {
      acc[nivel] = eventos.filter(e => e.nivel === nivel).length;
      return acc;
    }, {} as Record<NivelEvento, number>);

    const eventosPorEstado = Object.values(EstadoEvento).reduce((acc, estado) => {
      acc[estado] = eventos.filter(e => e.estado === estado).length;
      return acc;
    }, {} as Record<EstadoEvento, number>);

    // Eventos por periodo
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const haceSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const haceMes = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const eventosUltimas24h = eventos.filter(e => e.fechaEvento >= hace24h).length;
    const eventosUltimaSemana = eventos.filter(e => e.fechaEvento >= haceSemana).length;
    const eventosUltimoMes = eventos.filter(e => e.fechaEvento >= haceMes).length;

    // Usuarios más activos
    const usuariosMap = new Map();
    eventos.forEach(evento => {
      if (evento.usuarioId) {
        const count = usuariosMap.get(evento.usuarioId) || 0;
        usuariosMap.set(evento.usuarioId, count + 1);
      }
    });

    const usuariosMasActivos = Array.from(usuariosMap.entries())
      .map(([usuarioId, totalEventos]) => ({
        usuarioId,
        usuarioNombre: eventos.find(e => e.usuarioId === usuarioId)?.usuarioNombre || 'Usuario desconocido',
        totalEventos
      }))
      .sort((a, b) => b.totalEventos - a.totalEventos)
      .slice(0, 10);

    // Módulos más activos
    const modulosMasActivos = Object.entries(eventosPorModulo)
      .map(([modulo, totalEventos]) => ({ modulo: modulo as ModuloEvento, totalEventos }))
      .sort((a, b) => b.totalEventos - a.totalEventos);

    // Eventos por severidad
    const eventosErrores = eventos.filter(e => e.nivel === NivelEvento.ERROR).length;
    const eventosWarning = eventos.filter(e => e.nivel === NivelEvento.WARNING).length;
    const eventosCriticos = eventos.filter(e => e.nivel === NivelEvento.CRITICAL).length;

    // Tiempo promedio de respuesta
    const eventosConTiempo = eventos.filter(e => e.metricasRendimiento?.tiempoRespuesta);
    const tiempoPromedioRespuesta = eventosConTiempo.length > 0 
      ? eventosConTiempo.reduce((sum, e) => sum + e.metricasRendimiento.tiempoRespuesta, 0) / eventosConTiempo.length
      : 0;

    // Tendencia eventos (últimos 30 días)
    const tendenciaEventos = this.calcularTendenciaEventos(eventos, 30);

    // Alertas activas
    const alertasActivas = this.alertasActivas.size;

    // Cumplimiento retención
    const cumplimientoRetencion = await this.calcularCumplimientoRetencion();

    // Espacio utilizado (simulado)
    const espacioUtilizado = eventos.length * 1024; // Aproximación en bytes

    // Eventos compliance
    const eventosComplianceRequeridos = eventos.filter(e => e.criticoCompliance).length;

    return {
      totalEventos,
      eventosPorTipo,
      eventosPorModulo,
      eventosPorNivel,
      eventosPorEstado,
      eventosUltimas24h,
      eventosUltimaSemana,
      eventosUltimoMes,
      usuariosMasActivos,
      modulosMasActivos,
      eventosErrores,
      eventosWarning,
      eventosCriticos,
      tiempoPromedioRespuesta,
      tendenciaEventos,
      alertasActivas,
      cumplimientoRetencion,
      espacioUtilizado,
      eventosComplianceRequeridos
    };
  }

  async generarReporteAuditoria(reporteDto: GenerarReporteAuditoriaDto, empresaId?: string): Promise<any> {
    // Obtener datos según filtros
    const datos = await this.findAll(reporteDto.filtros, empresaId, 1, 10000);
    
    // Obtener estadísticas
    const estadisticas = await this.getEstadisticas(reporteDto.filtros, empresaId);

    // Estructura del reporte
    const reporte = {
      metadatos: {
        tipoReporte: reporteDto.tipoReporte,
        formato: reporteDto.formato,
        fechaGeneracion: new Date(),
        periodoConsultado: {
          desde: reporteDto.filtros.fechaDesde,
          hasta: reporteDto.filtros.fechaHasta
        },
        filtrosAplicados: reporteDto.filtros,
        totalEventos: datos.total,
        generadoPor: empresaId
      },
      resumenEjecutivo: reporteDto.incluirResumenEjecutivo ? {
        totalEventos: estadisticas.totalEventos,
        eventosUltimaSemana: estadisticas.eventosUltimaSemana,
        eventosCriticos: estadisticas.eventosCriticos,
        cumplimientoGeneral: this.calcularCumplimientoGeneral(estadisticas),
        principalesAmenazas: this.identificarPrincipalesAmenazas(datos.data),
        recomendacionesPrioritarias: this.generarRecomendacionesPrioritarias(estadisticas)
      } : undefined,
      estadisticas,
      datos: datos.data,
      graficos: reporteDto.incluirGraficos ? {
        eventosPorTipo: estadisticas.eventosPorTipo,
        eventosPorModulo: estadisticas.eventosPorModulo,
        tendenciaEventos: estadisticas.tendenciaEventos,
        usuariosMasActivos: estadisticas.usuariosMasActivos.slice(0, 10)
      } : undefined,
      recomendaciones: reporteDto.incluirRecomendaciones ? 
        this.generarRecomendacionesDetalladas(estadisticas, datos.data) : undefined,
      anexos: {
        configuracionesRetencion: Array.from(this.configuracionesRetencion.values()),
        alertasActivas: Array.from(this.alertasActivas.values()).filter(a => a.activa),
        integridadVerificacion: await this.verificarIntegridadGeneral()
      }
    };

    // Procesar según formato
    switch (reporteDto.formato) {
      case 'PDF':
        return await this.generarReportePDF(reporte);
      case 'EXCEL':
        return await this.generarReporteExcel(reporte);
      case 'CSV':
        return await this.generarReporteCSV(reporte);
      case 'JSON':
      default:
        return reporte;
    }
  }

  async configurarAlerta(alertaDto: ConfigurarAlertaAuditoriaDto, usuarioId: string): Promise<AlertaAuditoria> {
    const alertaId = crypto.randomUUID();
    
    const alerta: AlertaAuditoria = {
      id: alertaId,
      nombreAlerta: alertaDto.nombreAlerta,
      descripcion: alertaDto.descripcion,
      condicionesDisparo: alertaDto.condicionesDisparo,
      nivelSeveridad: alertaDto.nivelSeveridad,
      frecuenciaEvaluacion: alertaDto.frecuenciaEvaluacion,
      umbralEventos: alertaDto.umbralEventos,
      ventanaTiempo: alertaDto.ventanaTiempo,
      destinatarios: alertaDto.destinatarios,
      canalesNotificacion: alertaDto.canalesNotificacion,
      plantillaMensaje: alertaDto.plantillaMensaje,
      activa: alertaDto.activa,
      suprimirDuplicados: alertaDto.suprimirDuplicados,
      escalamientoAutomatico: alertaDto.escalamientoAutomatico,
      accionesAutomaticas: alertaDto.accionesAutomaticas,
      fechaCreacion: new Date(),
      numeroActivaciones: 0
    };

    this.alertasActivas.set(alertaId, alerta);

    // Registrar configuración de alerta
    await this.create({
      tipoEvento: TipoEvento.CONFIGURACION_CAMBIADA,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Alerta configurada: ${alertaDto.nombreAlerta}`,
      nivel: NivelEvento.INFO,
      usuarioId,
      datosAdicionales: { alertaId, configuracion: alertaDto }
    });

    return alerta;
  }

  async configurarRetencion(retencionDto: ConfigurarRetencionDto, usuarioId: string): Promise<ConfiguracionRetencion> {
    const configuracionId = `${retencionDto.modulo}_${retencionDto.nivel}`;
    
    const configuracion: ConfiguracionRetencion = {
      modulo: retencionDto.modulo,
      nivel: retencionDto.nivel,
      diasRetencion: retencionDto.diasRetencion,
      archivarAutomaticamente: retencionDto.archivarAutomaticamente,
      comprimirArchivados: retencionDto.comprimirArchivados,
      diasEliminacionPermanente: retencionDto.diasEliminacionPermanente,
      excepcionEventosCriticos: retencionDto.excepcionEventosCriticos,
      criteriosAdicionales: retencionDto.criteriosAdicionales,
      fechaCreacion: new Date(),
      actualizadoPor: usuarioId
    };

    this.configuracionesRetencion.set(configuracionId, configuracion);

    // Registrar cambio de configuración
    await this.create({
      tipoEvento: TipoEvento.CONFIGURACION_CAMBIADA,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Configuración de retención actualizada para ${retencionDto.modulo}`,
      nivel: NivelEvento.INFO,
      usuarioId,
      datosAdicionales: { configuracion }
    });

    return configuracion;
  }

  async exportarDatos(exportarDto: ExportarDatosAuditoriaDto, usuarioId: string): Promise<any> {
    // Verificar permisos para exportar datos sensibles
    if (exportarDto.incluirDatosSensibles) {
      await this.verificarPermisosExportacion(usuarioId);
    }

    // Obtener datos
    const datos = await this.findAll(exportarDto.filtros, undefined, 1, 100000);

    // Filtrar datos sensibles si no está autorizado
    let datosExportacion = datos.data;
    if (!exportarDto.incluirDatosSensibles) {
      datosExportacion = this.filtrarDatosSensibles(datosExportacion);
    }

    // Registrar exportación
    await this.create({
      tipoEvento: TipoEvento.EXPORTACION_DATOS,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Exportación de datos de auditoría: ${datosExportacion.length} registros`,
      nivel: exportarDto.incluirDatosSensibles ? NivelEvento.WARNING : NivelEvento.INFO,
      usuarioId,
      criticoCompliance: exportarDto.incluirDatosSensibles,
      datosAdicionales: {
        totalRegistros: datosExportacion.length,
        formato: exportarDto.formato,
        incluyeDatosSensibles: exportarDto.incluirDatosSensibles,
        razon: exportarDto.razonExportacion,
        destinatario: exportarDto.destinatarioAutorizado
      }
    });

    // Procesar según formato
    let archivoExportado;
    switch (exportarDto.formato) {
      case 'JSON':
        archivoExportado = JSON.stringify(datosExportacion, null, 2);
        break;
      case 'CSV':
        archivoExportado = this.convertirACSV(datosExportacion);
        break;
      case 'EXCEL':
        archivoExportado = await this.convertirAExcel(datosExportacion);
        break;
      case 'XML':
        archivoExportado = this.convertirAXML(datosExportacion);
        break;
      default:
        throw new BadRequestException('Formato de exportación no soportado');
    }

    // Aplicar configuraciones de seguridad
    if (exportarDto.cifrarDatos) {
      archivoExportado = await this.cifrarArchivo(archivoExportado);
    }

    if (exportarDto.comprimirArchivo) {
      archivoExportado = await this.comprimirArchivo(archivoExportado);
    }

    return {
      archivo: archivoExportado,
      metadata: {
        totalRegistros: datosExportacion.length,
        formato: exportarDto.formato,
        fechaGeneracion: new Date(),
        fechaCaducidad: exportarDto.fechaCaducidad,
        checksum: this.calcularChecksum(archivoExportado)
      }
    };
  }

  async verificarIntegridad(desde?: Date, hasta?: Date): Promise<ResultadoIntegridad> {
    const filtros: any = {};
    if (desde) filtros.fechaDesde = desde.toISOString();
    if (hasta) filtros.fechaHasta = hasta.toISOString();

    const eventos = await this.findAll(filtros);
    const totalEventos = eventos.total;
    let eventosVerificados = 0;
    let eventosCorruptos = 0;
    let eventosModificados = 0;
    const detallesCorrupcion = [];

    for (const evento of eventos.data) {
      try {
        const hashCalculado = this.generarHashIntegridad(evento);
        if (hashCalculado === evento.hashIntegridad) {
          eventosVerificados++;
        } else {
          eventosCorruptos++;
          detallesCorrupcion.push({
            eventoId: evento.id,
            tipoProblema: 'HASH_INCORRECTO',
            descripcion: 'El hash de integridad no coincide con el calculado',
            fechaDeteccion: new Date()
          });
        }

        // Verificar modificaciones sospechosas
        if (evento.fechaActualizacion && evento.fechaActualizacion > evento.fechaCreacion) {
          if (!evento.actualizadoPor) {
            eventosModificados++;
            detallesCorrupcion.push({
              eventoId: evento.id,
              tipoProblema: 'MODIFICACION_NO_AUTORIZADA',
              descripcion: 'Evento modificado sin registro de usuario autorizado',
              fechaDeteccion: new Date()
            });
          }
        }
      } catch (error) {
        eventosCorruptos++;
        detallesCorrupcion.push({
          eventoId: evento.id,
          tipoProblema: 'ERROR_VERIFICACION',
          descripcion: `Error al verificar evento: ${error.message}`,
          fechaDeteccion: new Date()
        });
      }
    }

    const porcentajeIntegridad = totalEventos > 0 ? (eventosVerificados / totalEventos) * 100 : 100;

    const recomendaciones = [];
    if (porcentajeIntegridad < 95) {
      recomendaciones.push('Se recomienda investigar los eventos con problemas de integridad');
    }
    if (eventosModificados > 0) {
      recomendaciones.push('Revisar políticas de modificación de eventos de auditoría');
    }
    if (eventosCorruptos > totalEventos * 0.01) {
      recomendaciones.push('Considerar implementar respaldos más frecuentes');
    }

    return {
      totalEventos,
      eventosVerificados,
      eventosCorruptos,
      eventosModificados,
      porcentajeIntegridad,
      detallesCorrupcion,
      recomendaciones
    };
  }

  async archivarEventosAntiguos(): Promise<{ eventosArchivados: number; espacioLiberado: number }> {
    let eventosArchivados = 0;
    let espacioLiberado = 0;

    for (const [id, config] of this.configuracionesRetencion) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - config.diasRetencion);

      const eventosParaArchivar = await this.bitacoraRepository.find({
        where: {
          modulo: config.modulo,
          nivel: config.nivel,
          fechaEvento: LessThan(fechaLimite),
          archivar: false,
          ...(config.excepcionEventosCriticos ? { criticoCompliance: false } : {})
        }
      });

      for (const evento of eventosParaArchivar) {
        if (config.archivarAutomaticamente) {
          evento.archivar = true;
          evento.fechaArchivado = new Date();
          
          if (config.comprimirArchivados) {
            // Comprimir datos del evento
            evento.datosAdicionales = await this.comprimirDatos(evento.datosAdicionales);
          }

          await this.bitacoraRepository.save(evento);
          eventosArchivados++;
          espacioLiberado += this.estimarTamanoEvento(evento);
        }
      }
    }

    // Registrar operación de archivado
    await this.create({
      tipoEvento: TipoEvento.CONFIGURACION_CAMBIADA,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Archivado automático completado: ${eventosArchivados} eventos`,
      nivel: NivelEvento.INFO,
      datosAdicionales: { eventosArchivados, espacioLiberado }
    });

    return { eventosArchivados, espacioLiberado };
  }

  async remove(id: string, usuarioId: string, justificacion: string): Promise<void> {
    const evento = await this.findOne(id);

    // Validar permisos para eliminar
    if (!this.puedeEliminarEvento(usuarioId, evento)) {
      throw new ForbiddenException('No tiene permisos para eliminar eventos de auditoría');
    }

    // Registrar eliminación antes de eliminar
    await this.create({
      tipoEvento: TipoEvento.MODIFICACION_AUDITORIA,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Evento de auditoría eliminado: ${evento.id}`,
      nivel: NivelEvento.WARNING,
      usuarioId,
      criticoCompliance: true,
      datosAdicionales: {
        eventoEliminado: {
          id: evento.id,
          tipoEvento: evento.tipoEvento,
          descripcion: evento.descripcion,
          fechaEvento: evento.fechaEvento
        },
        justificacion
      }
    });

    // Soft delete
    evento.estado = EstadoEvento.ARCHIVADO;
    evento.archivar = true;
    evento.fechaArchivado = new Date();
    await this.bitacoraRepository.save(evento);
  }

  // Métodos privados auxiliares
  private generarHashIntegridad(evento: any): string {
    const datosParaHash = {
      tipoEvento: evento.tipoEvento,
      modulo: evento.modulo,
      descripcion: evento.descripcion,
      fechaEvento: evento.fechaEvento,
      usuarioId: evento.usuarioId,
      datosAdicionales: evento.datosAdicionales
    };

    return crypto.createHash('sha256')
      .update(JSON.stringify(datosParaHash))
      .digest('hex');
  }

  private async aplicarConfiguracionRetencion(evento: Bitacora): Promise<void> {
    const configId = `${evento.modulo}_${evento.nivel}`;
    const config = this.configuracionesRetencion.get(configId);
    
    if (config) {
      evento.nivelRetencion = config.diasRetencion;
    } else {
      // Configuración por defecto
      evento.nivelRetencion = this.obtenerRetencionPorDefecto(evento.nivel);
    }
  }

  private async procesarEventoCritico(evento: Bitacora): Promise<void> {
    // Marcar para procesamiento inmediato
    evento.estado = EstadoEvento.PROCESADO;
    evento.requiereNotificacion = true;

    // Adicionar contexto crítico
    if (!evento.datosAdicionales) {
      evento.datosAdicionales = {};
    }
    evento.datosAdicionales.procesadoComoCritico = true;
    evento.datosAdicionales.fechaProcesamiento = new Date();
  }

  private async evaluarAlertas(evento: Bitacora): Promise<void> {
    for (const [alertaId, alerta] of this.alertasActivas) {
      if (!alerta.activa) continue;

      if (await this.evaluarCondicionesAlerta(evento, alerta)) {
        await this.activarAlerta(alerta, evento);
      }
    }
  }

  private async evaluarCondicionesAlerta(evento: Bitacora, alerta: AlertaAuditoria): Promise<boolean> {
    const condiciones = alerta.condicionesDisparo;

    // Evaluar tipo de evento
    if (condiciones.tipoEvento && evento.tipoEvento !== condiciones.tipoEvento) {
      return false;
    }

    // Evaluar módulo
    if (condiciones.modulo && evento.modulo !== condiciones.modulo) {
      return false;
    }

    // Evaluar nivel
    if (condiciones.nivel && evento.nivel !== condiciones.nivel) {
      return false;
    }

    // Evaluar usuario
    if (condiciones.usuarioId && evento.usuarioId !== condiciones.usuarioId) {
      return false;
    }

    // Evaluar umbral de eventos en ventana de tiempo
    if (alerta.umbralEventos > 1) {
      const ahora = new Date();
      const ventanaInicio = new Date(ahora.getTime() - alerta.ventanaTiempo * 60 * 1000);
      
      const eventosEnVentana = await this.bitacoraRepository.count({
        where: {
          ...condiciones,
          fechaEvento: Between(ventanaInicio, ahora)
        }
      });

      return eventosEnVentana >= alerta.umbralEventos;
    }

    return true;
  }

  private async activarAlerta(alerta: AlertaAuditoria, evento: Bitacora): Promise<void> {
    const ahora = new Date();
    
    // Verificar supresión de duplicados
    if (alerta.ultimaActivacion) {
      const tiempoTranscurrido = ahora.getTime() - alerta.ultimaActivacion.getTime();
      if (tiempoTranscurrido < alerta.suprimirDuplicados * 60 * 1000) {
        return; // Suprimir alerta duplicada
      }
    }

    // Actualizar información de la alerta
    alerta.ultimaActivacion = ahora;
    alerta.numeroActivaciones++;

    // Generar mensaje de alerta
    const mensaje = this.generarMensajeAlerta(alerta, evento);

    // Enviar notificaciones
    await this.enviarNotificacionesAlerta(alerta, mensaje, evento);

    // Ejecutar acciones automáticas
    if (alerta.accionesAutomaticas) {
      await this.ejecutarAccionesAutomaticas(alerta.accionesAutomaticas, evento);
    }

    // Registrar activación de alerta
    await this.create({
      tipoEvento: TipoEvento.ALERTA_SEGURIDAD,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Alerta activada: ${alerta.nombreAlerta}`,
      nivel: alerta.nivelSeveridad,
      correlacionId: evento.correlacionId,
      datosAdicionales: {
        alertaId: alerta.id,
        eventoDisparo: evento.id,
        mensaje,
        numeroActivacion: alerta.numeroActivaciones
      }
    });
  }

  private inicializarConfiguracionesPorDefecto(): void {
    // Configuraciones de retención por defecto
    const configuracionesDefecto = [
      { modulo: ModuloEvento.AUTHENTICATION, nivel: NivelEvento.INFO, dias: 90 },
      { modulo: ModuloEvento.AUTHENTICATION, nivel: NivelEvento.WARNING, dias: 180 },
      { modulo: ModuloEvento.AUTHENTICATION, nivel: NivelEvento.ERROR, dias: 365 },
      { modulo: ModuloEvento.AUTHENTICATION, nivel: NivelEvento.CRITICAL, dias: 2555 }, // 7 años
      { modulo: ModuloEvento.SISTEMA, nivel: NivelEvento.CRITICAL, dias: 2555 },
      { modulo: ModuloEvento.BITACORA, nivel: NivelEvento.CRITICAL, dias: 2555 }
    ];

    configuracionesDefecto.forEach(config => {
      const id = `${config.modulo}_${config.nivel}`;
      this.configuracionesRetencion.set(id, {
        modulo: config.modulo,
        nivel: config.nivel,
        diasRetencion: config.dias,
        archivarAutomaticamente: true,
        comprimirArchivados: true,
        excepcionEventosCriticos: true,
        fechaCreacion: new Date(),
        actualizadoPor: 'SISTEMA'
      });
    });
  }

  private iniciarEvaluadorAlertas(): void {
    // Evaluar alertas cada minuto
    setInterval(async () => {
      try {
        await this.evaluarTodasLasAlertas();
      } catch (error) {
        console.error('Error evaluando alertas:', error);
      }
    }, 60000); // 1 minuto
  }

  private async evaluarTodasLasAlertas(): Promise<void> {
    const ahora = new Date();
    
    for (const [alertaId, alerta] of this.alertasActivas) {
      if (!alerta.activa) continue;

      // Verificar si es momento de evaluar
      const tiempoDesdeUltimaEvaluacion = alerta.ultimaEvaluacion 
        ? ahora.getTime() - alerta.ultimaEvaluacion.getTime()
        : Infinity;

      if (tiempoDesdeUltimaEvaluacion >= alerta.frecuenciaEvaluacion * 60 * 1000) {
        alerta.ultimaEvaluacion = ahora;
        
        // Evaluar condiciones de la alerta
        const eventosRecientes = await this.obtenerEventosParaAlerta(alerta);
        
        if (eventosRecientes.length >= alerta.umbralEventos) {
          await this.activarAlerta(alerta, eventosRecientes[0]);
        }
      }
    }
  }

  private async obtenerEventosParaAlerta(alerta: AlertaAuditoria): Promise<Bitacora[]> {
    const ahora = new Date();
    const ventanaInicio = new Date(ahora.getTime() - alerta.ventanaTiempo * 60 * 1000);

    return await this.bitacoraRepository.find({
      where: {
        ...alerta.condicionesDisparo,
        fechaEvento: Between(ventanaInicio, ahora)
      },
      order: { fechaEvento: 'DESC' }
    });
  }

  private obtenerRetencionPorDefecto(nivel: NivelEvento): number {
    switch (nivel) {
      case NivelEvento.CRITICAL: return 2555; // 7 años
      case NivelEvento.ERROR: return 365; // 1 año
      case NivelEvento.WARNING: return 180; // 6 meses
      case NivelEvento.INFO: return 90; // 3 meses
      case NivelEvento.DEBUG: return 30; // 1 mes
      default: return 90;
    }
  }

  // Métodos adicionales de utilidad
  private calcularTendenciaEventos(eventos: Bitacora[], dias: number): Array<{fecha: string; cantidad: number}> {
    const tendencia = [];
    const ahora = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date(ahora);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const eventosDelDia = eventos.filter(e => 
        e.fechaEvento.toISOString().split('T')[0] === fechaStr
      ).length;

      tendencia.push({ fecha: fechaStr, cantidad: eventosDelDia });
    }

    return tendencia;
  }

  private async calcularCumplimientoRetencion(): Promise<number> {
    // Simplificado - en implementación real sería más complejo
    return 95.5;
  }

  private puedeModificarBitacora(usuarioId: string, evento: Bitacora): boolean {
    // Implementar lógica de permisos
    return usuarioId !== undefined && !evento.criticoCompliance;
  }

  private async registrarModificacionAuditoria(evento: Bitacora, cambios: any, usuarioId: string): Promise<void> {
    await this.create({
      tipoEvento: TipoEvento.MODIFICACION_AUDITORIA,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Evento de auditoría modificado: ${evento.id}`,
      nivel: NivelEvento.WARNING,
      usuarioId,
      criticoCompliance: true,
      datosAdicionales: {
        eventoOriginal: evento,
        cambiosAplicados: cambios
      }
    });
  }

  private async verificarIntegridadEvento(evento: Bitacora): Promise<boolean> {
    if (!evento.hashIntegridad) return true; // Eventos antiguos sin hash
    
    const hashCalculado = this.generarHashIntegridad(evento);
    return hashCalculado === evento.hashIntegridad;
  }

  private async verificarIntegridadGeneral(): Promise<any> {
    // Verificación simplificada
    return {
      totalEventos: 1000,
      eventosVerificados: 995,
      porcentajeIntegridad: 99.5
    };
  }

  private calcularCumplimientoGeneral(estadisticas: EstadisticasAuditoria): number {
    // Cálculo simplificado basado en métricas
    let puntaje = 100;
    
    if (estadisticas.eventosCriticos > estadisticas.totalEventos * 0.05) {
      puntaje -= 10;
    }
    
    if (estadisticas.eventosErrores > estadisticas.totalEventos * 0.02) {
      puntaje -= 5;
    }

    return Math.max(puntaje, 0);
  }

  private identificarPrincipalesAmenazas(eventos: Bitacora[]): string[] {
    const amenazas = [];
    
    const loginsFallidos = eventos.filter(e => 
      e.tipoEvento === TipoEvento.LOGIN_FALLIDO
    ).length;
    
    if (loginsFallidos > 10) {
      amenazas.push('Alto número de intentos de login fallidos');
    }

    const erroresDeSeguridad = eventos.filter(e => 
      e.tipoEvento === TipoEvento.ALERTA_SEGURIDAD
    ).length;
    
    if (erroresDeSeguridad > 5) {
      amenazas.push('Múltiples alertas de seguridad detectadas');
    }

    return amenazas;
  }

  private generarRecomendacionesPrioritarias(estadisticas: EstadisticasAuditoria): string[] {
    const recomendaciones = [];
    
    if (estadisticas.eventosCriticos > 0) {
      recomendaciones.push('Revisar y resolver eventos críticos pendientes');
    }
    
    if (estadisticas.alertasActivas > 10) {
      recomendaciones.push('Evaluar configuración de alertas activas');
    }

    return recomendaciones;
  }

  private generarRecomendacionesDetalladas(estadisticas: EstadisticasAuditoria, eventos: Bitacora[]): any {
    return {
      seguridad: [
        'Implementar autenticación de dos factores',
        'Revisar políticas de contraseñas'
      ],
      rendimiento: [
        'Optimizar consultas de base de datos',
        'Configurar alertas de rendimiento'
      ],
      compliance: [
        'Actualizar políticas de retención',
        'Documentar procedimientos de auditoría'
      ]
    };
  }

  // Métodos de conversión y procesamiento
  private async generarReportePDF(reporte: any): Promise<Buffer> {
    // Implementación simplificada
    return Buffer.from(JSON.stringify(reporte));
  }

  private async generarReporteExcel(reporte: any): Promise<Buffer> {
    // Implementación simplificada
    return Buffer.from(JSON.stringify(reporte));
  }

  private async generarReporteCSV(reporte: any): Promise<string> {
    // Implementación simplificada
    return JSON.stringify(reporte);
  }

  private convertirACSV(datos: any[]): string {
    if (datos.length === 0) return '';
    
    const headers = Object.keys(datos[0]);
    const csvContent = [
      headers.join(','),
      ...datos.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    
    return csvContent;
  }

  private async convertirAExcel(datos: any[]): Promise<Buffer> {
    // Implementación simplificada - en producción usar librerías como xlsx
    return Buffer.from(JSON.stringify(datos));
  }

  private convertirAXML(datos: any[]): string {
    // Implementación simplificada
    return `<?xml version="1.0" encoding="UTF-8"?><root>${JSON.stringify(datos)}</root>`;
  }

  private async cifrarArchivo(contenido: any): Promise<Buffer> {
    // Implementación simplificada
    return Buffer.from(JSON.stringify(contenido));
  }

  private async comprimirArchivo(contenido: any): Promise<Buffer> {
    // Implementación simplificada
    return Buffer.from(JSON.stringify(contenido));
  }

  private calcularChecksum(contenido: any): string {
    return crypto.createHash('md5')
      .update(JSON.stringify(contenido))
      .digest('hex');
  }

  private filtrarDatosSensibles(eventos: Bitacora[]): Bitacora[] {
    return eventos.map(evento => ({
      ...evento,
      informacionSesion: evento.informacionSesion ? {
        ...evento.informacionSesion,
        direccionIp: '***FILTRADO***'
      } : undefined,
      datosAdicionales: evento.datosAdicionales ? {
        ...evento.datosAdicionales,
        // Filtrar campos sensibles
        password: undefined,
        token: undefined,
        secreto: undefined
      } : undefined
    }));
  }

  private async verificarPermisosExportacion(usuarioId: string): Promise<void> {
    // Implementar verificación de permisos especiales
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['rol']
    });

    if (!usuario?.rol?.permisos?.includes('auditoria:export_sensitive' as any)) {
      throw new ForbiddenException('No tiene permisos para exportar datos sensibles');
    }
  }

  private puedeEliminarEvento(usuarioId: string, evento: Bitacora): boolean {
    // Solo usuarios con permisos especiales pueden eliminar eventos críticos
    return !evento.criticoCompliance;
  }

  private estimarTamanoEvento(evento: Bitacora): number {
    // Estimación simplificada del tamaño en bytes
    return JSON.stringify(evento).length;
  }

  private async comprimirDatos(datos: any): Promise<any> {
    // Implementación simplificada de compresión
    return { compressed: true, data: JSON.stringify(datos) };
  }

  private generarMensajeAlerta(alerta: AlertaAuditoria, evento: Bitacora): string {
    return alerta.plantillaMensaje || 
      `Alerta activada: ${alerta.nombreAlerta}\nEvento: ${evento.descripcion}\nFecha: ${evento.fechaEvento}`;
  }

  private async enviarNotificacionesAlerta(alerta: AlertaAuditoria, mensaje: string, evento: Bitacora): Promise<void> {
    // Implementar envío de notificaciones por diferentes canales
    console.log(`Enviando alerta: ${mensaje}`);
  }

  private async ejecutarAccionesAutomaticas(acciones: Array<any>, evento: Bitacora): Promise<void> {
    // Implementar ejecución de acciones automáticas
    for (const accion of acciones) {
      console.log(`Ejecutando acción automática: ${accion.tipo}`);
    }
  }

  private async procesarNotificacion(evento: Bitacora): Promise<void> {
    // Implementar procesamiento de notificaciones
    console.log(`Procesando notificación para evento: ${evento.id}`);
  }

  private async actualizarMetricas(evento: Bitacora): Promise<void> {
    // Implementar actualización de métricas en tiempo real
    console.log(`Actualizando métricas para evento: ${evento.tipoEvento}`);
  }
}
