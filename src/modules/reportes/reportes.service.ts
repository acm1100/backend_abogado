import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { 
  CreateReporteDto, 
  TipoReporte, 
  FormatoReporte, 
  FrecuenciaReporte,
  EstadoReporte 
} from './dto/create-reporte.dto';
import { 
  UpdateReporteDto,
  EjecutarReporteDto,
  ProgramarReporteDto,
  CompartirReporteDto,
  ExportarReporteDto
} from './dto/update-reporte.dto';

// Simulamos las entidades que necesitamos
interface Reporte {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoReporte;
  formato: FormatoReporte;
  frecuencia: FrecuenciaReporte;
  estado: EstadoReporte;
  campos: any[];
  filtros?: any[];
  agruparPor?: string[];
  ordenamiento?: any[];
  rangoFechas?: any;
  graficos?: any[];
  consultaPersonalizada?: string;
  parametros?: any;
  programacion?: any;
  configuracionFormato?: any;
  etiquetas?: string[];
  esPublico: boolean;
  permiteEdicion: boolean;
  configuracionCache?: any;
  usuariosAcceso?: string[];
  rolesAcceso?: string[];
  metadatos?: any;
  numeroEjecuciones: number;
  fechaUltimaEjecucion?: Date;
  mensajeError?: string;
  empresaId: string;
  creadoPorId: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface FiltrosReportes {
  tipo?: TipoReporte[];
  formato?: FormatoReporte[];
  estado?: EstadoReporte[];
  etiquetas?: string[];
  soloPublicos?: boolean;
  soloPersonales?: boolean;
  buscar?: string;
  creadoPorId?: string;
}

export interface ResultadoEjecucion {
  exito: boolean;
  datos?: any[];
  graficos?: any[];
  resumen?: any;
  tiempoEjecucion?: number;
  totalRegistros?: number;
  error?: string;
  metadatos?: any;
}

export interface EstadisticasReportes {
  totalReportes: number;
  reportesActivos: number;
  reportesProgramados: number;
  ejecucionesHoy: number;
  distribucionPorTipo: { [key: string]: number };
  distribucionPorFormato: { [key: string]: number };
  masEjecutados: Array<{ id: string; nombre: string; ejecuciones: number }>;
  recientes: Array<{ id: string; nombre: string; fechaEjecucion: Date }>;
}

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    // @InjectRepository(Reporte)
    // private reporteRepository: Repository<Reporte>,
    private dataSource: DataSource,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Crear nuevo reporte
   */
  async create(createReporteDto: CreateReporteDto, empresaId: string, usuarioId: string): Promise<any> {
    try {
      this.logger.log(`Creando reporte: ${createReporteDto.nombre}`);

      // Validar configuración del reporte
      await this.validarConfiguracionReporte(createReporteDto);

      const reporte = {
        id: this.generateId(),
        nombre: createReporteDto.nombre,
        descripcion: createReporteDto.descripcion,
        tipo: createReporteDto.tipo,
        formato: createReporteDto.formato,
        frecuencia: createReporteDto.frecuencia || FrecuenciaReporte.UNICA_VEZ,
        estado: EstadoReporte.ACTIVO,
        campos: createReporteDto.campos,
        filtros: createReporteDto.filtros || [],
        agruparPor: createReporteDto.agruparPor,
        ordenamiento: createReporteDto.ordenamiento,
        rangoFechas: createReporteDto.rangoFechas,
        graficos: createReporteDto.graficos || [],
        consultaPersonalizada: createReporteDto.consultaPersonalizada,
        parametros: createReporteDto.parametros,
        programacion: createReporteDto.programacion,
        configuracionFormato: createReporteDto.configuracionFormato || this.getConfiguracionFormatoDefecto(),
        etiquetas: createReporteDto.etiquetas || [],
        esPublico: createReporteDto.esPublico || false,
        permiteEdicion: createReporteDto.permiteEdicion || false,
        configuracionCache: createReporteDto.configuracionCache,
        usuariosAcceso: createReporteDto.usuariosAcceso || [],
        rolesAcceso: createReporteDto.rolesAcceso || [],
        metadatos: createReporteDto.metadatos,
        numeroEjecuciones: 0,
        empresaId,
        creadoPorId: usuarioId,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

      // Simular guardado en base de datos
      // const savedReporte = await this.reporteRepository.save(reporte);

      // Programar ejecución si es necesario
      if (reporte.programacion && reporte.frecuencia !== FrecuenciaReporte.UNICA_VEZ) {
        await this.programarEjecucion(reporte.id, reporte.programacion, reporte.frecuencia);
      }

      this.logger.log(`Reporte creado exitosamente: ${reporte.id}`);
      return reporte;

    } catch (error) {
      this.logger.error(`Error al crear reporte: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al crear reporte: ${error.message}`);
    }
  }

  /**
   * Obtener reportes con filtros
   */
  async findAll(
    empresaId: string,
    filtros: FiltrosReportes = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      this.logger.log(`Obteniendo reportes para empresa: ${empresaId}`);

      // Simular consulta con filtros
      let reportes = await this.aplicarFiltros(empresaId, filtros);

      // Aplicar paginación
      const total = reportes.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      reportes = reportes.slice(offset, offset + limit);

      return {
        data: reportes,
        total,
        page,
        totalPages
      };

    } catch (error) {
      this.logger.error(`Error al obtener reportes: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener reportes: ${error.message}`);
    }
  }

  /**
   * Obtener reporte por ID
   */
  async findOne(id: string, empresaId: string): Promise<any> {
    try {
      const reporte = await this.buscarPorId(id, empresaId);

      if (!reporte) {
        throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
      }

      return reporte;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al obtener reporte: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener reporte: ${error.message}`);
    }
  }

  /**
   * Actualizar reporte
   */
  async update(id: string, updateReporteDto: UpdateReporteDto, empresaId: string): Promise<any> {
    try {
      const reporte = await this.findOne(id, empresaId);

      // Validar cambios si se actualiza la configuración
      if (updateReporteDto.campos || updateReporteDto.filtros) {
        await this.validarConfiguracionReporte(updateReporteDto as any);
      }

      // Actualizar campos
      Object.assign(reporte, {
        ...updateReporteDto,
        fechaActualizacion: new Date()
      });

      // Si se cambia la programación, actualizar trabajos programados
      if (updateReporteDto.programacion) {
        await this.reprogramarEjecucion(id, updateReporteDto.programacion, reporte.frecuencia);
      }

      // Simular guardado
      // await this.reporteRepository.save(reporte);

      return reporte;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar reporte: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al actualizar reporte: ${error.message}`);
    }
  }

  /**
   * Eliminar reporte
   */
  async remove(id: string, empresaId: string): Promise<void> {
    try {
      const reporte = await this.findOne(id, empresaId);

      // Cancelar trabajos programados
      await this.cancelarEjecucionesProgramadas(id);

      // Simular eliminación
      // await this.reporteRepository.remove(reporte);

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar reporte: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al eliminar reporte: ${error.message}`);
    }
  }

  /**
   * Ejecutar reporte
   */
  async ejecutar(id: string, ejecutarDto: EjecutarReporteDto, empresaId: string): Promise<ResultadoEjecucion> {
    const tiempoInicio = Date.now();
    
    try {
      this.logger.log(`Ejecutando reporte: ${id}`);

      const reporte = await this.findOne(id, empresaId);

      if (reporte.estado !== EstadoReporte.ACTIVO) {
        throw new BadRequestException('Solo se pueden ejecutar reportes activos');
      }

      // Construir consulta
      const consulta = await this.construirConsulta(reporte, ejecutarDto);

      // Ejecutar consulta
      const datos = await this.ejecutarConsulta(consulta, reporte.configuracionCache);

      // Procesar datos según configuración
      const datosProcesados = await this.procesarDatos(datos, reporte);

      // Generar gráficos si es necesario
      const graficos = reporte.graficos?.length > 0 ? 
        await this.generarGraficos(datosProcesados, reporte.graficos) : [];

      // Actualizar estadísticas del reporte
      await this.actualizarEstadisticasEjecucion(id);

      const tiempoEjecucion = Date.now() - tiempoInicio;

      const resultado: ResultadoEjecucion = {
        exito: true,
        datos: datosProcesados,
        graficos,
        resumen: this.generarResumenEjecucion(datosProcesados),
        tiempoEjecucion,
        totalRegistros: datosProcesados.length,
        metadatos: {
          fechaEjecucion: new Date(),
          parametrosUsados: ejecutarDto.parametros,
          rangoFechas: ejecutarDto.rangoFechas
        }
      };

      // Enviar por email si se solicita
      if (ejecutarDto.enviarPorEmail) {
        await this.enviarReportePorEmail(reporte, resultado, ejecutarDto.emailsAdicionales);
      }

      return resultado;

    } catch (error) {
      const tiempoEjecucion = Date.now() - tiempoInicio;
      
      this.logger.error(`Error al ejecutar reporte: ${error.message}`, error.stack);

      // Actualizar reporte con error
      await this.registrarErrorEjecucion(id, error.message);

      return {
        exito: false,
        error: error.message,
        tiempoEjecucion,
        metadatos: {
          fechaEjecucion: new Date(),
          parametrosUsados: ejecutarDto.parametros
        }
      };
    }
  }

  /**
   * Programar reporte
   */
  async programar(id: string, programarDto: ProgramarReporteDto, empresaId: string): Promise<any> {
    try {
      const reporte = await this.findOne(id, empresaId);

      // Actualizar configuración de programación
      await this.update(id, { programacion: programarDto.programacion }, empresaId);

      // Programar ejecución
      if (programarDto.activarInmediatamente) {
        await this.programarEjecucion(id, programarDto.programacion, reporte.frecuencia);
      }

      return { success: true, programacion: programarDto.programacion };

    } catch (error) {
      this.logger.error(`Error al programar reporte: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al programar reporte: ${error.message}`);
    }
  }

  /**
   * Compartir reporte
   */
  async compartir(id: string, compartirDto: CompartirReporteDto, empresaId: string): Promise<any> {
    try {
      const reporte = await this.findOne(id, empresaId);

      // Actualizar permisos de acceso
      const updateDto: UpdateReporteDto = {
        usuariosAcceso: [...(reporte.usuariosAcceso || []), ...compartirDto.usuariosIds],
        rolesAcceso: compartirDto.rolesIds ? 
          [...(reporte.rolesAcceso || []), ...compartirDto.rolesIds] : 
          reporte.rolesAcceso
      };

      await this.update(id, updateDto, empresaId);

      // Enviar notificaciones (simular)
      await this.enviarNotificacionesCompartir(reporte, compartirDto);

      return { success: true };

    } catch (error) {
      this.logger.error(`Error al compartir reporte: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al compartir reporte: ${error.message}`);
    }
  }

  /**
   * Exportar reporte
   */
  async exportar(id: string, exportarDto: ExportarReporteDto, empresaId: string): Promise<{
    contenido: any;
    formato: string;
    nombre: string;
  }> {
    try {
      const reporte = await this.findOne(id, empresaId);

      // Ejecutar reporte para obtener datos
      const resultado = await this.ejecutar(id, { parametros: exportarDto.filtros }, empresaId);

      if (!resultado.exito) {
        throw new BadRequestException('Error al obtener datos para exportación');
      }

      // Generar contenido según formato
      const contenido = await this.generarContenidoExportacion(
        resultado.datos!,
        resultado.graficos,
        exportarDto,
        reporte
      );

      const nombreArchivo = `${reporte.nombre}_${new Date().toISOString().split('T')[0]}`;

      return {
        contenido,
        formato: exportarDto.formato,
        nombre: nombreArchivo
      };

    } catch (error) {
      this.logger.error(`Error al exportar reporte: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al exportar reporte: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas
   */
  async obtenerEstadisticas(empresaId: string): Promise<EstadisticasReportes> {
    try {
      // Simular consultas estadísticas
      return {
        totalReportes: 28,
        reportesActivos: 22,
        reportesProgramados: 8,
        ejecucionesHoy: 15,
        distribucionPorTipo: {
          [TipoReporte.FINANCIERO]: 8,
          [TipoReporte.OPERACIONAL]: 6,
          [TipoReporte.CLIENTES]: 5,
          [TipoReporte.CASOS]: 4,
          [TipoReporte.FACTURACION]: 3,
          [TipoReporte.DASHBOARD]: 2
        },
        distribucionPorFormato: {
          [FormatoReporte.PDF]: 12,
          [FormatoReporte.EXCEL]: 10,
          [FormatoReporte.CSV]: 4,
          [FormatoReporte.HTML]: 2
        },
        masEjecutados: [
          { id: '1', nombre: 'Facturación Mensual', ejecuciones: 45 },
          { id: '2', nombre: 'Estado de Casos', ejecuciones: 32 },
          { id: '3', nombre: 'Productividad por Usuario', ejecuciones: 28 }
        ],
        recientes: [
          { id: '4', nombre: 'Gastos del Mes', fechaEjecucion: new Date() },
          { id: '5', nombre: 'Clientes Nuevos', fechaEjecucion: new Date() }
        ]
      };

    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Métodos privados auxiliares

  private generateId(): string {
    return `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getConfiguracionFormatoDefecto(): any {
    return {
      tituloReporte: '',
      logoEmpresa: true,
      orientacion: 'portrait',
      tamañoPapel: 'A4',
      margenes: {
        superior: 2.5,
        inferior: 2.5,
        izquierdo: 2.5,
        derecho: 2.5
      }
    };
  }

  private async validarConfiguracionReporte(config: any): Promise<void> {
    if (!config.campos || config.campos.length === 0) {
      throw new BadRequestException('El reporte debe tener al menos un campo');
    }

    // Validar consulta personalizada si existe
    if (config.consultaPersonalizada) {
      await this.validarConsultaSQL(config.consultaPersonalizada);
    }
  }

  private async validarConsultaSQL(consulta: string): Promise<void> {
    // Validaciones básicas de seguridad SQL
    const patronesProhibidos = [
      /DROP\s+/i,
      /DELETE\s+/i,
      /UPDATE\s+/i,
      /INSERT\s+/i,
      /TRUNCATE\s+/i,
      /ALTER\s+/i,
      /CREATE\s+/i
    ];

    for (const patron of patronesProhibidos) {
      if (patron.test(consulta)) {
        throw new BadRequestException('Consulta SQL contiene operaciones no permitidas');
      }
    }
  }

  private async construirConsulta(reporte: any, ejecutarDto: EjecutarReporteDto): Promise<string> {
    if (reporte.consultaPersonalizada) {
      return this.procesarConsultaPersonalizada(reporte.consultaPersonalizada, ejecutarDto);
    }

    return this.construirConsultaDinamica(reporte, ejecutarDto);
  }

  private procesarConsultaPersonalizada(consulta: string, ejecutarDto: EjecutarReporteDto): string {
    let consultaProcesada = consulta;

    // Reemplazar parámetros
    if (ejecutarDto.parametros) {
      Object.entries(ejecutarDto.parametros).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        consultaProcesada = consultaProcesada.replace(new RegExp(placeholder, 'g'), String(value));
      });
    }

    return consultaProcesada;
  }

  private construirConsultaDinamica(reporte: any, ejecutarDto: EjecutarReporteDto): string {
    // Construcción dinámica basada en configuración
    const campos = reporte.campos.map(c => `${c.nombre} AS ${c.alias}`).join(', ');
    
    let consulta = `SELECT ${campos} FROM tabla_base WHERE empresa_id = '${reporte.empresaId}'`;

    // Aplicar filtros
    if (reporte.filtros?.length > 0) {
      const filtros = reporte.filtros.map(f => `${f.campo} ${f.operador} '${f.valor}'`).join(' AND ');
      consulta += ` AND ${filtros}`;
    }

    // Aplicar agrupamiento
    if (reporte.agruparPor?.length > 0) {
      consulta += ` GROUP BY ${reporte.agruparPor.join(', ')}`;
    }

    // Aplicar ordenamiento
    if (reporte.ordenamiento?.length > 0) {
      const orden = reporte.ordenamiento.map(o => `${o.campo} ${o.direccion}`).join(', ');
      consulta += ` ORDER BY ${orden}`;
    }

    return consulta;
  }

  private async ejecutarConsulta(consulta: string, configCache?: any): Promise<any[]> {
    // Verificar caché si está habilitado
    if (configCache?.habilitado) {
      const datosCache = await this.obtenerDeCache(consulta);
      if (datosCache) {
        return datosCache;
      }
    }

    // Simular ejecución de consulta
    const datos = [
      { id: 1, nombre: 'Dato 1', valor: 100 },
      { id: 2, nombre: 'Dato 2', valor: 200 },
      { id: 3, nombre: 'Dato 3', valor: 150 }
    ];

    // Guardar en caché si está habilitado
    if (configCache?.habilitado) {
      await this.guardarEnCache(consulta, datos, configCache.tiempoVidaMinutos);
    }

    return datos;
  }

  private procesarDatos(datos: any[], reporte: any): any[] {
    // Aplicar transformaciones según configuración
    return datos;
  }

  private async generarGraficos(datos: any[], configuracionGraficos: any[]): Promise<any[]> {
    // Simular generación de gráficos
    return configuracionGraficos.map(config => ({
      tipo: config.tipo,
      titulo: config.titulo,
      datos: datos.slice(0, 10) // Limitar datos para gráfico
    }));
  }

  private generarResumenEjecucion(datos: any[]): any {
    return {
      totalRegistros: datos.length,
      fechaEjecucion: new Date(),
      estadisticas: {
        promedio: datos.reduce((sum, item) => sum + (item.valor || 0), 0) / datos.length || 0,
        maximo: Math.max(...datos.map(item => item.valor || 0)),
        minimo: Math.min(...datos.map(item => item.valor || 0))
      }
    };
  }

  private async generarContenidoExportacion(
    datos: any[], 
    graficos: any[], 
    exportarDto: ExportarReporteDto, 
    reporte: any
  ): Promise<any> {
    switch (exportarDto.formato) {
      case 'csv':
        return this.generarCSV(datos);
      case 'excel':
        return this.generarExcel(datos, graficos, exportarDto.incluirGraficos);
      case 'pdf':
        return this.generarPDF(datos, graficos, reporte);
      case 'json':
        return JSON.stringify({ datos, graficos, reporte: reporte.nombre });
      default:
        throw new BadRequestException('Formato de exportación no soportado');
    }
  }

  private generarCSV(datos: any[]): string {
    if (datos.length === 0) return '';

    const headers = Object.keys(datos[0]).join(',');
    const rows = datos.map(item => Object.values(item).join(','));
    
    return [headers, ...rows].join('\n');
  }

  private generarExcel(datos: any[], graficos: any[], incluirGraficos: boolean): any {
    // Simular generación de Excel
    return { tipo: 'excel', datos, graficos: incluirGraficos ? graficos : [] };
  }

  private generarPDF(datos: any[], graficos: any[], reporte: any): any {
    // Simular generación de PDF
    return { tipo: 'pdf', contenido: 'PDF content', reporte: reporte.nombre };
  }

  // Métodos auxiliares continuados...

  private async programarEjecucion(reporteId: string, programacion: any, frecuencia: FrecuenciaReporte): Promise<void> {
    const cronExpression = this.convertirFrecuenciaACron(frecuencia, programacion);
    
    const job = new CronJob(cronExpression, async () => {
      await this.ejecutarProgramado(reporteId);
    });

    this.schedulerRegistry.addCronJob(`reporte-${reporteId}`, job);
    job.start();
  }

  private convertirFrecuenciaACron(frecuencia: FrecuenciaReporte, programacion: any): string {
    const { horaEjecucion, diasSemana, diaMes } = programacion;
    const [hora, minuto] = horaEjecucion.split(':');

    switch (frecuencia) {
      case FrecuenciaReporte.DIARIO:
        return `${minuto} ${hora} * * *`;
      case FrecuenciaReporte.SEMANAL:
        return `${minuto} ${hora} * * ${diasSemana?.[0] || 1}`;
      case FrecuenciaReporte.MENSUAL:
        return `${minuto} ${hora} ${diaMes || 1} * *`;
      default:
        return `${minuto} ${hora} * * *`;
    }
  }

  private async ejecutarProgramado(reporteId: string): Promise<void> {
    try {
      // Simular ejecución programada
      this.logger.log(`Ejecutando reporte programado: ${reporteId}`);
    } catch (error) {
      this.logger.error(`Error en ejecución programada: ${error.message}`);
    }
  }

  private async reprogramarEjecucion(reporteId: string, programacion: any, frecuencia: FrecuenciaReporte): Promise<void> {
    await this.cancelarEjecucionesProgramadas(reporteId);
    await this.programarEjecucion(reporteId, programacion, frecuencia);
  }

  private async cancelarEjecucionesProgramadas(reporteId: string): Promise<void> {
    try {
      this.schedulerRegistry.deleteCronJob(`reporte-${reporteId}`);
    } catch (error) {
      // El trabajo puede no existir
    }
  }

  private async actualizarEstadisticasEjecucion(reporteId: string): Promise<void> {
    // Simular actualización de estadísticas
  }

  private async registrarErrorEjecucion(reporteId: string, error: string): Promise<void> {
    // Simular registro de error
  }

  private async enviarReportePorEmail(reporte: any, resultado: ResultadoEjecucion, emailsAdicionales?: string[]): Promise<void> {
    // Simular envío por email
  }

  private async enviarNotificacionesCompartir(reporte: any, compartirDto: CompartirReporteDto): Promise<void> {
    // Simular envío de notificaciones
  }

  private async obtenerDeCache(consulta: string): Promise<any[] | null> {
    // Simular obtención de caché
    return null;
  }

  private async guardarEnCache(consulta: string, datos: any[], tiempoVidaMinutos: number): Promise<void> {
    // Simular guardado en caché
  }

  private async aplicarFiltros(empresaId: string, filtros: FiltrosReportes): Promise<any[]> {
    // Simular aplicación de filtros
    return [];
  }

  private async buscarPorId(id: string, empresaId: string): Promise<any> {
    // Simular búsqueda
    return null;
  }
}
