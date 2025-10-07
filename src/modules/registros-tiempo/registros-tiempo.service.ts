import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { 
  CreateRegistroTiempoDto, 
  IniciarTemporizadorDto, 
  DetenerTemporizadorDto,
  EstadoRegistroTiempo, 
  TipoRegistroTiempo,
  CategoriaTiempo 
} from './dto/create-registro-tiempo.dto';
import { 
  UpdateRegistroTiempoDto,
  CambiarEstadoRegistroDto,
  AprobarRegistroDto,
  RechazarRegistroDto,
  MarcarFacturadoDto,
  ActualizarConfiguracionFacturacionDto,
  RegistrarDescansoDto,
  CopiarRegistroDto,
  GenerarReporteRegistrosDto,
  ConfigurarNotificacionesDto
} from './dto/update-registro-tiempo.dto';
// import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Usuario } from '../../entities/usuario.entity';

// Entidad temporal para Registro de Tiempo
export class RegistroTiempo {
  id: string;
  empresaId: string;
  usuarioId: string;
  clienteId: string;
  casoId?: string;
  proyectoId?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  totalHoras: number;
  descripcion: string;
  tipo: TipoRegistroTiempo;
  categoria: CategoriaTiempo;
  estado: EstadoRegistroTiempo;
  configuracionFacturacion: any;
  importeBruto: number;
  importeNeto: number;
  resultados?: string;
  proximosPasos?: string;
  facturaId?: string;
  numeroFactura?: string;
  fechaFacturacion?: Date;
  montoFacturado?: number;
  observacionesFacturacion?: string;
  fechaAprobacion?: Date;
  aprobadoPor?: string;
  observacionesAprobacion?: string;
  fechaRechazo?: Date;
  rechazadoPor?: string;
  motivosRechazo?: string[];
  camposACorregir?: string[];
  sugerenciasMejora?: string;
  permitirReenvio?: boolean;
  revisorId?: string;
  fechaRevision?: Date;
  observacionesRevisor?: string;
  fechaCreacion: Date;
  creadoPor: string;
  fechaActualizacion?: Date;
  actualizadoPor?: string;
  activo: boolean;
  fechaEliminacion?: Date;
  eliminadoPor?: string;
  
  // Relaciones
  cliente?: Cliente;
  caso?: Caso;
  proyecto?: Proyecto;
  usuario?: Usuario;
  empresa?: any;
}

export interface FiltrosRegistroTiempo {
  usuarioId?: string;
  clienteId?: string;
  casoId?: string;
  proyectoId?: string;
  estado?: EstadoRegistroTiempo;
  tipo?: TipoRegistroTiempo;
  categoria?: CategoriaTiempo;
  fechaDesde?: string;
  fechaHasta?: string;
  soloFacturables?: boolean;
  soloAprobados?: boolean;
  soloPendientes?: boolean;
  busqueda?: string;
}

export interface EstadisticasTiempo {
  totalHoras: number;
  horasFacturables: number;
  horasNoFacturables: number;
  horasAprobadas: number;
  horasPendientes: number;
  ingresosPotenciales: number;
  ingresosFacturados: number;
  tarifaPromedio: number;
  registrosPorEstado: Record<EstadoRegistroTiempo, number>;
  registrosPorTipo: Record<TipoRegistroTiempo, number>;
  registrosPorCategoria: Record<CategoriaTiempo, number>;
  eficienciaUsuario: number;
  tendenciaSemanal: Array<{
    semana: string;
    horas: number;
    ingresos: number;
  }>;
}

export interface ResumenFacturacion {
  totalHoras: number;
  totalImporte: number;
  registrosPorFacturar: number;
  registrosFacturados: number;
  descuentosAplicados: number;
  tarifaPromedioReal: number;
  detallesPorCliente: Array<{
    clienteId: string;
    clienteNombre: string;
    horas: number;
    importe: number;
    registros: number;
  }>;
}

export interface TemporizadorActivo {
  id: string;
  usuarioId: string;
  clienteId: string;
  casoId?: string;
  proyectoId?: string;
  descripcionActividad: string;
  tipo: TipoRegistroTiempo;
  categoria: CategoriaTiempo;
  fechaInicio: Date;
  horaInicio: string;
  tiempoTranscurrido: number; // en minutos
  estado: 'ACTIVO' | 'PAUSADO';
}

@Injectable()
export class RegistrosTiempoService {
  private temporizadoresActivos: Map<string, TemporizadorActivo> = new Map();

  constructor(
    // @InjectRepository(RegistroTiempo)
    private registroTiempoRepository: any, // Repository<RegistroTiempo>,
    // @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    // @InjectRepository(Caso)
    private casoRepository: Repository<Caso>,
    // @InjectRepository(Proyecto)
    private proyectoRepository: Repository<Proyecto>,
    // @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createRegistroTiempoDto: CreateRegistroTiempoDto, empresaId: string, usuarioId: string): Promise<RegistroTiempo> {
    // Validar que el cliente existe y pertenece a la empresa
    const cliente = await this.clienteRepository.findOne({
      where: { 
        id: createRegistroTiempoDto.clienteId,
        empresaId: empresaId
      }
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado o no pertenece a la empresa');
    }

    // Validar caso si se proporciona
    if (createRegistroTiempoDto.casoId) {
      const caso = await this.casoRepository.findOne({
        where: { 
          id: createRegistroTiempoDto.casoId,
          empresaId: empresaId,
          clienteId: createRegistroTiempoDto.clienteId
        }
      });

      if (!caso) {
        throw new NotFoundException('Caso no encontrado o no pertenece al cliente especificado');
      }
    }

    // Validar proyecto si se proporciona
    if (createRegistroTiempoDto.proyectoId) {
      const proyecto = await this.proyectoRepository.findOne({
        where: { 
          id: createRegistroTiempoDto.proyectoId,
          empresaId: empresaId,
          clienteId: createRegistroTiempoDto.clienteId
        }
      });

      if (!proyecto) {
        throw new NotFoundException('Proyecto no encontrado o no pertenece al cliente especificado');
      }
    }

    // Obtener información del usuario para tarifas
    const usuario = await this.usuarioRepository.findOne({
      where: { 
        id: usuarioId,
        empresaId: empresaId
      }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Calcular horas totales si no se proporciona
    let totalHoras = createRegistroTiempoDto.totalHoras;
    if (!totalHoras) {
      totalHoras = this.calcularHorasEntreTiempos(
        createRegistroTiempoDto.horaInicio,
        createRegistroTiempoDto.horaFin
      );
    }

    // Validar que las horas son coherentes
    if (totalHoras <= 0) {
      throw new BadRequestException('Las horas registradas deben ser mayores a 0');
    }

    // Configurar facturación por defecto
    const configuracionFacturacion = createRegistroTiempoDto.configuracionFacturacion || {
      facturable: createRegistroTiempoDto.categoria === CategoriaTiempo.FACTURABLE,
      tarifaHora: usuario.tarifaHora || 0,
      moneda: 'PEN',
      porcentajeDescuento: 0,
      requiereAprobacion: false
    };

    // Calcular importes
    const tarifaEfectiva = configuracionFacturacion.tarifaHora || usuario.tarifaHora || 0;
    const importeBruto = totalHoras * tarifaEfectiva;
    const descuento = (importeBruto * (configuracionFacturacion.porcentajeDescuento || 0)) / 100;
    const importeNeto = importeBruto - descuento;

    // Crear el registro
    const registro = this.registroTiempoRepository.create({
      ...createRegistroTiempoDto,
      empresaId: empresaId,
      usuarioId: usuarioId,
      totalHoras: totalHoras,
      configuracionFacturacion,
      importeBruto,
      importeNeto,
      estado: createRegistroTiempoDto.estado || EstadoRegistroTiempo.BORRADOR,
      fechaCreacion: new Date(),
      creadoPor: usuarioId,
    });

    const registroGuardado = await this.registroTiempoRepository.save(registro);

    // Actualizar métricas del proyecto si aplica
    if (createRegistroTiempoDto.proyectoId) {
      await this.actualizarMetricasProyecto(createRegistroTiempoDto.proyectoId, totalHoras, importeNeto);
    }

    // Registrar evento
    await this.registrarEvento(registroGuardado.id, 'REGISTRO_CREADO', usuarioId, {
      cliente: cliente.nombre,
      horas: totalHoras,
      tipo: createRegistroTiempoDto.tipo,
      categoria: createRegistroTiempoDto.categoria
    });

    return this.findOne(registroGuardado.id, empresaId);
  }

  async findAll(filtros: FiltrosRegistroTiempo, empresaId: string, page: number = 1, limit: number = 20) {
    const queryBuilder = this.registroTiempoRepository.createQueryBuilder('registro')
      .leftJoinAndSelect('registro.cliente', 'cliente')
      .leftJoinAndSelect('registro.caso', 'caso')
      .leftJoinAndSelect('registro.proyecto', 'proyecto')
      .leftJoinAndSelect('registro.usuario', 'usuario')
      .where('registro.empresaId = :empresaId', { empresaId });

    // Aplicar filtros
    if (filtros.usuarioId) {
      queryBuilder.andWhere('registro.usuarioId = :usuarioId', { usuarioId: filtros.usuarioId });
    }

    if (filtros.clienteId) {
      queryBuilder.andWhere('registro.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    if (filtros.casoId) {
      queryBuilder.andWhere('registro.casoId = :casoId', { casoId: filtros.casoId });
    }

    if (filtros.proyectoId) {
      queryBuilder.andWhere('registro.proyectoId = :proyectoId', { proyectoId: filtros.proyectoId });
    }

    if (filtros.estado) {
      queryBuilder.andWhere('registro.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.tipo) {
      queryBuilder.andWhere('registro.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros.categoria) {
      queryBuilder.andWhere('registro.categoria = :categoria', { categoria: filtros.categoria });
    }

    if (filtros.fechaDesde) {
      queryBuilder.andWhere('registro.fecha >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    }

    if (filtros.fechaHasta) {
      queryBuilder.andWhere('registro.fecha <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    }

    if (filtros.soloFacturables) {
      queryBuilder.andWhere('registro.configuracionFacturacion.facturable = :facturable', { facturable: true });
    }

    if (filtros.soloAprobados) {
      queryBuilder.andWhere('registro.estado = :estado', { estado: EstadoRegistroTiempo.APROBADO });
    }

    if (filtros.soloPendientes) {
      queryBuilder.andWhere('registro.estado = :estado', { estado: EstadoRegistroTiempo.PENDIENTE_APROBACION });
    }

    if (filtros.busqueda) {
      queryBuilder.andWhere(
        '(registro.descripcion ILIKE :busqueda OR cliente.nombre ILIKE :busqueda OR usuario.nombre ILIKE :busqueda)',
        { busqueda: `%${filtros.busqueda}%` }
      );
    }

    // Paginación
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('registro.fecha', 'DESC')
                .addOrderBy('registro.horaInicio', 'DESC');

    const [registros, total] = await queryBuilder.getManyAndCount();

    return {
      data: registros,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string, empresaId: string): Promise<RegistroTiempo> {
    const registro = await this.registroTiempoRepository.findOne({
      where: { id, empresaId },
      relations: [
        'cliente',
        'caso',
        'proyecto',
        'usuario',
        'empresa'
      ]
    });

    if (!registro) {
      throw new NotFoundException('Registro de tiempo no encontrado');
    }

    return registro;
  }

  async update(id: string, updateRegistroTiempoDto: UpdateRegistroTiempoDto, empresaId: string, usuarioId: string): Promise<RegistroTiempo> {
    const registro = await this.findOne(id, empresaId);

    // Validar que el registro se puede actualizar
    if (registro.estado === EstadoRegistroTiempo.FACTURADO) {
      throw new BadRequestException('No se puede actualizar un registro ya facturado');
    }

    // Validar permisos (solo el creador o un supervisor puede editar)
    if (registro.usuarioId !== usuarioId) {
      // Verificar si es supervisor
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId, empresaId },
        relations: ['rol']
      });

      if (!usuario?.rol?.permisos?.includes('registros_tiempo:update_all')) {
        throw new ForbiddenException('No tiene permisos para editar este registro');
      }
    }

    // Recalcular horas si se modificaron los tiempos
    let totalHoras = (updateRegistroTiempoDto as any).totalHoras;
    if ((updateRegistroTiempoDto as any).horaInicio || (updateRegistroTiempoDto as any).horaFin) {
      const horaInicio = (updateRegistroTiempoDto as any).horaInicio || registro.horaInicio;
      const horaFin = (updateRegistroTiempoDto as any).horaFin || registro.horaFin;
      totalHoras = this.calcularHorasEntreTiempos(horaInicio, horaFin);
    }

    // Recalcular importes si cambió la configuración de facturación
    let importeBruto = registro.importeBruto;
    let importeNeto = registro.importeNeto;

    if ((updateRegistroTiempoDto as any).configuracionFacturacion || totalHoras !== registro.totalHoras) {
      const configFacturacion = {
        ...registro.configuracionFacturacion,
        ...(updateRegistroTiempoDto as any).configuracionFacturacion
      };

      const horas = totalHoras || registro.totalHoras;
      const tarifa = configFacturacion.tarifaHora || 0;
      importeBruto = horas * tarifa;
      const descuento = (importeBruto * (configFacturacion.porcentajeDescuento || 0)) / 100;
      importeNeto = importeBruto - descuento;
    }

    // Actualizar datos del registro
    Object.assign(registro, updateRegistroTiempoDto);
    if (totalHoras) registro.totalHoras = totalHoras;
    registro.importeBruto = importeBruto;
    registro.importeNeto = importeNeto;
    registro.fechaActualizacion = new Date();
    registro.actualizadoPor = usuarioId;

    const registroActualizado = await this.registroTiempoRepository.save(registro);

    // Registrar evento de actualización
    await this.registrarEvento(id, 'REGISTRO_ACTUALIZADO', usuarioId, {
      cambios: updateRegistroTiempoDto,
      motivo: updateRegistroTiempoDto.motivoActualizacion
    });

    return this.findOne(id, empresaId);
  }

  async cambiarEstado(id: string, cambiarEstadoDto: CambiarEstadoRegistroDto, empresaId: string, usuarioId: string): Promise<RegistroTiempo> {
    const registro = await this.findOne(id, empresaId);

    // Validar transición de estado
    await this.validarCambioEstado(registro, cambiarEstadoDto.estado);

    const estadoAnterior = registro.estado;
    registro.estado = cambiarEstadoDto.estado;
    registro.fechaActualizacion = new Date();
    registro.actualizadoPor = usuarioId;

    // Agregar información de revisión
    if (cambiarEstadoDto.revisorId) {
      registro.revisorId = cambiarEstadoDto.revisorId;
      registro.fechaRevision = new Date(cambiarEstadoDto.fechaRevision || new Date());
      registro.observacionesRevisor = cambiarEstadoDto.observacionesRevisor;
    }

    // Aplicar ajustes si se proporcionan
    if (cambiarEstadoDto.ajustesAplicados) {
      const ajustes = cambiarEstadoDto.ajustesAplicados;
      if (ajustes.horasAjustadas) {
        registro.totalHoras = ajustes.horasAjustadas;
      }
      if (ajustes.tarifaAjustada) {
        registro.configuracionFacturacion.tarifaHora = ajustes.tarifaAjustada;
      }
      
      // Recalcular importes
      const tarifaEfectiva = registro.configuracionFacturacion.tarifaHora || 0;
      registro.importeBruto = registro.totalHoras * tarifaEfectiva;
      const descuento = (registro.importeBruto * (registro.configuracionFacturacion.porcentajeDescuento || 0)) / 100;
      registro.importeNeto = registro.importeBruto - descuento;
    }

    const registroActualizado = await this.registroTiempoRepository.save(registro);

    // Registrar evento de cambio de estado
    await this.registrarEvento(id, 'ESTADO_CAMBIADO', usuarioId, {
      estadoAnterior,
      estadoNuevo: cambiarEstadoDto.estado,
      motivo: cambiarEstadoDto.motivo,
      observaciones: cambiarEstadoDto.observacionesRevisor,
      ajustes: cambiarEstadoDto.ajustesAplicados
    });

    // Ejecutar acciones automáticas según el nuevo estado
    await this.ejecutarAccionesEstado(registroActualizado, estadoAnterior, usuarioId);

    return this.findOne(id, empresaId);
  }

  async aprobarRegistro(id: string, aprobarDto: AprobarRegistroDto, empresaId: string, usuarioId: string): Promise<RegistroTiempo> {
    const registro = await this.findOne(id, empresaId);

    if (registro.estado !== EstadoRegistroTiempo.PENDIENTE_APROBACION) {
      throw new BadRequestException('Solo se pueden aprobar registros en estado pendiente');
    }

    // Aplicar ajustes si se proporcionan
    if (aprobarDto.horasAjustadas) {
      registro.totalHoras = aprobarDto.horasAjustadas;
    }

    if (aprobarDto.tarifaAjustada) {
      registro.configuracionFacturacion.tarifaHora = aprobarDto.tarifaAjustada;
    }

    // Recalcular importes si hubo ajustes
    if (aprobarDto.horasAjustadas || aprobarDto.tarifaAjustada) {
      const tarifaEfectiva = registro.configuracionFacturacion.tarifaHora || 0;
      registro.importeBruto = registro.totalHoras * tarifaEfectiva;
      const descuento = (registro.importeBruto * (registro.configuracionFacturacion.porcentajeDescuento || 0)) / 100;
      registro.importeNeto = registro.importeBruto - descuento;
    }

    // Cambiar estado
    registro.estado = EstadoRegistroTiempo.APROBADO;
    registro.fechaAprobacion = new Date();
    registro.aprobadoPor = usuarioId;
    registro.observacionesAprobacion = aprobarDto.observaciones;
    registro.fechaActualizacion = new Date();
    registro.actualizadoPor = usuarioId;

    const registroActualizado = await this.registroTiempoRepository.save(registro);

    // Auto aprobar similares si se solicita
    if (aprobarDto.autoAprobarSimilares) {
      await this.autoAprobarRegistrosSimilares(registro, usuarioId, empresaId);
    }

    // Registrar evento
    await this.registrarEvento(id, 'REGISTRO_APROBADO', usuarioId, {
      observaciones: aprobarDto.observaciones,
      ajustes: {
        horasOriginales: registro.totalHoras,
        horasAjustadas: aprobarDto.horasAjustadas,
        tarifaOriginal: registro.configuracionFacturacion.tarifaHora,
        tarifaAjustada: aprobarDto.tarifaAjustada,
        motivo: aprobarDto.motivoAjustes
      }
    });

    return this.findOne(id, empresaId);
  }

  async rechazarRegistro(id: string, rechazarDto: RechazarRegistroDto, empresaId: string, usuarioId: string): Promise<RegistroTiempo> {
    const registro = await this.findOne(id, empresaId);

    if (registro.estado !== EstadoRegistroTiempo.PENDIENTE_APROBACION) {
      throw new BadRequestException('Solo se pueden rechazar registros en estado pendiente');
    }

    // Cambiar estado
    registro.estado = EstadoRegistroTiempo.RECHAZADO;
    registro.fechaRechazo = new Date();
    registro.rechazadoPor = usuarioId;
    registro.motivosRechazo = Array.isArray(rechazarDto.motivosRechazo) 
      ? rechazarDto.motivosRechazo 
      : [rechazarDto.motivosRechazo];
    registro.camposACorregir = rechazarDto.camposACorregir || [];
    registro.sugerenciasMejora = rechazarDto.sugerenciasMejora;
    registro.permitirReenvio = rechazarDto.permitirReenvio !== false;
    registro.fechaActualizacion = new Date();
    registro.actualizadoPor = usuarioId;

    const registroActualizado = await this.registroTiempoRepository.save(registro);

    // Notificar al usuario si se solicita
    if (rechazarDto.notificarUsuario) {
      await this.notificarRechazo(registro, rechazarDto);
    }

    // Registrar evento
    await this.registrarEvento(id, 'REGISTRO_RECHAZADO', usuarioId, {
      motivos: rechazarDto.motivosRechazo,
      campos: rechazarDto.camposACorregir,
      sugerencias: rechazarDto.sugerenciasMejora
    });

    return this.findOne(id, empresaId);
  }

  async marcarFacturado(id: string, marcarFacturadoDto: MarcarFacturadoDto, empresaId: string, usuarioId: string): Promise<RegistroTiempo> {
    const registro = await this.findOne(id, empresaId);

    if (registro.estado !== EstadoRegistroTiempo.APROBADO) {
      throw new BadRequestException('Solo se pueden facturar registros aprobados');
    }

    // Actualizar información de facturación
    registro.estado = EstadoRegistroTiempo.FACTURADO;
    registro.facturaId = marcarFacturadoDto.facturaId;
    registro.numeroFactura = marcarFacturadoDto.numeroFactura;
    registro.fechaFacturacion = new Date(marcarFacturadoDto.fechaFacturacion);
    registro.montoFacturado = marcarFacturadoDto.montoFacturado || registro.importeNeto;
    registro.observacionesFacturacion = marcarFacturadoDto.observacionesFacturacion;
    registro.fechaActualizacion = new Date();
    registro.actualizadoPor = usuarioId;

    const registroActualizado = await this.registroTiempoRepository.save(registro);

    // Registrar evento
    await this.registrarEvento(id, 'REGISTRO_FACTURADO', usuarioId, {
      facturaId: marcarFacturadoDto.facturaId,
      numeroFactura: marcarFacturadoDto.numeroFactura,
      montoFacturado: marcarFacturadoDto.montoFacturado,
      fechaFacturacion: marcarFacturadoDto.fechaFacturacion
    });

    return this.findOne(id, empresaId);
  }

  async iniciarTemporizador(iniciarDto: IniciarTemporizadorDto, empresaId: string, usuarioId: string): Promise<TemporizadorActivo> {
    // Verificar si ya hay un temporizador activo para el usuario
    const temporizadorExistente = Array.from(this.temporizadoresActivos.values())
      .find(t => t.usuarioId === usuarioId && t.estado === 'ACTIVO');

    if (temporizadorExistente) {
      throw new BadRequestException('Ya tiene un temporizador activo. Debe detenerlo antes de iniciar uno nuevo.');
    }

    // Validar cliente
    const cliente = await this.clienteRepository.findOne({
      where: { 
        id: iniciarDto.clienteId,
        empresaId
      }
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Crear temporizador
    const temporizadorId = `temp_${usuarioId}_${Date.now()}`;
    const temporizador: TemporizadorActivo = {
      id: temporizadorId,
      usuarioId,
      clienteId: iniciarDto.clienteId,
      casoId: iniciarDto.casoId,
      proyectoId: iniciarDto.proyectoId,
      descripcionActividad: iniciarDto.descripcionActividad,
      tipo: iniciarDto.tipo,
      categoria: iniciarDto.categoria || CategoriaTiempo.FACTURABLE,
      fechaInicio: new Date(),
      horaInicio: new Date().toTimeString().slice(0, 5),
      tiempoTranscurrido: 0,
      estado: 'ACTIVO'
    };

    this.temporizadoresActivos.set(temporizadorId, temporizador);

    // Registrar evento
    await this.registrarEvento(temporizadorId, 'TEMPORIZADOR_INICIADO', usuarioId, {
      cliente: cliente.nombre,
      descripcion: iniciarDto.descripcionActividad,
      tipo: iniciarDto.tipo
    });

    return temporizador;
  }

  async detenerTemporizador(temporizadorId: string, detenerDto: DetenerTemporizadorDto, empresaId: string, usuarioId: string): Promise<RegistroTiempo> {
    const temporizador = this.temporizadoresActivos.get(temporizadorId);

    if (!temporizador) {
      throw new NotFoundException('Temporizador no encontrado');
    }

    if (temporizador.usuarioId !== usuarioId) {
      throw new ForbiddenException('No puede detener un temporizador de otro usuario');
    }

    // Calcular tiempo total
    const tiempoFinal = new Date();
    const tiempoTranscurridoMs = tiempoFinal.getTime() - temporizador.fechaInicio.getTime();
    const totalHoras = Math.round((tiempoTranscurridoMs / (1000 * 60 * 60)) * 100) / 100; // Redondear a 2 decimales

    // Crear registro de tiempo
    const createDto: CreateRegistroTiempoDto = {
      clienteId: temporizador.clienteId,
      casoId: temporizador.casoId,
      proyectoId: temporizador.proyectoId,
      fecha: temporizador.fechaInicio.toISOString().split('T')[0],
      horaInicio: temporizador.horaInicio,
      horaFin: tiempoFinal.toTimeString().slice(0, 5),
      totalHoras,
      descripcion: detenerDto.descripcionFinal,
      tipo: temporizador.tipo,
      categoria: temporizador.categoria,
      resultados: detenerDto.resultados,
      proximosPasos: detenerDto.proximosPasos,
      configuracionFacturacion: detenerDto.configuracionFacturacion,
      estado: detenerDto.estado || EstadoRegistroTiempo.BORRADOR
    };

    const registro = await this.create(createDto, empresaId, usuarioId);

    // Remover temporizador de la memoria
    this.temporizadoresActivos.delete(temporizadorId);

    // Registrar evento
    await this.registrarEvento(temporizadorId, 'TEMPORIZADOR_DETENIDO', usuarioId, {
      tiempoTotal: totalHoras,
      registroCreado: registro.id
    });

    return registro;
  }

  async obtenerTemporizadorActivo(usuarioId: string): Promise<TemporizadorActivo | null> {
    const temporizador = Array.from(this.temporizadoresActivos.values())
      .find(t => t.usuarioId === usuarioId && t.estado === 'ACTIVO');

    if (temporizador) {
      // Actualizar tiempo transcurrido
      const ahora = new Date();
      temporizador.tiempoTranscurrido = Math.floor((ahora.getTime() - temporizador.fechaInicio.getTime()) / (1000 * 60));
    }

    return temporizador || null;
  }

  async pausarTemporizador(temporizadorId: string, usuarioId: string): Promise<TemporizadorActivo> {
    const temporizador = this.temporizadoresActivos.get(temporizadorId);

    if (!temporizador || temporizador.usuarioId !== usuarioId) {
      throw new NotFoundException('Temporizador no encontrado');
    }

    temporizador.estado = 'PAUSADO';
    this.temporizadoresActivos.set(temporizadorId, temporizador);

    return temporizador;
  }

  async reanudarTemporizador(temporizadorId: string, usuarioId: string): Promise<TemporizadorActivo> {
    const temporizador = this.temporizadoresActivos.get(temporizadorId);

    if (!temporizador || temporizador.usuarioId !== usuarioId) {
      throw new NotFoundException('Temporizador no encontrado');
    }

    temporizador.estado = 'ACTIVO';
    this.temporizadoresActivos.set(temporizadorId, temporizador);

    return temporizador;
  }

  async getEstadisticas(empresaId: string, usuarioId?: string, filtros?: Partial<FiltrosRegistroTiempo>): Promise<EstadisticasTiempo> {
    const queryBuilder = this.registroTiempoRepository.createQueryBuilder('registro')
      .where('registro.empresaId = :empresaId', { empresaId });

    if (usuarioId) {
      queryBuilder.andWhere('registro.usuarioId = :usuarioId', { usuarioId });
    }

    // Aplicar filtros adicionales
    if (filtros?.fechaDesde) {
      queryBuilder.andWhere('registro.fecha >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    }

    if (filtros?.fechaHasta) {
      queryBuilder.andWhere('registro.fecha <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    }

    const registros = await queryBuilder.getMany();

    // Calcular estadísticas
    const totalHoras = registros.reduce((sum, r) => sum + r.totalHoras, 0);
    const horasFacturables = registros
      .filter(r => r.categoria === CategoriaTiempo.FACTURABLE)
      .reduce((sum, r) => sum + r.totalHoras, 0);
    const horasNoFacturables = totalHoras - horasFacturables;
    
    const horasAprobadas = registros
      .filter(r => r.estado === EstadoRegistroTiempo.APROBADO)
      .reduce((sum, r) => sum + r.totalHoras, 0);
    
    const horasPendientes = registros
      .filter(r => r.estado === EstadoRegistroTiempo.PENDIENTE_APROBACION)
      .reduce((sum, r) => sum + r.totalHoras, 0);

    const ingresosPotenciales = registros.reduce((sum, r) => sum + r.importeNeto, 0);
    const ingresosFacturados = registros
      .filter(r => r.estado === EstadoRegistroTiempo.FACTURADO)
      .reduce((sum, r) => sum + (r.montoFacturado || r.importeNeto), 0);

    const tarifaPromedio = totalHoras > 0 ? ingresosPotenciales / totalHoras : 0;

    // Estadísticas por estado
    const registrosPorEstado = Object.values(EstadoRegistroTiempo).reduce((acc, estado) => {
      acc[estado] = registros.filter(r => r.estado === estado).length;
      return acc;
    }, {} as Record<EstadoRegistroTiempo, number>);

    // Estadísticas por tipo
    const registrosPorTipo = Object.values(TipoRegistroTiempo).reduce((acc, tipo) => {
      acc[tipo] = registros.filter(r => r.tipo === tipo).length;
      return acc;
    }, {} as Record<TipoRegistroTiempo, number>);

    // Estadísticas por categoría
    const registrosPorCategoria = Object.values(CategoriaTiempo).reduce((acc, categoria) => {
      acc[categoria] = registros.filter(r => r.categoria === categoria).length;
      return acc;
    }, {} as Record<CategoriaTiempo, number>);

    // Calcular eficiencia (horas facturables / total horas)
    const eficienciaUsuario = totalHoras > 0 ? (horasFacturables / totalHoras) * 100 : 0;

    // Tendencia semanal (últimas 4 semanas)
    const tendenciaSemanal = this.calcularTendenciaSemanal(registros);

    return {
      totalHoras,
      horasFacturables,
      horasNoFacturables,
      horasAprobadas,
      horasPendientes,
      ingresosPotenciales,
      ingresosFacturados,
      tarifaPromedio,
      registrosPorEstado,
      registrosPorTipo,
      registrosPorCategoria,
      eficienciaUsuario,
      tendenciaSemanal
    };
  }

  async getResumenFacturacion(empresaId: string, fechaDesde?: string, fechaHasta?: string): Promise<ResumenFacturacion> {
    const queryBuilder = this.registroTiempoRepository.createQueryBuilder('registro')
      .leftJoinAndSelect('registro.cliente', 'cliente')
      .where('registro.empresaId = :empresaId', { empresaId })
      .andWhere('registro.configuracionFacturacion.facturable = :facturable', { facturable: true });

    if (fechaDesde) {
      queryBuilder.andWhere('registro.fecha >= :fechaDesde', { fechaDesde });
    }

    if (fechaHasta) {
      queryBuilder.andWhere('registro.fecha <= :fechaHasta', { fechaHasta });
    }

    const registros = await queryBuilder.getMany();

    const totalHoras = registros.reduce((sum, r) => sum + r.totalHoras, 0);
    const totalImporte = registros.reduce((sum, r) => sum + r.importeNeto, 0);
    
    const registrosPorFacturar = registros.filter(r => 
      r.estado === EstadoRegistroTiempo.APROBADO && 
      r.estado !== EstadoRegistroTiempo.FACTURADO
    ).length;
    
    const registrosFacturados = registros.filter(r => 
      r.estado === EstadoRegistroTiempo.FACTURADO
    ).length;

    const descuentosAplicados = registros.reduce((sum, r) => 
      sum + (r.importeBruto - r.importeNeto), 0
    );

    const tarifaPromedioReal = totalHoras > 0 ? totalImporte / totalHoras : 0;

    // Resumen por cliente
    const clientesMap = new Map();
    registros.forEach(registro => {
      const clienteId = registro.clienteId;
      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          clienteId,
          clienteNombre: registro.cliente?.nombre || 'Cliente no encontrado',
          horas: 0,
          importe: 0,
          registros: 0
        });
      }
      
      const cliente = clientesMap.get(clienteId);
      cliente.horas += registro.totalHoras;
      cliente.importe += registro.importeNeto;
      cliente.registros += 1;
    });

    const detallesPorCliente = Array.from(clientesMap.values());

    return {
      totalHoras,
      totalImporte,
      registrosPorFacturar,
      registrosFacturados,
      descuentosAplicados,
      tarifaPromedioReal,
      detallesPorCliente
    };
  }

  async remove(id: string, empresaId: string, usuarioId: string): Promise<void> {
    const registro = await this.findOne(id, empresaId);

    // Validar que el registro se puede eliminar
    if (registro.estado === EstadoRegistroTiempo.FACTURADO) {
      throw new BadRequestException('No se puede eliminar un registro ya facturado');
    }

    // Validar permisos
    if (registro.usuarioId !== usuarioId) {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId, empresaId },
        relations: ['rol']
      });

      if (!usuario?.rol?.permisos?.includes('registros_tiempo:delete_all')) {
        throw new ForbiddenException('No tiene permisos para eliminar este registro');
      }
    }

    // Soft delete
    registro.activo = false;
    registro.fechaEliminacion = new Date();
    registro.eliminadoPor = usuarioId;
    
    await this.registroTiempoRepository.save(registro);

    // Registrar evento
    await this.registrarEvento(id, 'REGISTRO_ELIMINADO', usuarioId, {
      motivo: 'Eliminación por usuario'
    });
  }

  // Métodos privados auxiliares
  private calcularHorasEntreTiempos(horaInicio: string, horaFin: string): number {
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFin_, minFin] = horaFin.split(':').map(Number);
    
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFin = horaFin_ * 60 + minFin;
    
    let minutosTotal = minutosFin - minutosInicio;
    
    // Manejar caso donde el fin es al día siguiente
    if (minutosTotal < 0) {
      minutosTotal += 24 * 60;
    }
    
    return Math.round((minutosTotal / 60) * 100) / 100;
  }

  private async validarCambioEstado(registro: RegistroTiempo, nuevoEstado: EstadoRegistroTiempo): Promise<void> {
    const estadoActual = registro.estado;

    // Matriz de transiciones válidas
    const transicionesValidas: Record<EstadoRegistroTiempo, EstadoRegistroTiempo[]> = {
      [EstadoRegistroTiempo.BORRADOR]: [
        EstadoRegistroTiempo.PENDIENTE_APROBACION,
        EstadoRegistroTiempo.NO_FACTURABLE
      ],
      [EstadoRegistroTiempo.PENDIENTE_APROBACION]: [
        EstadoRegistroTiempo.APROBADO,
        EstadoRegistroTiempo.RECHAZADO,
        EstadoRegistroTiempo.BORRADOR
      ],
      [EstadoRegistroTiempo.APROBADO]: [
        EstadoRegistroTiempo.FACTURADO,
        EstadoRegistroTiempo.PENDIENTE_APROBACION
      ],
      [EstadoRegistroTiempo.RECHAZADO]: [
        EstadoRegistroTiempo.BORRADOR,
        EstadoRegistroTiempo.PENDIENTE_APROBACION
      ],
      [EstadoRegistroTiempo.FACTURADO]: [],
      [EstadoRegistroTiempo.NO_FACTURABLE]: [
        EstadoRegistroTiempo.BORRADOR
      ]
    };

    const transicionesPermitidas = transicionesValidas[estadoActual] || [];
    
    if (!transicionesPermitidas.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar del estado "${estadoActual}" al estado "${nuevoEstado}"`
      );
    }
  }

  private async actualizarMetricasProyecto(proyectoId: string, horas: number, importe: number): Promise<void> {
    const proyecto = await this.proyectoRepository.findOne({ where: { id: proyectoId } });
    if (proyecto) {
      proyecto.horasEjecutadas = (proyecto.horasEjecutadas || 0) + horas;
      proyecto.costosIncurridos = (proyecto.costosIncurridos || 0) + importe;
      await this.proyectoRepository.save(proyecto);
    }
  }

  private async autoAprobarRegistrosSimilares(registroAprobado: RegistroTiempo, usuarioId: string, empresaId: string): Promise<void> {
    // Buscar registros similares pendientes del mismo usuario
    const registrosSimilares = await this.registroTiempoRepository.find({
      where: {
        empresaId,
        usuarioId: registroAprobado.usuarioId,
        clienteId: registroAprobado.clienteId,
        tipo: registroAprobado.tipo,
        categoria: registroAprobado.categoria,
        estado: EstadoRegistroTiempo.PENDIENTE_APROBACION
      }
    });

    // Aprobar automáticamente registros similares
    for (const registro of registrosSimilares) {
      registro.estado = EstadoRegistroTiempo.APROBADO;
      registro.fechaAprobacion = new Date();
      registro.aprobadoPor = usuarioId;
      registro.observacionesAprobacion = 'Auto-aprobado por similitud con registro aprobado';
      await this.registroTiempoRepository.save(registro);
    }
  }

  private async notificarRechazo(registro: RegistroTiempo, rechazarDto: RechazarRegistroDto): Promise<void> {
    // Implementar notificación al usuario
    // Por ahora solo log
    console.log(`Notificar rechazo al usuario ${registro.usuarioId}:`, rechazarDto.motivosRechazo);
  }

  private async ejecutarAccionesEstado(registro: RegistroTiempo, estadoAnterior: EstadoRegistroTiempo, usuarioId: string): Promise<void> {
    // Implementar acciones automáticas según el cambio de estado
    switch (registro.estado) {
      case EstadoRegistroTiempo.APROBADO:
        // Notificar aprobación
        break;
      case EstadoRegistroTiempo.FACTURADO:
        // Actualizar métricas de facturación
        break;
      case EstadoRegistroTiempo.RECHAZADO:
        // Notificar rechazo
        break;
    }
  }

  private calcularTendenciaSemanal(registros: RegistroTiempo[]): Array<{semana: string; horas: number; ingresos: number}> {
    // Calcular tendencia de las últimas 4 semanas
    const ahora = new Date();
    const tendencia: Array<{semana: string; horas: number; ingresos: number}> = [];

    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - (i * 7 + 7));
      
      const finSemana = new Date(ahora);
      finSemana.setDate(ahora.getDate() - (i * 7));

      const registrosSemana = registros.filter(r => {
        const fechaRegistro = new Date(r.fecha);
        return fechaRegistro >= inicioSemana && fechaRegistro < finSemana;
      });

      const horas = registrosSemana.reduce((sum, r) => sum + r.totalHoras, 0);
      const ingresos = registrosSemana.reduce((sum, r) => sum + r.importeNeto, 0);

      tendencia.push({
        semana: `${inicioSemana.toISOString().split('T')[0]} - ${finSemana.toISOString().split('T')[0]}`,
        horas,
        ingresos
      });
    }

    return tendencia;
  }

  private async registrarEvento(registroId: string, evento: string, usuarioId: string, detalles: any): Promise<void> {
    // Implementar registro de eventos/bitácora
    // Por ahora solo log
    console.log(`Evento ${evento} en registro ${registroId} por usuario ${usuarioId}:`, detalles);
  }
}
