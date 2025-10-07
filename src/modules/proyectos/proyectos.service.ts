import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { 
  CreateProyectoDto, 
  EstadoProyecto, 
  PrioridadProyecto,
  TipoProyecto 
} from './dto/create-proyecto.dto';
import { 
  UpdateProyectoDto,
  CambiarEstadoProyectoDto,
  AsignarRecursoDto,
  ActualizarHitoDto,
  ActualizarPresupuestoDto,
  ReportarAvanceDto,
  CerrarProyectoDto
} from './dto/update-proyecto.dto';
import { Proyecto, HitoProyecto } from '../../entities/proyecto.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Usuario } from '../../entities/usuario.entity';

export interface FiltrosProyecto {
  clienteId?: string;
  casoId?: string;
  estado?: EstadoProyecto;
  tipo?: TipoProyecto;
  prioridad?: PrioridadProyecto;
  fechaInicioDesde?: string;
  fechaInicioHasta?: string;
  responsableId?: string;
  presupuestoMin?: number;
  presupuestoMax?: number;
  soloAtrasados?: boolean;
  soloVencimientos?: boolean;
  busqueda?: string;
}

export interface EstadisticasProyecto {
  totalProyectos: number;
  porEstado: Record<EstadoProyecto, number>;
  porTipo: Record<TipoProyecto, number>;
  porPrioridad: Record<PrioridadProyecto, number>;
  presupuestoTotal: number;
  presupuestoEjecutado: number;
  porcentajeAvancePromedio: number;
  proyectosAtrasados: number;
  proyectosEnRiesgo: number;
  ingresosPotenciales: number;
}

export interface ResumenFinanciero {
  presupuestoTotal: number;
  presupuestoAprobado: number;
  presupuestoEjecutado: number;
  costosIncurridos: number;
  ingresosGenerados: number;
  margenProyectado: number;
  margenReal: number;
  horasPresupuestadas: number;
  horasEjecutadas: number;
  tarifaPromedioEjecutada: number;
}

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto)
    private proyectoRepository: Repository<Proyecto>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Caso)
    private casoRepository: Repository<Caso>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createProyectoDto: CreateProyectoDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    // Validar que el cliente existe y pertenece a la empresa
    const cliente = await this.clienteRepository.findOne({
      where: { 
        id: createProyectoDto.clienteId,
        empresaId: empresaId
      }
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado o no pertenece a la empresa');
    }

    // Validar caso si se proporciona
    if (createProyectoDto.casoId) {
      const caso = await this.casoRepository.findOne({
        where: { 
          id: createProyectoDto.casoId,
          empresaId: empresaId,
          clienteId: createProyectoDto.clienteId
        }
      });

      if (!caso) {
        throw new NotFoundException('Caso no encontrado o no pertenece al cliente especificado');
      }
    }

    // Validar responsable principal (usar el primer recurso)
    const responsablePrincipalId = createProyectoDto.recursos?.[0]?.usuarioId;
    const responsable = responsablePrincipalId ? await this.usuarioRepository.findOne({
      where: { 
        id: responsablePrincipalId,
        empresaId: empresaId,
        activo: true
      }
    }) : null;

    if (responsablePrincipalId && !responsable) {
      throw new NotFoundException('Responsable principal no encontrado o no pertenece a la empresa');
    }

    // Generar código único del proyecto
    const codigoProyecto = await this.generarCodigoProyecto(empresaId, createProyectoDto.tipo);

    // Calcular fechas automáticas si no se proporcionan
    const fechaInicio = createProyectoDto.fechaInicio ? new Date(createProyectoDto.fechaInicio) : new Date();
    const fechaFinEstimada = createProyectoDto.fechaFinEstimada ? 
      new Date(createProyectoDto.fechaFinEstimada) : 
      this.calcularFechaFinEstimada(fechaInicio, createProyectoDto.tipo);

    // Validar recursos si se proporcionan
    if (createProyectoDto.recursos && createProyectoDto.recursos.length > 0) {
      const usuarioIds = createProyectoDto.recursos.map(r => r.usuarioId);
      const usuarios = await this.usuarioRepository.find({
        where: { 
          id: In(usuarioIds),
          empresaId: empresaId,
          activo: true
        }
      });

      if (usuarios.length !== usuarioIds.length) {
        throw new BadRequestException('Uno o más usuarios asignados no son válidos');
      }
    }

    // Crear el proyecto
    const proyecto = this.proyectoRepository.create({
      nombre: createProyectoDto.nombre,
      descripcion: createProyectoDto.descripcion,
      codigo: codigoProyecto,
      empresaId: empresaId,
      clienteId: createProyectoDto.clienteId,
      casoId: createProyectoDto.casoId,
      tipo: createProyectoDto.tipo,
      prioridad: createProyectoDto.prioridad,
      fechaInicio: fechaInicio,
      fechaFinEstimada: fechaFinEstimada,
      responsableId: responsablePrincipalId,
      estado: createProyectoDto.estado || EstadoProyecto.PLANIFICACION,
      creadoPorId: usuarioId,
      porcentajeAvance: 0,
      // Inicializar métricas
      horasPresupuestadas: this.calcularHorasPresupuestadas(createProyectoDto),
      horasEjecutadas: 0,
      costosIncurridos: 0,
      ingresosGenerados: 0,
    });

    const proyectoGuardado = await this.proyectoRepository.save(proyecto);

    // Registrar el evento de creación
    await this.registrarEvento(proyectoGuardado.id, 'PROYECTO_CREADO', usuarioId, {
      tipo: createProyectoDto.tipo,
      cliente: cliente.nombre,
      responsable: responsable.nombre,
      presupuesto: createProyectoDto.presupuesto?.presupuestoInicial
    });

    return this.findOne(proyectoGuardado.id, empresaId);
  }

  async findAll(filtros: FiltrosProyecto, empresaId: string, page: number = 1, limit: number = 20) {
    const queryBuilder = this.proyectoRepository.createQueryBuilder('proyecto')
      .leftJoinAndSelect('proyecto.cliente', 'cliente')
      .leftJoinAndSelect('proyecto.caso', 'caso')
      .leftJoinAndSelect('proyecto.responsablePrincipal', 'responsable')
      .where('proyecto.empresaId = :empresaId', { empresaId });

    // Aplicar filtros
    if (filtros.clienteId) {
      queryBuilder.andWhere('proyecto.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    if (filtros.casoId) {
      queryBuilder.andWhere('proyecto.casoId = :casoId', { casoId: filtros.casoId });
    }

    if (filtros.estado) {
      queryBuilder.andWhere('proyecto.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.tipo) {
      queryBuilder.andWhere('proyecto.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros.prioridad) {
      queryBuilder.andWhere('proyecto.prioridad = :prioridad', { prioridad: filtros.prioridad });
    }

    if (filtros.responsableId) {
      queryBuilder.andWhere('proyecto.responsablePrincipalId = :responsableId', { responsableId: filtros.responsableId });
    }

    if (filtros.fechaInicioDesde) {
      queryBuilder.andWhere('proyecto.fechaInicio >= :fechaDesde', { fechaDesde: filtros.fechaInicioDesde });
    }

    if (filtros.fechaInicioHasta) {
      queryBuilder.andWhere('proyecto.fechaInicio <= :fechaHasta', { fechaHasta: filtros.fechaInicioHasta });
    }

    if (filtros.presupuestoMin) {
      queryBuilder.andWhere('proyecto.presupuesto_inicial >= :presupuestoMin', { presupuestoMin: filtros.presupuestoMin });
    }

    if (filtros.presupuestoMax) {
      queryBuilder.andWhere('proyecto.presupuesto_inicial <= :presupuestoMax', { presupuestoMax: filtros.presupuestoMax });
    }

    if (filtros.soloAtrasados) {
      queryBuilder.andWhere('proyecto.fechaFinEstimada < :hoy AND proyecto.estado NOT IN (:...estadosFinales)', {
        hoy: new Date(),
        estadosFinales: [EstadoProyecto.COMPLETADO, EstadoProyecto.CANCELADO, EstadoProyecto.CERRADO]
      });
    }

    if (filtros.soloVencimientos) {
      const proximasSemana = new Date();
      proximasSemana.setDate(proximasSemana.getDate() + 7);
      
      queryBuilder.andWhere('proyecto.fechaFinEstimada <= :proximasSemana AND proyecto.estado NOT IN (:...estadosFinales)', {
        proximasSemana,
        estadosFinales: [EstadoProyecto.COMPLETADO, EstadoProyecto.CANCELADO, EstadoProyecto.CERRADO]
      });
    }

    if (filtros.busqueda) {
      queryBuilder.andWhere(
        '(proyecto.nombre ILIKE :busqueda OR proyecto.descripcion ILIKE :busqueda OR proyecto.codigo ILIKE :busqueda OR cliente.nombre ILIKE :busqueda)',
        { busqueda: `%${filtros.busqueda}%` }
      );
    }

    // Paginación
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('proyecto.fechaCreacion', 'DESC');

    const [proyectos, total] = await queryBuilder.getManyAndCount();

    return {
      data: proyectos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string, empresaId: string): Promise<Proyecto> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id, empresaId },
      relations: [
        'cliente',
        'caso',
        'responsablePrincipal',
        'empresa'
      ]
    });

    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return proyecto;
  }

  async update(id: string, updateProyectoDto: UpdateProyectoDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    const proyecto = await this.findOne(id, empresaId);

    // Validar que el proyecto se puede actualizar
    if (proyecto.estado === EstadoProyecto.CERRADO) {
      throw new BadRequestException('No se puede actualizar un proyecto cerrado');
    }

    // Validaciones específicas según el tipo de actualización
    if (updateProyectoDto.estado && updateProyectoDto.estado !== proyecto.estado) {
      await this.validarCambioEstado(proyecto, updateProyectoDto.estado);
    }

    // Validar nuevos recursos si se proporcionan
    if (updateProyectoDto.recursos) {
      const usuarioIds = updateProyectoDto.recursos
        .filter(r => r.usuarioId)
        .map(r => r.usuarioId);
      
      if (usuarioIds.length > 0) {
        const usuarios = await this.usuarioRepository.find({
          where: { 
            id: In(usuarioIds),
            empresaId: empresaId,
            activo: true
          }
        });

        if (usuarios.length !== usuarioIds.length) {
          throw new BadRequestException('Uno o más usuarios asignados no son válidos');
        }
      }
    }

    // Actualizar datos del proyecto
    Object.assign(proyecto, updateProyectoDto);
    proyecto.fechaActualizacion = new Date();
    proyecto.actualizadoPor = usuarioId;

    // Recalcular métricas si es necesario
    if (updateProyectoDto.presupuesto || updateProyectoDto.recursos) {
      proyecto.horasPresupuestadas = this.calcularHorasPresupuestadas({
        presupuesto: updateProyectoDto.presupuesto || proyecto.presupuesto,
        recursos: updateProyectoDto.recursos || proyecto.recursos
      });
    }

    const proyectoActualizado = await this.proyectoRepository.save(proyecto);

    // Registrar evento de actualización
    await this.registrarEvento(id, 'PROYECTO_ACTUALIZADO', usuarioId, {
      cambios: updateProyectoDto,
      motivo: updateProyectoDto.motivoActualizacion
    });

    return this.findOne(id, empresaId);
  }

  async cambiarEstado(id: string, cambiarEstadoDto: CambiarEstadoProyectoDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    const proyecto = await this.findOne(id, empresaId);

    // Validar transición de estado
    await this.validarCambioEstado(proyecto, cambiarEstadoDto.estado);

    const estadoAnterior = proyecto.estado;
    proyecto.estado = cambiarEstadoDto.estado;
    proyecto.fechaActualizacion = new Date();
    proyecto.actualizadoPor = usuarioId;

    // Actualizar fechas automáticamente si se solicita
    if (cambiarEstadoDto.actualizarFechas) {
      switch (cambiarEstadoDto.estado) {
        case EstadoProyecto.EN_PROGRESO:
          if (!proyecto.fechaInicioReal) {
            proyecto.fechaInicioReal = new Date();
          }
          break;
        case EstadoProyecto.COMPLETADO:
        case EstadoProyecto.CERRADO:
          proyecto.fechaFinReal = new Date();
          proyecto.porcentajeAvance = 100;
          break;
        case EstadoProyecto.PAUSADO:
          proyecto.fechaPausa = new Date();
          break;
        case EstadoProyecto.CANCELADO:
          proyecto.fechaCancelacion = new Date();
          break;
      }
    }

    const proyectoActualizado = await this.proyectoRepository.save(proyecto);

    // Registrar evento de cambio de estado
    await this.registrarEvento(id, 'ESTADO_CAMBIADO', usuarioId, {
      estadoAnterior,
      estadoNuevo: cambiarEstadoDto.estado,
      motivo: cambiarEstadoDto.motivo,
      observaciones: cambiarEstadoDto.observaciones,
      fechaVigencia: cambiarEstadoDto.fechaVigencia
    });

    // Ejecutar acciones automáticas según el nuevo estado
    await this.ejecutarAccionesEstado(proyectoActualizado, estadoAnterior, usuarioId);

    return this.findOne(id, empresaId);
  }

  async asignarRecurso(id: string, asignarRecursoDto: AsignarRecursoDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    const proyecto = await this.findOne(id, empresaId);

    // Validar que el usuario existe y pertenece a la empresa
    const usuario = await this.usuarioRepository.findOne({
      where: { 
        id: asignarRecursoDto.usuarioId,
        empresaId: empresaId,
        activo: true
      }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado o no pertenece a la empresa');
    }

    // Inicializar recursos si no existen
    if (!proyecto.recursos) {
      proyecto.recursos = [];
    }

    // Verificar si el usuario ya está asignado
    const recursoExistente = proyecto.recursos.find(r => r.usuarioId === asignarRecursoDto.usuarioId);
    
    if (recursoExistente) {
      throw new BadRequestException('El usuario ya está asignado al proyecto');
    }

    // Crear nuevo recurso
    const nuevoRecurso = {
      usuarioId: asignarRecursoDto.usuarioId,
      nombreUsuario: usuario.nombre,
      rol: asignarRecursoDto.rol,
      porcentajeDedicacion: asignarRecursoDto.porcentajeDedicacion || 100,
      tarifaHora: asignarRecursoDto.tarifaHora || usuario.tarifaHora || 0,
      fechaInicio: asignarRecursoDto.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: asignarRecursoDto.fechaFin,
      responsabilidades: asignarRecursoDto.responsabilidades || [],
      activo: true,
      horasAsignadas: 0,
      horasEjecutadas: 0,
      fechaAsignacion: new Date().toISOString(),
      asignadoPor: usuarioId
    };

    proyecto.recursos.push(nuevoRecurso);
    proyecto.fechaActualizacion = new Date();
    proyecto.actualizadoPor = usuarioId;

    // Recalcular horas presupuestadas
    proyecto.horasPresupuestadas = this.calcularHorasPresupuestadas({
      presupuesto: proyecto.presupuesto,
      recursos: proyecto.recursos
    });

    const proyectoActualizado = await this.proyectoRepository.save(proyecto);

    // Registrar evento
    await this.registrarEvento(id, 'RECURSO_ASIGNADO', usuarioId, {
      usuario: usuario.nombre,
      rol: asignarRecursoDto.rol,
      dedicacion: asignarRecursoDto.porcentajeDedicacion,
      motivo: asignarRecursoDto.motivo
    });

    return this.findOne(id, empresaId);
  }

  async actualizarHito(id: string, actualizarHitoDto: ActualizarHitoDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    const proyecto = await this.findOne(id, empresaId);

    if (!proyecto.hitos) {
      proyecto.hitos = [];
    }

    switch (actualizarHitoDto.operacion) {
      case 'CREAR':
        const nuevoHito = new HitoProyecto();
        nuevoHito.nombre = actualizarHitoDto.datosHito.nombre;
        nuevoHito.descripcion = actualizarHitoDto.datosHito.descripcion;
        nuevoHito.fecha = new Date(actualizarHitoDto.datosHito.fechaProgramada || new Date());
        nuevoHito.esCompletado = false;
        nuevoHito.criteriosCompletitud = actualizarHitoDto.datosHito.dependencias;
        nuevoHito.entregables = actualizarHitoDto.datosHito.entregables;
        // Los observaciones se manejan de forma opcional
        nuevoHito.proyectoId = proyecto.id;
        nuevoHito.creadoPorId = usuarioId;
        proyecto.hitos.push(nuevoHito);
        break;

      case 'ACTUALIZAR':
        const hitoIndex = proyecto.hitos.findIndex(h => h.id === actualizarHitoDto.hitoId);
        if (hitoIndex === -1) {
          throw new NotFoundException('Hito no encontrado');
        }
        // Actualizar campos específicos del hito
        if (actualizarHitoDto.datosHito.nombre) {
          proyecto.hitos[hitoIndex].nombre = actualizarHitoDto.datosHito.nombre;
        }
        if (actualizarHitoDto.datosHito.descripcion) {
          proyecto.hitos[hitoIndex].descripcion = actualizarHitoDto.datosHito.descripcion;
        }
        if (actualizarHitoDto.datosHito.fechaProgramada) {
          proyecto.hitos[hitoIndex].fecha = new Date(actualizarHitoDto.datosHito.fechaProgramada);
        }
        break;

      case 'COMPLETAR':
        const hitoCompletar = proyecto.hitos.find(h => h.id === actualizarHitoDto.hitoId);
        if (!hitoCompletar) {
          throw new NotFoundException('Hito no encontrado');
        }
        hitoCompletar.esCompletado = true;
        hitoCompletar.fechaCompletado = new Date();
        break;

      case 'ELIMINAR':
        proyecto.hitos = proyecto.hitos.filter(h => h.id !== actualizarHitoDto.hitoId);
        break;
    }

    proyecto.fechaActualizacion = new Date();
    proyecto.actualizadoPor = usuarioId;

    // Recalcular porcentaje de avance basado en hitos
    proyecto.porcentajeAvance = this.calcularAvanceProyecto(proyecto);

    const proyectoActualizado = await this.proyectoRepository.save(proyecto);

    // Registrar evento
    await this.registrarEvento(id, 'HITO_ACTUALIZADO', usuarioId, {
      operacion: actualizarHitoDto.operacion,
      hito: actualizarHitoDto.datosHito.nombre,
      comentarios: actualizarHitoDto.comentarios
    });

    return this.findOne(id, empresaId);
  }

  async actualizarPresupuesto(id: string, actualizarPresupuestoDto: ActualizarPresupuestoDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    const proyecto = await this.findOne(id, empresaId);

    const presupuestoAnterior = { ...proyecto.presupuesto };
    
    // Actualizar presupuesto
    if (!proyecto.presupuesto) {
      proyecto.presupuesto = {};
    }

    if (actualizarPresupuestoDto.presupuestoInicial !== undefined) {
      proyecto.presupuesto.presupuestoInicial = actualizarPresupuestoDto.presupuestoInicial;
    }

    if (actualizarPresupuestoDto.presupuestoAprobado !== undefined) {
      proyecto.presupuesto.presupuestoAprobado = actualizarPresupuestoDto.presupuestoAprobado;
    }

    // Marcar como pendiente de aprobación si se requiere
    if (actualizarPresupuestoDto.requiereAprobacion) {
      proyecto.presupuesto.estadoAprobacion = 'PENDIENTE';
      proyecto.presupuesto.fechaSolicitudAprobacion = new Date().toISOString();
      proyecto.presupuesto.solicitadoPor = usuarioId;
    }

    proyecto.fechaActualizacion = new Date();
    proyecto.actualizadoPor = usuarioId;

    const proyectoActualizado = await this.proyectoRepository.save(proyecto);

    // Registrar evento
    await this.registrarEvento(id, 'PRESUPUESTO_ACTUALIZADO', usuarioId, {
      presupuestoAnterior,
      presupuestoNuevo: proyecto.presupuesto,
      motivo: actualizarPresupuestoDto.motivo,
      requiereAprobacion: actualizarPresupuestoDto.requiereAprobacion,
      desgloseCambios: actualizarPresupuestoDto.desgloseCambios
    });

    return this.findOne(id, empresaId);
  }

  async reportarAvance(id: string, reportarAvanceDto: ReportarAvanceDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    const proyecto = await this.findOne(id, empresaId);

    const avanceAnterior = proyecto.porcentajeAvance;
    
    proyecto.porcentajeAvance = reportarAvanceDto.porcentajeAvance;
    proyecto.fechaActualizacion = new Date();
    proyecto.actualizadoPor = usuarioId;

    // Actualizar métricas si se proporcionan
    if (reportarAvanceDto.horasTrabajadas) {
      proyecto.horasEjecutadas = (proyecto.horasEjecutadas || 0) + reportarAvanceDto.horasTrabajadas;
    }

    if (reportarAvanceDto.gastosIncurridos) {
      proyecto.costosIncurridos = (proyecto.costosIncurridos || 0) + reportarAvanceDto.gastosIncurridos;
    }

    // Inicializar reportes de avance si no existen
    if (!proyecto.reportesAvance) {
      proyecto.reportesAvance = [];
    }

    // Agregar nuevo reporte
    const nuevoReporte = {
      fecha: reportarAvanceDto.fechaReporte || new Date().toISOString().split('T')[0],
      porcentajeAvance: reportarAvanceDto.porcentajeAvance,
      avanceAnterior,
      actividadesCompletadas: reportarAvanceDto.actividadesCompletadas || [],
      proximasActividades: reportarAvanceDto.proximasActividades || [],
      obstaculos: reportarAvanceDto.obstaculos || [],
      observaciones: reportarAvanceDto.observaciones,
      horasTrabajadas: reportarAvanceDto.horasTrabajadas || 0,
      gastosIncurridos: reportarAvanceDto.gastosIncurridos || 0,
      reportadoPor: usuarioId,
      fechaReporte: new Date().toISOString()
    };

    proyecto.reportesAvance.push(nuevoReporte);

    // Mantener solo los últimos 50 reportes
    if (proyecto.reportesAvance.length > 50) {
      proyecto.reportesAvance = proyecto.reportesAvance.slice(-50);
    }

    const proyectoActualizado = await this.proyectoRepository.save(proyecto);

    // Registrar evento
    await this.registrarEvento(id, 'AVANCE_REPORTADO', usuarioId, {
      porcentajeAnterior: avanceAnterior,
      porcentajeNuevo: reportarAvanceDto.porcentajeAvance,
      actividadesCompletadas: reportarAvanceDto.actividadesCompletadas?.length || 0,
      obstaculos: reportarAvanceDto.obstaculos?.length || 0,
      horasTrabajadas: reportarAvanceDto.horasTrabajadas,
      gastosIncurridos: reportarAvanceDto.gastosIncurridos
    });

    return this.findOne(id, empresaId);
  }

  async cerrarProyecto(id: string, cerrarProyectoDto: CerrarProyectoDto, empresaId: string, usuarioId: string): Promise<Proyecto> {
    const proyecto = await this.findOne(id, empresaId);

    // Validar que el proyecto se puede cerrar
    if (proyecto.estado === EstadoProyecto.CERRADO) {
      throw new BadRequestException('El proyecto ya está cerrado');
    }

    if (proyecto.estado === EstadoProyecto.CANCELADO) {
      throw new BadRequestException('No se puede cerrar un proyecto cancelado');
    }

    // Actualizar estado y datos de cierre
    proyecto.estado = EstadoProyecto.CERRADO;
    proyecto.fechaFinReal = new Date(cerrarProyectoDto.fechaCierre);
    proyecto.porcentajeAvance = 100;
    proyecto.fechaActualizacion = new Date();
    proyecto.actualizadoPor = usuarioId;

    // Agregar información de cierre
    proyecto.datosCierre = {
      fechaCierre: cerrarProyectoDto.fechaCierre,
      resultado: cerrarProyectoDto.resultado,
      resumenEjecutivo: cerrarProyectoDto.resumenEjecutivo,
      objetivosCumplidos: cerrarProyectoDto.objetivosCumplidos || [],
      leccionesAprendidas: cerrarProyectoDto.leccionesAprendidas || [],
      costosFinales: cerrarProyectoDto.costosFinales || proyecto.costosIncurridos,
      ingresosFinales: cerrarProyectoDto.ingresosFinales || proyecto.ingresosGenerados,
      satisfaccionCliente: cerrarProyectoDto.satisfaccionCliente,
      documentosFinales: cerrarProyectoDto.documentosFinales || [],
      requiereSeguimiento: cerrarProyectoDto.requiereSeguimiento || false,
      cerradoPor: usuarioId,
      fechaCierreReal: new Date().toISOString()
    };

    // Actualizar métricas finales
    if (cerrarProyectoDto.costosFinales) {
      proyecto.costosIncurridos = cerrarProyectoDto.costosFinales;
    }

    if (cerrarProyectoDto.ingresosFinales) {
      proyecto.ingresosGenerados = cerrarProyectoDto.ingresosFinales;
    }

    // Calcular margen final
    proyecto.margenReal = proyecto.ingresosGenerados - proyecto.costosIncurridos;

    const proyectoActualizado = await this.proyectoRepository.save(proyecto);

    // Registrar evento de cierre
    await this.registrarEvento(id, 'PROYECTO_CERRADO', usuarioId, {
      resultado: cerrarProyectoDto.resultado,
      costosFinales: cerrarProyectoDto.costosFinales,
      ingresosFinales: cerrarProyectoDto.ingresosFinales,
      margenFinal: proyecto.margenReal,
      satisfaccionCliente: cerrarProyectoDto.satisfaccionCliente,
      requiereSeguimiento: cerrarProyectoDto.requiereSeguimiento
    });

    return this.findOne(id, empresaId);
  }

  async remove(id: string, empresaId: string, usuarioId: string): Promise<void> {
    const proyecto = await this.findOne(id, empresaId);

    // Validar que el proyecto se puede eliminar
    if (proyecto.estado !== EstadoProyecto.PLANIFICACION) {
      throw new BadRequestException('Solo se pueden eliminar proyectos en estado de planificación');
    }

    // Soft delete
    proyecto.activo = false;
    proyecto.fechaEliminacion = new Date();
    proyecto.eliminadoPor = usuarioId;
    
    await this.proyectoRepository.save(proyecto);

    // Registrar evento
    await this.registrarEvento(id, 'PROYECTO_ELIMINADO', usuarioId, {
      motivo: 'Eliminación por usuario'
    });
  }

  async getEstadisticas(empresaId: string, filtros?: Partial<FiltrosProyecto>): Promise<EstadisticasProyecto> {
    const queryBuilder = this.proyectoRepository.createQueryBuilder('proyecto')
      .where('proyecto.empresaId = :empresaId AND proyecto.activo = true', { empresaId });

    // Aplicar filtros si se proporcionan
    if (filtros?.fechaInicioDesde) {
      queryBuilder.andWhere('proyecto.fechaInicio >= :fechaDesde', { fechaDesde: filtros.fechaInicioDesde });
    }

    if (filtros?.fechaInicioHasta) {
      queryBuilder.andWhere('proyecto.fechaInicio <= :fechaHasta', { fechaHasta: filtros.fechaInicioHasta });
    }

    const proyectos = await queryBuilder.getMany();

    // Calcular estadísticas
    const totalProyectos = proyectos.length;
    
    const porEstado = Object.values(EstadoProyecto).reduce((acc, estado) => {
      acc[estado] = proyectos.filter(p => p.estado === estado).length;
      return acc;
    }, {} as Record<EstadoProyecto, number>);

    const porTipo = Object.values(TipoProyecto).reduce((acc, tipo) => {
      acc[tipo] = proyectos.filter(p => p.tipo === tipo).length;
      return acc;
    }, {} as Record<TipoProyecto, number>);

    const porPrioridad = Object.values(PrioridadProyecto).reduce((acc, prioridad) => {
      acc[prioridad] = proyectos.filter(p => p.prioridad === prioridad).length;
      return acc;
    }, {} as Record<PrioridadProyecto, number>);

    const presupuestoTotal = proyectos.reduce((sum, p) => sum + (p.presupuesto?.presupuestoInicial || 0), 0);
    const presupuestoEjecutado = proyectos.reduce((sum, p) => sum + (p.costosIncurridos || 0), 0);
    
    const porcentajeAvancePromedio = totalProyectos > 0 ? 
      proyectos.reduce((sum, p) => sum + (p.porcentajeAvance || 0), 0) / totalProyectos : 0;

    const ahora = new Date();
    const proyectosAtrasados = proyectos.filter(p => 
      p.fechaFinEstimada < ahora && 
      ![EstadoProyecto.COMPLETADO, EstadoProyecto.CANCELADO, EstadoProyecto.CERRADO].includes(p.estado)
    ).length;

    const proyectosEnRiesgo = proyectos.filter(p => {
      if ([EstadoProyecto.COMPLETADO, EstadoProyecto.CANCELADO, EstadoProyecto.CERRADO].includes(p.estado)) {
        return false;
      }
      
      const diasParaVencimiento = Math.ceil((p.fechaFinEstimada.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      return diasParaVencimiento <= 7 && diasParaVencimiento > 0;
    }).length;

    const ingresosPotenciales = proyectos
      .filter(p => ![EstadoProyecto.CANCELADO, EstadoProyecto.CERRADO].includes(p.estado))
      .reduce((sum, p) => sum + (p.presupuesto?.presupuestoAprobado || p.presupuesto?.presupuestoInicial || 0), 0);

    return {
      totalProyectos,
      porEstado,
      porTipo,
      porPrioridad,
      presupuestoTotal,
      presupuestoEjecutado,
      porcentajeAvancePromedio,
      proyectosAtrasados,
      proyectosEnRiesgo,
      ingresosPotenciales
    };
  }

  async getResumenFinanciero(id: string, empresaId: string): Promise<ResumenFinanciero> {
    const proyecto = await this.findOne(id, empresaId);

    const presupuestoTotal = proyecto.presupuesto?.presupuestoInicial || 0;
    const presupuestoAprobado = proyecto.presupuesto?.presupuestoAprobado || presupuestoTotal;
    const presupuestoEjecutado = proyecto.costosIncurridos || 0;
    const costosIncurridos = proyecto.costosIncurridos || 0;
    const ingresosGenerados = proyecto.ingresosGenerados || 0;
    
    const margenProyectado = presupuestoAprobado - presupuestoTotal;
    const margenReal = ingresosGenerados - costosIncurridos;
    
    const horasPresupuestadas = proyecto.horasPresupuestadas || 0;
    const horasEjecutadas = proyecto.horasEjecutadas || 0;
    
    const tarifaPromedioEjecutada = horasEjecutadas > 0 ? costosIncurridos / horasEjecutadas : 0;

    return {
      presupuestoTotal,
      presupuestoAprobado,
      presupuestoEjecutado,
      costosIncurridos,
      ingresosGenerados,
      margenProyectado,
      margenReal,
      horasPresupuestadas,
      horasEjecutadas,
      tarifaPromedioEjecutada
    };
  }

  // Métodos privados auxiliares
  private async generarCodigoProyecto(empresaId: string, tipo: TipoProyecto): Promise<string> {
    const año = new Date().getFullYear();
    const prefijo = this.obtenerPrefijoTipo(tipo);
    
    const ultimoProyecto = await this.proyectoRepository.findOne({
      where: { 
        empresaId,
        codigo: Like(`${prefijo}-${año}-%`)
      },
      order: { codigo: 'DESC' }
    });

    let numero = 1;
    if (ultimoProyecto) {
      const ultimoNumero = parseInt(ultimoProyecto.codigo.split('-')[2]);
      numero = ultimoNumero + 1;
    }

    return `${prefijo}-${año}-${numero.toString().padStart(4, '0')}`;
  }

  private obtenerPrefijoTipo(tipo: TipoProyecto): string {
    const prefijos = {
      [TipoProyecto.CONSULTORIA_LEGAL]: 'CON',
      [TipoProyecto.PROCESO_JUDICIAL]: 'PJ',
      [TipoProyecto.TRANSACCION_COMERCIAL]: 'TC',
      [TipoProyecto.COMPLIANCE]: 'CMP',
      [TipoProyecto.FUSION_ADQUISICION]: 'MA',
      [TipoProyecto.PROPIEDAD_INTELECTUAL]: 'PI',
      [TipoProyecto.REGULATORIO]: 'REG',
      [TipoProyecto.LABORAL]: 'LAB',
      [TipoProyecto.TRIBUTARIO]: 'TRIB',
      [TipoProyecto.INMOBILIARIO]: 'INM',
      [TipoProyecto.CORPORATIVO]: 'CORP',
      [TipoProyecto.INTERNACIONAL]: 'INT',
      [TipoProyecto.INVESTIGACION_LEGAL]: 'INV',
      [TipoProyecto.OTROS]: 'OTR'
    };

    return prefijos[tipo] || 'PRY';
  }

  private calcularFechaFinEstimada(fechaInicio: Date, tipo: TipoProyecto): Date {
    const duracionesEstimadas = {
      [TipoProyecto.CONSULTORIA_LEGAL]: 30,
      [TipoProyecto.PROCESO_JUDICIAL]: 365,
      [TipoProyecto.TRANSACCION_COMERCIAL]: 90,
      [TipoProyecto.COMPLIANCE]: 120,
      [TipoProyecto.FUSION_ADQUISICION]: 180,
      [TipoProyecto.PROPIEDAD_INTELECTUAL]: 60,
      [TipoProyecto.REGULATORIO]: 90,
      [TipoProyecto.LABORAL]: 120,
      [TipoProyecto.TRIBUTARIO]: 90,
      [TipoProyecto.INMOBILIARIO]: 120,
      [TipoProyecto.CORPORATIVO]: 60,
      [TipoProyecto.INTERNACIONAL]: 180,
      [TipoProyecto.INVESTIGACION_LEGAL]: 45,
      [TipoProyecto.OTROS]: 60
    };

    const dias = duracionesEstimadas[tipo] || 60;
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + dias);
    
    return fechaFin;
  }

  private calcularHorasPresupuestadas(data: any): number {
    let horas = 0;

    // Calcular basado en presupuesto y tarifa promedio
    if (data.presupuesto?.presupuestoInicial) {
      const tarifaPromedio = 100; // Tarifa promedio por defecto
      horas += data.presupuesto.presupuestoInicial / tarifaPromedio;
    }

    // Calcular basado en recursos asignados
    if (data.recursos && Array.isArray(data.recursos)) {
      const horasRecursos = data.recursos.reduce((sum, recurso) => {
        const horasRecurso = recurso.horasAsignadas || 0;
        return sum + horasRecurso;
      }, 0);
      
      if (horasRecursos > 0) {
        horas = horasRecursos;
      }
    }

    return Math.round(horas);
  }

  private async validarCambioEstado(proyecto: Proyecto, nuevoEstado: EstadoProyecto): Promise<void> {
    const estadoActual = proyecto.estado;

    // Matriz de transiciones válidas
    const transicionesValidas: Record<EstadoProyecto, EstadoProyecto[]> = {
      [EstadoProyecto.PLANIFICACION]: [
        EstadoProyecto.EN_PROGRESO,
        EstadoProyecto.CANCELADO
      ],
      [EstadoProyecto.EN_PROGRESO]: [
        EstadoProyecto.PAUSADO,
        EstadoProyecto.EN_REVISION,
        EstadoProyecto.COMPLETADO,
        EstadoProyecto.CANCELADO
      ],
      [EstadoProyecto.EN_REVISION]: [
        EstadoProyecto.EN_PROGRESO,
        EstadoProyecto.COMPLETADO,
        EstadoProyecto.CANCELADO
      ],
      [EstadoProyecto.PAUSADO]: [
        EstadoProyecto.EN_PROGRESO,
        EstadoProyecto.CANCELADO
      ],
      [EstadoProyecto.COMPLETADO]: [
        EstadoProyecto.CERRADO,
        EstadoProyecto.FACTURADO
      ],
      [EstadoProyecto.FACTURADO]: [
        EstadoProyecto.CERRADO
      ],
      [EstadoProyecto.CANCELADO]: [],
      [EstadoProyecto.CERRADO]: []
    };

    const transicionesPermitidas = transicionesValidas[estadoActual] || [];
    
    if (!transicionesPermitidas.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar del estado "${estadoActual}" al estado "${nuevoEstado}"`
      );
    }
  }

  private calcularAvanceProyecto(proyecto: Proyecto): number {
    if (!proyecto.hitos || proyecto.hitos.length === 0) {
      return proyecto.porcentajeAvance || 0;
    }

    const hitosCompletados = proyecto.hitos.filter(h => h.esCompletado).length;
    const totalHitos = proyecto.hitos.length;
    
    return Math.round((hitosCompletados / totalHitos) * 100);
  }

  private generarIdHito(): string {
    return `hito-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ejecutarAccionesEstado(proyecto: Proyecto, estadoAnterior: EstadoProyecto, usuarioId: string): Promise<void> {
    // Aquí se pueden implementar acciones automáticas según el cambio de estado
    // Por ejemplo: enviar notificaciones, actualizar casos relacionados, etc.
    
    switch (proyecto.estado) {
      case EstadoProyecto.EN_PROGRESO:
        // Notificar inicio de proyecto
        break;
      case EstadoProyecto.COMPLETADO:
        // Notificar finalización
        // Actualizar casos relacionados
        break;
      case EstadoProyecto.CANCELADO:
        // Liberar recursos asignados
        // Notificar cancelación
        break;
    }
  }

  private async registrarEvento(proyectoId: string, evento: string, usuarioId: string, detalles: any): Promise<void> {
    // Implementar registro de eventos/bitácora
    // Por ahora solo log
    console.log(`Evento ${evento} en proyecto ${proyectoId} por usuario ${usuarioId}:`, detalles);
  }
}
