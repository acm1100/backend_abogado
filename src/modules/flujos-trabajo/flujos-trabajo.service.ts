import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between, MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { 
  CreateFlujoTrabajoDto, 
  UpdateFlujoTrabajoDto,
  CambiarEstadoFlujoDto,
  EjectutarFlujoDto,
  ActualizarPasoDto,
  DuplicarFlujoDto,
  ImportarFlujoDto,
  FiltrosFlujoTrabajoDto,
  EjecucionFlujoDto,
  EstadisticasFlujoDto,
  MetricasFlujoDto,
  EstadoFlujoTrabajo,
  TipoFlujoTrabajo,
  TipoAccionPaso,
  HistorialPasoDto,
  PasoFlujoDto,
  AccionPasoDto,
  CondicionPasoDto
} from './dto';
import { FlujoTrabajo } from '../../entities/flujo_trabajo.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Caso } from '../../entities/caso.entity';
import { Gasto } from '../../entities/gasto.entity';
import { Facturacion } from '../../entities/facturacion.entity';
import { Documentacion } from '../../entities/documentacion.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Cliente } from '../../entities/cliente.entity';

@Injectable()
export class FlujosTrabajoService {
  private readonly logger = new Logger(FlujosTrabajoService.name);
  private readonly ejecucionesActivas = new Map<string, EjecucionFlujoDto>();

  constructor(
    @InjectRepository(FlujoTrabajo)
    private readonly flujoTrabajoRepository: Repository<FlujoTrabajo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Caso)
    private readonly casoRepository: Repository<Caso>,
    @InjectRepository(Gasto)
    private readonly gastoRepository: Repository<Gasto>,
    @InjectRepository(Facturacion)
    private readonly facturacionRepository: Repository<Facturacion>,
    @InjectRepository(Documentacion)
    private readonly documentacionRepository: Repository<Documentacion>,
    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  /**
   * Crear un nuevo flujo de trabajo
   */
  async create(
    createFlujoTrabajoDto: CreateFlujoTrabajoDto,
    usuarioId: string,
    empresaId: string,
  ): Promise<FlujoTrabajo> {
    this.logger.log(`Creando flujo de trabajo "${createFlujoTrabajoDto.nombre}" para empresa ${empresaId}`);

    // Validar estructura del flujo
    await this.validarEstructuraFlujo(createFlujoTrabajoDto);

    // Validar pasos y dependencias
    await this.validarPasosFlujo(createFlujoTrabajoDto.pasos);

    // Validar triggers
    if (createFlujoTrabajoDto.triggers) {
      await this.validarTriggers(createFlujoTrabajoDto.triggers, empresaId);
    }

    // Validar usuarios y roles asignados
    await this.validarAsignaciones(createFlujoTrabajoDto, empresaId);

    const flujo = this.flujoTrabajoRepository.create({
      ...createFlujoTrabajoDto,
      usuarioCreador: usuarioId,
      empresaId,
      estado: EstadoFlujoTrabajo.BORRADOR,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      version: createFlujoTrabajoDto.version || '1.0.0',
    });

    const flujoGuardado = await this.flujoTrabajoRepository.save(flujo);

    // Registrar en auditoría
    await this.registrarAuditoria(flujoGuardado.id, 'CREACION', usuarioId, {
      descripcion: 'Flujo de trabajo creado',
      tipo: createFlujoTrabajoDto.tipo,
      totalPasos: createFlujoTrabajoDto.pasos.length,
    });

    this.logger.log(`Flujo de trabajo ${flujoGuardado.id} creado exitosamente`);
    return this.findOne(flujoGuardado.id, empresaId);
  }

  /**
   * Obtener todos los flujos de trabajo con filtros
   */
  async findAll(
    filtros: FiltrosFlujoTrabajoDto,
    empresaId: string,
    usuarioId?: string,
  ) {
    this.logger.log(`Obteniendo flujos de trabajo con filtros: ${JSON.stringify(filtros)}`);

    const query = this.flujoTrabajoRepository
      .createQueryBuilder('flujo')
      .leftJoinAndSelect('flujo.usuarioCreador', 'creador')
      .leftJoinAndSelect('flujo.ejecuciones', 'ejecuciones')
      .where('flujo.empresa_id = :empresaId', { empresaId });

    // Aplicar filtros
    this.aplicarFiltros(query, filtros);

    // Ordenar por fecha de creación descendente
    query.orderBy('flujo.fechaCreacion', 'DESC');

    const flujos = await query.getMany();

    // Enriquecer con estadísticas
    const flujosConStats = await Promise.all(
      flujos.map(async (flujo) => ({
        ...flujo,
        estadisticas: await this.calcularEstadisticasFlujo(flujo.id),
      }))
    );

    return {
      flujos: flujosConStats,
      total: flujos.length,
    };
  }

  /**
   * Obtener un flujo específico
   */
  async findOne(id: string, empresaId: string): Promise<FlujoTrabajo> {
    const flujo = await this.flujoTrabajoRepository.findOne({
      where: { id, empresaId },
      relations: [
        'usuarioCreador',
        'ejecuciones',
        'ejecuciones.pasos',
        'administradores',
      ],
    });

    if (!flujo) {
      throw new NotFoundException(`Flujo de trabajo con ID ${id} no encontrado`);
    }

    return flujo;
  }

  /**
   * Actualizar un flujo de trabajo
   */
  async update(
    id: string,
    updateFlujoTrabajoDto: UpdateFlujoTrabajoDto,
    usuarioId: string,
    empresaId: string,
  ): Promise<FlujoTrabajo> {
    this.logger.log(`Actualizando flujo de trabajo ${id} por usuario ${usuarioId}`);

    const flujo = await this.findOne(id, empresaId);

    // Validar permisos de edición
    await this.validarPermisosEdicion(flujo, usuarioId);

    // Si hay ejecuciones activas, solo permitir ciertos cambios
    const ejecucionesActivas = await this.obtenerEjecucionesActivas(id);
    if (ejecucionesActivas.length > 0) {
      await this.validarCambiosConEjecucionesActivas(updateFlujoTrabajoDto, ejecucionesActivas);
    }

    const datosOriginales = {
      nombre: flujo.nombre,
      estado: flujo.estado,
      version: flujo.version,
      totalPasos: flujo.pasos?.length || 0,
    };

    // Validar nueva estructura si se están actualizando pasos
    if (updateFlujoTrabajoDto.pasos) {
      await this.validarPasosFlujo(updateFlujoTrabajoDto.pasos);
    }

    // Incrementar versión si hay cambios estructurales
    let nuevaVersion = flujo.version;
    if (this.requiresVersionIncrement(updateFlujoTrabajoDto)) {
      nuevaVersion = this.incrementarVersion(flujo.version);
    }

    Object.assign(flujo, updateFlujoTrabajoDto, {
      version: nuevaVersion,
      fechaActualizacion: new Date(),
    });

    const flujoActualizado = await this.flujoTrabajoRepository.save(flujo);

    // Registrar en auditoría
    await this.registrarAuditoria(id, 'ACTUALIZACION', usuarioId, {
      descripcion: updateFlujoTrabajoDto.motivoActualizacion || 'Flujo actualizado',
      datosOriginales,
      datosNuevos: updateFlujoTrabajoDto,
      versionAnterior: datosOriginales.version,
      versionNueva: nuevaVersion,
    });

    this.logger.log(`Flujo de trabajo ${id} actualizado exitosamente`);
    return this.findOne(id, empresaId);
  }

  /**
   * Cambiar estado de un flujo
   */
  async cambiarEstado(
    id: string,
    cambiarEstadoDto: CambiarEstadoFlujoDto,
    usuarioId: string,
    empresaId: string,
  ): Promise<FlujoTrabajo> {
    this.logger.log(`Cambiando estado de flujo ${id} a ${cambiarEstadoDto.estado}`);

    const flujo = await this.findOne(id, empresaId);
    const estadoOriginal = flujo.estado;

    // Validar transición de estado
    await this.validarTransicionEstado(flujo, cambiarEstadoDto.estado);

    // Validar permisos para el cambio de estado
    await this.validarPermisosEstado(flujo, cambiarEstadoDto.estado, usuarioId);

    // Aplicar lógica específica según el nuevo estado
    await this.procesarCambioEstado(flujo, cambiarEstadoDto, usuarioId);

    flujo.estado = cambiarEstadoDto.estado;
    flujo.fechaActualizacion = new Date();

    if (cambiarEstadoDto.fechaVigencia) {
      flujo.fechaInicio = new Date(cambiarEstadoDto.fechaVigencia);
    }

    const flujoActualizado = await this.flujoTrabajoRepository.save(flujo);

    // Registrar en auditoría
    await this.registrarAuditoria(id, 'CAMBIO_ESTADO', usuarioId, {
      descripcion: cambiarEstadoDto.motivo || `Estado cambiado de ${estadoOriginal} a ${cambiarEstadoDto.estado}`,
      estadoOriginal,
      estadoNuevo: cambiarEstadoDto.estado,
      observaciones: cambiarEstadoDto.observaciones,
    });

    this.logger.log(`Estado de flujo ${id} cambiado exitosamente`);
    return flujoActualizado;
  }

  /**
   * Ejecutar un flujo de trabajo
   */
  async ejecutar(
    id: string,
    ejecutarDto: EjectutarFlujoDto,
    usuarioId: string,
    empresaId: string,
  ): Promise<EjecucionFlujoDto> {
    this.logger.log(`Ejecutando flujo de trabajo ${id}`);

    const flujo = await this.findOne(id, empresaId);

    // Validar que el flujo esté activo
    if (flujo.estado !== EstadoFlujoTrabajo.ACTIVO) {
      throw new BadRequestException('Solo se pueden ejecutar flujos en estado ACTIVO');
    }

    // Validar permisos de ejecución
    await this.validarPermisosEjecucion(flujo, usuarioId);

    // Validar condiciones de ejecución si las hay
    if (flujo.triggers) {
      await this.validarCondicionesEjecucion(flujo, ejecutarDto);
    }

    // Crear ejecución
    const ejecucion: EjecucionFlujoDto = {
      id: this.generarIdEjecucion(),
      flujoTrabajoId: id,
      entidadId: ejecutarDto.entidadId,
      tipoEntidad: ejecutarDto.tipoEntidad,
      estado: 'INICIADO',
      pasoActual: 1,
      datosContexto: ejecutarDto.datosContexto || {},
      usuarioEjecutor: ejecutarDto.usuarioEjecutor || usuarioId,
      fechaInicio: new Date(),
      historialPasos: [],
    };

    // Guardar en memoria para seguimiento
    this.ejecucionesActivas.set(ejecucion.id, ejecucion);

    // Ejecutar inmediatamente o programar
    if (ejecutarDto.ejecutarInmediatamente !== false) {
      await this.ejecutarPasosSiguientes(ejecucion, flujo);
    } else if (ejecutarDto.fechaProgramada) {
      await this.programarEjecucion(ejecucion, new Date(ejecutarDto.fechaProgramada));
    }

    // Registrar en auditoría
    await this.registrarAuditoria(id, 'EJECUCION_INICIADA', usuarioId, {
      descripcion: 'Ejecución de flujo iniciada',
      ejecucionId: ejecucion.id,
      entidadId: ejecutarDto.entidadId,
      tipoEntidad: ejecutarDto.tipoEntidad,
    });

    this.logger.log(`Ejecución ${ejecucion.id} de flujo ${id} iniciada`);
    return ejecucion;
  }

  /**
   * Duplicar un flujo de trabajo
   */
  async duplicar(
    id: string,
    duplicarDto: DuplicarFlujoDto,
    usuarioId: string,
    empresaId: string,
  ): Promise<FlujoTrabajo> {
    this.logger.log(`Duplicando flujo de trabajo ${id}`);

    const flujoOriginal = await this.findOne(id, empresaId);

    // Validar permisos
    await this.validarPermisosEdicion(flujoOriginal, usuarioId);

    // Crear copia
    const nuevoFlujo: CreateFlujoTrabajoDto = {
      nombre: duplicarDto.nuevoNombre,
      descripcion: duplicarDto.nuevaDescripcion || `Copia de: ${flujoOriginal.descripcion}`,
      tipo: flujoOriginal.tipo,
      pasos: this.filtrarPasos(flujoOriginal.pasos, duplicarDto.pasosExcluir),
      triggers: duplicarDto.copiarTriggers ? flujoOriginal.triggers : [],
      prioridad: flujoOriginal.prioridad,
      activo: duplicarDto.activarInmediatamente,
      configuracion: { ...flujoOriginal.configuracion },
      etiquetas: [...(flujoOriginal.etiquetas || []), 'copia'],
      version: '1.0.0',
    };

    const flujoCreado = await this.create(nuevoFlujo, usuarioId, empresaId);

    // Registrar en auditoría
    await this.registrarAuditoria(flujoCreado.id, 'DUPLICACION', usuarioId, {
      descripcion: 'Flujo duplicado',
      flujoOriginalId: id,
      nombreOriginal: flujoOriginal.nombre,
    });

    return flujoCreado;
  }

  /**
   * Obtener estadísticas de flujos
   */
  async obtenerEstadisticas(empresaId: string): Promise<EstadisticasFlujoDto> {
    this.logger.log(`Obteniendo estadísticas de flujos para empresa ${empresaId}`);

    const flujos = await this.flujoTrabajoRepository.find({
      where: { empresaId },
      relations: ['ejecuciones'],
    });

    const estadisticas: EstadisticasFlujoDto = {
      totalFlujos: flujos.length,
      flujosActivos: flujos.filter(f => f.estado === EstadoFlujoTrabajo.ACTIVO).length,
      flujosPausados: flujos.filter(f => f.estado === EstadoFlujoTrabajo.PAUSADO).length,
      totalEjecuciones: flujos.reduce((sum, f) => sum + (f.ejecuciones?.length || 0), 0),
      ejecucionesCompletadas: 0,
      ejecucionesFallidas: 0,
      tiempoPromedioEjecucion: 0,
      tasaExito: 0,
      flujosPopulares: [],
      estadisticasPorTipo: {},
      rendimientoPorPaso: [],
    };

    // Calcular métricas adicionales
    await this.calcularMetricasAvanzadas(estadisticas, flujos);

    return estadisticas;
  }

  /**
   * Obtener métricas de un flujo específico
   */
  async obtenerMetricas(id: string, empresaId: string): Promise<MetricasFlujoDto> {
    const flujo = await this.findOne(id, empresaId);
    
    const metricas: MetricasFlujoDto = {
      flujoId: id,
      nombre: flujo.nombre,
      tipo: flujo.tipo,
      estado: flujo.estado,
      totalEjecuciones: flujo.ejecuciones?.length || 0,
      ejecucionesExitosas: 0,
      ejecucionesFallidas: 0,
      tasaExito: 0,
      tiempoPromedioEjecucion: 0,
      tiempoMinimoEjecucion: 0,
      tiempoMaximoEjecucion: 0,
      usuariosMasActivos: [],
      pasosProblematicos: [],
      tendenciasUltimos30Dias: [],
    };

    await this.calcularMetricasEspecificas(metricas, flujo);

    return metricas;
  }

  /**
   * Eliminar flujo (soft delete)
   */
  async remove(id: string, usuarioId: string, empresaId: string): Promise<void> {
    this.logger.log(`Eliminando flujo de trabajo ${id} por usuario ${usuarioId}`);

    const flujo = await this.findOne(id, empresaId);

    // Validar que se puede eliminar
    const ejecucionesActivas = await this.obtenerEjecucionesActivas(id);
    if (ejecucionesActivas.length > 0) {
      throw new BadRequestException('No se puede eliminar un flujo con ejecuciones activas');
    }

    // Validar permisos
    await this.validarPermisosEdicion(flujo, usuarioId);

    flujo.activo = false;
    flujo.estado = EstadoFlujoTrabajo.ARCHIVADO;
    flujo.fechaActualizacion = new Date();

    await this.flujoTrabajoRepository.save(flujo);

    // Registrar en auditoría
    await this.registrarAuditoria(id, 'ELIMINACION', usuarioId, {
      descripcion: 'Flujo de trabajo eliminado (soft delete)',
    });

    this.logger.log(`Flujo de trabajo ${id} eliminado exitosamente`);
  }

  /**
   * Tarea programada para ejecutar flujos automáticos
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async procesarFlujosAutomaticos() {
    try {
      await this.ejecutarFlujosPrograma();
      await this.procesarTimeouts();
      await this.procesarReintentos();
    } catch (error) {
      this.logger.error('Error en procesamiento automático de flujos', error);
    }
  }

  // Métodos privados de validación y utilidades

  private async validarEstructuraFlujo(flujo: CreateFlujoTrabajoDto): Promise<void> {
    // Validar que el nombre no esté duplicado
    const existente = await this.flujoTrabajoRepository.findOne({
      where: { nombre: flujo.nombre, activo: true },
    });

    if (existente) {
      throw new ConflictException(`Ya existe un flujo activo con el nombre "${flujo.nombre}"`);
    }

    // Validar fechas
    if (flujo.fechaInicio && flujo.fechaFin) {
      if (new Date(flujo.fechaInicio) >= new Date(flujo.fechaFin)) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }
  }

  private async validarPasosFlujo(pasos: PasoFlujoDto[]): Promise<void> {
    // Validar orden secuencial
    const ordenes = pasos.map(p => p.orden).sort((a, b) => a - b);
    for (let i = 0; i < ordenes.length; i++) {
      if (ordenes[i] !== i + 1) {
        throw new BadRequestException(`Los pasos deben tener orden secuencial. Falta el paso ${i + 1}`);
      }
    }

    // Validar referencias entre pasos
    for (const paso of pasos) {
      if (paso.pasoSiguienteExito && !pasos.find(p => p.orden === paso.pasoSiguienteExito)) {
        throw new BadRequestException(`Paso ${paso.orden} referencia un paso siguiente inexistente: ${paso.pasoSiguienteExito}`);
      }
      if (paso.pasoSiguienteFallo && !pasos.find(p => p.orden === paso.pasoSiguienteFallo)) {
        throw new BadRequestException(`Paso ${paso.orden} referencia un paso de fallo inexistente: ${paso.pasoSiguienteFallo}`);
      }
    }

    // Validar acciones de cada paso
    for (const paso of pasos) {
      await this.validarAccionesPaso(paso.acciones);
    }
  }

  private async validarAccionesPaso(acciones: AccionPasoDto[]): Promise<void> {
    for (const accion of acciones) {
      switch (accion.tipo) {
        case TipoAccionPaso.APROBACION:
          if (!accion.configuracion?.aprobadores?.length) {
            throw new BadRequestException('Las acciones de aprobación requieren al menos un aprobador');
          }
          break;
        case TipoAccionPaso.NOTIFICACION:
          if (!accion.configuracion?.destinatarios?.length) {
            throw new BadRequestException('Las acciones de notificación requieren destinatarios');
          }
          break;
        case TipoAccionPaso.INTEGRACION:
          if (!accion.configuracion?.endpoint) {
            throw new BadRequestException('Las acciones de integración requieren un endpoint');
          }
          break;
      }
    }
  }

  private async validarTriggers(triggers: any[], empresaId: string): Promise<void> {
    // Validar configuración de triggers
    for (const trigger of triggers) {
      if (trigger.configuracion?.cron) {
        // Validar expresión cron
        try {
          // Aquí se podría usar una librería para validar cron
        } catch (error) {
          throw new BadRequestException(`Expresión cron inválida: ${trigger.configuracion.cron}`);
        }
      }
    }
  }

  private async validarAsignaciones(flujo: CreateFlujoTrabajoDto, empresaId: string): Promise<void> {
    // Validar usuarios asignados
    for (const paso of flujo.pasos) {
      if (paso.usuariosAsignados?.length) {
        const usuarios = await this.usuarioRepository.find({
          where: { id: In(paso.usuariosAsignados), empresaId },
        });
        if (usuarios.length !== paso.usuariosAsignados.length) {
          throw new BadRequestException(`Algunos usuarios asignados al paso "${paso.nombre}" no existen`);
        }
      }
    }
  }

  private async ejecutarPasosSiguientes(ejecucion: EjecucionFlujoDto, flujo: FlujoTrabajo): Promise<void> {
    ejecucion.estado = 'EN_PROGRESO';
    
    while (ejecucion.pasoActual <= flujo.pasos.length && ejecucion.estado === 'EN_PROGRESO') {
      const paso = flujo.pasos.find(p => p.orden === ejecucion.pasoActual);
      
      if (!paso) {
        ejecucion.estado = 'FALLIDO';
        ejecucion.errores = [`Paso ${ejecucion.pasoActual} no encontrado`];
        break;
      }

      try {
        const resultadoPaso = await this.ejecutarPaso(paso, ejecucion, flujo);
        
        // Agregar al historial
        ejecucion.historialPasos.push({
          pasoId: paso.nombre, // En una implementación real sería un UUID
          nombre: paso.nombre,
          orden: paso.orden,
          estado: resultadoPaso.exitoso ? 'COMPLETADO' : 'FALLIDO',
          fechaInicio: new Date(),
          fechaCompletion: new Date(),
          resultado: resultadoPaso.resultado,
          comentarios: resultadoPaso.comentarios,
          datosEntrada: resultadoPaso.datosEntrada,
          datosSalida: resultadoPaso.datosSalida,
          errores: resultadoPaso.errores,
          tiempoEjecucion: resultadoPaso.tiempoEjecucion,
        });

        if (resultadoPaso.exitoso) {
          // Continuar al siguiente paso
          ejecucion.pasoActual = paso.pasoSiguienteExito || (ejecucion.pasoActual + 1);
        } else {
          // Ir al paso de fallo o terminar
          if (paso.pasoSiguienteFallo) {
            ejecucion.pasoActual = paso.pasoSiguienteFallo;
          } else {
            ejecucion.estado = 'FALLIDO';
            break;
          }
        }
      } catch (error) {
        this.logger.error(`Error ejecutando paso ${paso.nombre}`, error);
        ejecucion.estado = 'FALLIDO';
        ejecucion.errores = [error.message];
        break;
      }
    }

    // Si llegamos al final exitosamente
    if (ejecucion.pasoActual > flujo.pasos.length && ejecucion.estado === 'EN_PROGRESO') {
      ejecucion.estado = 'COMPLETADO';
      ejecucion.fechaCompletion = new Date();
    }

    // Actualizar en memoria
    this.ejecucionesActivas.set(ejecucion.id, ejecucion);
  }

  private async ejecutarPaso(paso: PasoFlujoDto, ejecucion: EjecucionFlujoDto, flujo: FlujoTrabajo): Promise<any> {
    const inicioEjecucion = Date.now();
    
    try {
      // Evaluar condiciones del paso
      if (paso.condiciones?.length) {
        const condicionesCumplidas = await this.evaluarCondiciones(paso.condiciones, ejecucion);
        if (!condicionesCumplidas) {
          return {
            exitoso: true,
            resultado: 'OMITIDO',
            comentarios: 'Paso omitido por condiciones no cumplidas',
            tiempoEjecucion: Date.now() - inicioEjecucion,
          };
        }
      }

      // Ejecutar acciones del paso
      const resultados = [];
      for (const accion of paso.acciones) {
        const resultadoAccion = await this.ejecutarAccion(accion, ejecucion, flujo);
        resultados.push(resultadoAccion);
      }

      const tiempoEjecucion = Date.now() - inicioEjecucion;
      const exitoso = resultados.every(r => r.exitoso);

      return {
        exitoso,
        resultado: exitoso ? 'COMPLETADO' : 'FALLIDO',
        comentarios: `Paso ejecutado con ${resultados.length} acciones`,
        datosEntrada: ejecucion.datosContexto,
        datosSalida: resultados,
        tiempoEjecucion,
        errores: exitoso ? [] : resultados.filter(r => !r.exitoso).map(r => r.error),
      };
    } catch (error) {
      return {
        exitoso: false,
        resultado: 'ERROR',
        comentarios: 'Error durante la ejecución del paso',
        tiempoEjecucion: Date.now() - inicioEjecucion,
        errores: [error.message],
      };
    }
  }

  private async ejecutarAccion(accion: AccionPasoDto, ejecucion: EjecucionFlujoDto, flujo: FlujoTrabajo): Promise<any> {
    switch (accion.tipo) {
      case TipoAccionPaso.APROBACION:
        return await this.ejecutarAprobacion(accion, ejecucion);
      
      case TipoAccionPaso.NOTIFICACION:
        return await this.ejecutarNotificacion(accion, ejecucion);
      
      case TipoAccionPaso.ASIGNACION:
        return await this.ejecutarAsignacion(accion, ejecucion);
      
      case TipoAccionPaso.DOCUMENTO:
        return await this.ejecutarGeneracionDocumento(accion, ejecucion);
      
      case TipoAccionPaso.INTEGRACION:
        return await this.ejecutarIntegracion(accion, ejecucion);
      
      case TipoAccionPaso.ESPERA:
        return await this.ejecutarEspera(accion, ejecucion);
      
      default:
        return { exitoso: true, resultado: 'Acción no implementada' };
    }
  }

  private async ejecutarAprobacion(accion: AccionPasoDto, ejecucion: EjecucionFlujoDto): Promise<any> {
    // Implementar lógica de aprobación
    // Por ahora retornamos éxito simulado
    return {
      exitoso: true,
      resultado: 'Aprobación solicitada',
      datos: {
        aprobadores: accion.configuracion?.aprobadores,
        timeoutHoras: accion.configuracion?.timeoutHoras,
      },
    };
  }

  private async ejecutarNotificacion(accion: AccionPasoDto, ejecucion: EjecucionFlujoDto): Promise<any> {
    // Implementar envío de notificaciones
    return {
      exitoso: true,
      resultado: 'Notificación enviada',
      datos: {
        destinatarios: accion.configuracion?.destinatarios,
        canal: accion.configuracion?.canal,
      },
    };
  }

  private async ejecutarAsignacion(accion: AccionPasoDto, ejecucion: EjecucionFlujoDto): Promise<any> {
    // Implementar lógica de asignación
    return { exitoso: true, resultado: 'Asignación realizada' };
  }

  private async ejecutarGeneracionDocumento(accion: AccionPasoDto, ejecucion: EjecucionFlujoDto): Promise<any> {
    // Implementar generación de documentos
    return { exitoso: true, resultado: 'Documento generado' };
  }

  private async ejecutarIntegracion(accion: AccionPasoDto, ejecucion: EjecucionFlujoDto): Promise<any> {
    // Implementar llamadas a sistemas externos
    return { exitoso: true, resultado: 'Integración ejecutada' };
  }

  private async ejecutarEspera(accion: AccionPasoDto, ejecucion: EjecucionFlujoDto): Promise<any> {
    // Implementar lógica de espera
    const duracion = accion.configuracion?.duracionHoras || 1;
    // En una implementación real, esto se manejaría con un scheduler
    return { exitoso: true, resultado: `Esperando ${duracion} horas` };
  }

  private async evaluarCondiciones(condiciones: CondicionPasoDto[], ejecucion: EjecucionFlujoDto): Promise<boolean> {
    // Implementar evaluación de condiciones
    // Por ahora retornamos true para todas las condiciones
    return true;
  }

  private aplicarFiltros(query: SelectQueryBuilder<FlujoTrabajo>, filtros: FiltrosFlujoTrabajoDto): void {
    if (filtros.tipo) {
      query.andWhere('flujo.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros.estado) {
      query.andWhere('flujo.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.activo !== undefined) {
      query.andWhere('flujo.activo = :activo', { activo: filtros.activo });
    }

    if (filtros.prioridad) {
      query.andWhere('flujo.prioridad = :prioridad', { prioridad: filtros.prioridad });
    }

    if (filtros.usuarioCreador) {
      query.andWhere('flujo.usuarioCreador = :usuarioCreador', { usuarioCreador: filtros.usuarioCreador });
    }

    if (filtros.etiquetas?.length) {
      query.andWhere('flujo.etiquetas && :etiquetas', { etiquetas: filtros.etiquetas });
    }
  }

  private async calcularEstadisticasFlujo(flujoId: string): Promise<any> {
    // Implementar cálculos de estadísticas específicas del flujo
    return {
      totalEjecuciones: 0,
      ejecucionesExitosas: 0,
      tasaExito: 0,
      tiempoPromedioEjecucion: 0,
    };
  }

  private async calcularMetricasAvanzadas(estadisticas: EstadisticasFlujoDto, flujos: FlujoTrabajo[]): Promise<void> {
    // Implementar cálculos de métricas avanzadas
  }

  private async calcularMetricasEspecificas(metricas: MetricasFlujoDto, flujo: FlujoTrabajo): Promise<void> {
    // Implementar cálculos de métricas específicas
  }

  private async obtenerEjecucionesActivas(flujoId: string): Promise<EjecucionFlujoDto[]> {
    return Array.from(this.ejecucionesActivas.values())
      .filter(e => e.flujoTrabajoId === flujoId && e.estado === 'EN_PROGRESO');
  }

  private async validarPermisosEdicion(flujo: FlujoTrabajo, usuarioId: string): Promise<void> {
    // Implementar validación de permisos
    if (flujo.usuarioCreador !== usuarioId && !flujo.administradores?.includes(usuarioId)) {
      // throw new ForbiddenException('No tiene permisos para editar este flujo');
    }
  }

  private async validarCambiosConEjecucionesActivas(updateDto: UpdateFlujoTrabajoDto, ejecuciones: EjecucionFlujoDto[]): Promise<void> {
    // Solo permitir cambios menores si hay ejecuciones activas
    if (updateDto.pasos) {
      throw new BadRequestException('No se pueden modificar los pasos mientras hay ejecuciones activas');
    }
  }

  private requiresVersionIncrement(updateDto: UpdateFlujoTrabajoDto): boolean {
    return !!(updateDto.pasos || updateDto.triggers);
  }

  private incrementarVersion(versionActual: string): string {
    const partes = versionActual.split('.');
    const patch = parseInt(partes[2] || '0') + 1;
    return `${partes[0]}.${partes[1]}.${patch}`;
  }

  private async validarTransicionEstado(flujo: FlujoTrabajo, nuevoEstado: EstadoFlujoTrabajo): Promise<void> {
    // Implementar validación de transiciones válidas entre estados
    const transicionesValidas: Record<EstadoFlujoTrabajo, EstadoFlujoTrabajo[]> = {
      [EstadoFlujoTrabajo.BORRADOR]: [EstadoFlujoTrabajo.ACTIVO, EstadoFlujoTrabajo.ARCHIVADO],
      [EstadoFlujoTrabajo.ACTIVO]: [EstadoFlujoTrabajo.PAUSADO, EstadoFlujoTrabajo.COMPLETADO, EstadoFlujoTrabajo.ARCHIVADO],
      [EstadoFlujoTrabajo.PAUSADO]: [EstadoFlujoTrabajo.ACTIVO, EstadoFlujoTrabajo.ARCHIVADO],
      [EstadoFlujoTrabajo.COMPLETADO]: [EstadoFlujoTrabajo.ARCHIVADO],
      [EstadoFlujoTrabajo.CANCELADO]: [EstadoFlujoTrabajo.ARCHIVADO],
      [EstadoFlujoTrabajo.ARCHIVADO]: [],
    };

    const estadosPermitidos = transicionesValidas[flujo.estado] || [];
    
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de ${flujo.estado} a ${nuevoEstado}`
      );
    }
  }

  private async validarPermisosEstado(flujo: FlujoTrabajo, nuevoEstado: EstadoFlujoTrabajo, usuarioId: string): Promise<void> {
    // Implementar validación de permisos específicos para cambios de estado
  }

  private async procesarCambioEstado(flujo: FlujoTrabajo, cambioEstado: CambiarEstadoFlujoDto, usuarioId: string): Promise<void> {
    // Implementar lógica específica según el nuevo estado
    switch (cambioEstado.estado) {
      case EstadoFlujoTrabajo.ACTIVO:
        // Validar que el flujo esté completo y listo para activarse
        break;
      case EstadoFlujoTrabajo.PAUSADO:
        // Pausar ejecuciones activas
        break;
      case EstadoFlujoTrabajo.ARCHIVADO:
        // Cancelar ejecuciones pendientes
        break;
    }
  }

  private async validarPermisosEjecucion(flujo: FlujoTrabajo, usuarioId: string): Promise<void> {
    // Implementar validación de permisos de ejecución
  }

  private async validarCondicionesEjecucion(flujo: FlujoTrabajo, ejecutarDto: EjectutarFlujoDto): Promise<void> {
    // Implementar validación de condiciones específicas
  }

  private generarIdEjecucion(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async programarEjecucion(ejecucion: EjecucionFlujoDto, fecha: Date): Promise<void> {
    // Implementar programación de ejecución
    this.logger.log(`Ejecución ${ejecucion.id} programada para ${fecha}`);
  }

  private filtrarPasos(pasos: PasoFlujoDto[], pasosExcluir?: number[]): PasoFlujoDto[] {
    if (!pasosExcluir?.length) return pasos;
    return pasos.filter(p => !pasosExcluir.includes(p.orden));
  }

  private async ejecutarFlujosPrograma(): Promise<void> {
    // Implementar ejecución de flujos programados
  }

  private async procesarTimeouts(): Promise<void> {
    // Implementar procesamiento de timeouts
  }

  private async procesarReintentos(): Promise<void> {
    // Implementar procesamiento de reintentos
  }

  private async registrarAuditoria(flujoId: string, accion: string, usuarioId: string, detalles: any): Promise<void> {
    // Implementar registro de auditoría
    this.logger.log(`Auditoría - Flujo: ${flujoId}, Acción: ${accion}, Usuario: ${usuarioId}`, detalles);
  }
}
