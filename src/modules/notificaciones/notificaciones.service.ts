import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { 
  CreateNotificacionDto, 
  TipoNotificacion, 
  PrioridadNotificacion, 
  CategoriaNotificacion 
} from './dto/create-notificacion.dto';
import { 
  UpdateNotificacionDto, 
  EstadoNotificacion, 
  MarcarLeidaDto,
  ProgramarEnvioDto,
  CancelarNotificacionDto
} from './dto/update-notificacion.dto';

// Simulamos las entidades que necesitamos
interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  estado: EstadoNotificacion;
  prioridad: PrioridadNotificacion;
  categoria?: CategoriaNotificacion;
  destinatarios: any[];
  casoId?: string;
  proyectoId?: string;
  clienteId?: string;
  documentoId?: string;
  urlAccion?: string;
  textoBotonAccion?: string;
  datosAdicionales?: any;
  fechaProgramada?: Date;
  fechaEnvio?: Date;
  fechaEntrega?: Date;
  fechaLectura?: Date;
  configuracion?: any;
  etiquetas?: string[];
  requiereConfirmacion: boolean;
  esDismisible: boolean;
  expira: boolean;
  fechaExpiracion?: Date;
  esActiva: boolean;
  numeroIntentos: number;
  fechaUltimoIntento?: Date;
  mensajeError?: string;
  empresaId: string;
  creadoPorId: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

interface NotificacionDestinatario {
  id: string;
  notificacionId: string;
  usuarioId: string;
  email?: string;
  telefono?: string;
  nombre?: string;
  estado: EstadoNotificacion;
  fechaEnvio?: Date;
  fechaEntrega?: Date;
  fechaLectura?: Date;
  numeroIntentos: number;
  mensajeError?: string;
}

export interface FiltrosNotificaciones {
  estado?: EstadoNotificacion[];
  tipo?: TipoNotificacion[];
  prioridad?: PrioridadNotificacion[];
  categoria?: CategoriaNotificacion[];
  fechaDesde?: Date;
  fechaHasta?: Date;
  usuarioId?: string;
  casoId?: string;
  proyectoId?: string;
  clienteId?: string;
  etiquetas?: string[];
  soloNoLeidas?: boolean;
  soloExpiran?: boolean;
}

export interface EstadisticasNotificaciones {
  totalEnviadas: number;
  totalPendientes: number;
  totalLeidas: number;
  totalErrores: number;
  tasaEntrega: number;
  tasaLectura: number;
  promedioTiempoLectura: number;
  distribucionPorTipo: { [key: string]: number };
  distribucionPorEstado: { [key: string]: number };
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    // @InjectRepository(Notificacion)
    // private notificacionRepository: Repository<Notificacion>,
    // @InjectRepository(NotificacionDestinatario)
    // private destinatarioRepository: Repository<NotificacionDestinatario>,
    private eventEmitter: EventEmitter2,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Crear nueva notificación
   */
  async create(createNotificacionDto: CreateNotificacionDto, empresaId: string, usuarioId: string): Promise<any> {
    try {
      this.logger.log(`Creando notificación: ${createNotificacionDto.titulo}`);

      // Validar destinatarios
      if (!createNotificacionDto.destinatarios || createNotificacionDto.destinatarios.length === 0) {
        throw new BadRequestException('Debe especificar al menos un destinatario');
      }

      // Crear la notificación
      const notificacion = {
        id: this.generateId(),
        titulo: createNotificacionDto.titulo,
        mensaje: createNotificacionDto.mensaje,
        tipo: createNotificacionDto.tipo,
        estado: EstadoNotificacion.PENDIENTE,
        prioridad: createNotificacionDto.prioridad || PrioridadNotificacion.NORMAL,
        categoria: createNotificacionDto.categoria,
        destinatarios: createNotificacionDto.destinatarios,
        casoId: createNotificacionDto.casoId,
        proyectoId: createNotificacionDto.proyectoId,
        clienteId: createNotificacionDto.clienteId,
        documentoId: createNotificacionDto.documentoId,
        urlAccion: createNotificacionDto.urlAccion,
        textoBotonAccion: createNotificacionDto.textoBotonAccion,
        datosAdicionales: createNotificacionDto.datosAdicionales,
        fechaProgramada: createNotificacionDto.fechaProgramada ? new Date(createNotificacionDto.fechaProgramada) : null,
        configuracion: createNotificacionDto.configuracion,
        etiquetas: createNotificacionDto.etiquetas || [],
        requiereConfirmacion: createNotificacionDto.requiereConfirmacion || false,
        esDismisible: createNotificacionDto.esDismisible !== false,
        expira: createNotificacionDto.expira || false,
        fechaExpiracion: createNotificacionDto.fechaExpiracion ? new Date(createNotificacionDto.fechaExpiracion) : null,
        esActiva: true,
        numeroIntentos: 0,
        empresaId,
        creadoPorId: usuarioId,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

      // Simular guardado en base de datos
      // const savedNotificacion = await this.notificacionRepository.save(notificacion);

      // Crear registros de destinatarios
      const destinatarios = await this.crearDestinatarios(notificacion.id, createNotificacionDto.destinatarios);

      // Programar envío si es necesario
      if (notificacion.fechaProgramada) {
        await this.programarEnvioPrivado(notificacion.id, notificacion.fechaProgramada);
      } else {
        // Enviar inmediatamente
        await this.enviarNotificacion(notificacion.id);
      }

      // Emitir evento de notificación creada
      this.eventEmitter.emit('notificacion.creada', {
        notificacion,
        destinatarios,
        empresaId,
        usuarioId
      });

      return {
        ...notificacion,
        destinatarios
      };

    } catch (error) {
      this.logger.error(`Error al crear notificación: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al crear notificación: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones con filtros
   */
  async findAll(
    empresaId: string, 
    filtros: FiltrosNotificaciones = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      this.logger.log(`Obteniendo notificaciones para empresa: ${empresaId}`);

      // Simular consulta con filtros
      let notificaciones = await this.aplicarFiltros(empresaId, filtros);

      // Aplicar paginación
      const total = notificaciones.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      notificaciones = notificaciones.slice(offset, offset + limit);

      return {
        data: notificaciones,
        total,
        page,
        totalPages
      };

    } catch (error) {
      this.logger.error(`Error al obtener notificaciones: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener notificaciones: ${error.message}`);
    }
  }

  /**
   * Obtener notificación por ID
   */
  async findOne(id: string, empresaId: string): Promise<any> {
    try {
      // Simular búsqueda en base de datos
      const notificacion = await this.buscarPorId(id, empresaId);

      if (!notificacion) {
        throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
      }

      return notificacion;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al obtener notificación: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener notificación: ${error.message}`);
    }
  }

  /**
   * Actualizar notificación
   */
  async update(id: string, updateNotificacionDto: UpdateNotificacionDto, empresaId: string): Promise<any> {
    try {
      const notificacion = await this.findOne(id, empresaId);

      // Actualizar campos
      Object.assign(notificacion, {
        ...updateNotificacionDto,
        fechaActualizacion: new Date()
      });

      // Simular guardado
      // await this.notificacionRepository.save(notificacion);

      // Emitir evento de actualización
      this.eventEmitter.emit('notificacion.actualizada', {
        notificacion,
        empresaId
      });

      return notificacion;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar notificación: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al actualizar notificación: ${error.message}`);
    }
  }

  /**
   * Eliminar notificación
   */
  async remove(id: string, empresaId: string): Promise<void> {
    try {
      const notificacion = await this.findOne(id, empresaId);

      // Cancelar trabajo programado si existe
      try {
        this.schedulerRegistry.deleteCronJob(`notificacion-${id}`);
      } catch (error) {
        // El trabajo puede no existir
      }

      // Simular eliminación
      // await this.notificacionRepository.remove(notificacion);

      this.eventEmitter.emit('notificacion.eliminada', {
        notificacionId: id,
        empresaId
      });

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar notificación: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al eliminar notificación: ${error.message}`);
    }
  }

  /**
   * Marcar como leída
   */
  async marcarComoLeida(id: string, usuarioId: string, marcarLeidaDto: MarcarLeidaDto): Promise<any> {
    try {
      // Simular actualización del destinatario
      const fechaLectura = marcarLeidaDto.fechaLectura ? new Date(marcarLeidaDto.fechaLectura) : new Date();

      // Actualizar estado del destinatario
      // await this.destinatarioRepository.update(
      //   { notificacionId: id, usuarioId },
      //   { 
      //     estado: EstadoNotificacion.LEIDA,
      //     fechaLectura
      //   }
      // );

      this.eventEmitter.emit('notificacion.leida', {
        notificacionId: id,
        usuarioId,
        fechaLectura
      });

      return { success: true, fechaLectura };

    } catch (error) {
      this.logger.error(`Error al marcar como leída: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al marcar como leída: ${error.message}`);
    }
  }

  /**
   * Programar envío
   */
  async programarEnvio(id: string, programarDto: ProgramarEnvioDto): Promise<any> {
    try {
      const fechaProgramada = new Date(programarDto.fechaProgramada);

      // Actualizar notificación
      await this.update(id, { fechaProgramada: programarDto.fechaProgramada }, 'temp');

      // Programar trabajo usando el método privado
      await this.programarEnvioPrivado(id, fechaProgramada);

      return { success: true, fechaProgramada };

    } catch (error) {
      this.logger.error(`Error al programar envío: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al programar envío: ${error.message}`);
    }
  }

  /**
   * Cancelar notificación
   */
  async cancelar(id: string, empresaId: string, cancelarDto: CancelarNotificacionDto): Promise<any> {
    try {
      await this.update(id, {
        estado: EstadoNotificacion.CANCELADA,
        esActiva: false,
        mensajeError: cancelarDto.motivoCancelacion
      }, empresaId);

      // Cancelar trabajo programado
      try {
        this.schedulerRegistry.deleteCronJob(`notificacion-${id}`);
      } catch (error) {
        // El trabajo puede no existir
      }

      return { success: true };

    } catch (error) {
      this.logger.error(`Error al cancelar notificación: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al cancelar notificación: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas
   */
  async obtenerEstadisticas(empresaId: string, fechaDesde?: Date, fechaHasta?: Date): Promise<EstadisticasNotificaciones> {
    try {
      // Simular consultas estadísticas
      return {
        totalEnviadas: 150,
        totalPendientes: 25,
        totalLeidas: 120,
        totalErrores: 5,
        tasaEntrega: 96.7,
        tasaLectura: 80.0,
        promedioTiempoLectura: 3.5,
        distribucionPorTipo: {
          [TipoNotificacion.EMAIL]: 80,
          [TipoNotificacion.SISTEMA]: 50,
          [TipoNotificacion.SMS]: 15,
          [TipoNotificacion.PUSH]: 5
        },
        distribucionPorEstado: {
          [EstadoNotificacion.ENVIADA]: 150,
          [EstadoNotificacion.LEIDA]: 120,
          [EstadoNotificacion.PENDIENTE]: 25,
          [EstadoNotificacion.ERROR]: 5
        }
      };

    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Reenviar notificación
   */
  async reenviar(id: string, empresaId: string): Promise<any> {
    try {
      const notificacion = await this.findOne(id, empresaId);

      if (notificacion.estado === EstadoNotificacion.CANCELADA) {
        throw new BadRequestException('No se puede reenviar una notificación cancelada');
      }

      await this.enviarNotificacion(id);

      return { success: true };

    } catch (error) {
      this.logger.error(`Error al reenviar notificación: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al reenviar notificación: ${error.message}`);
    }
  }

  // Métodos privados auxiliares

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async crearDestinatarios(notificacionId: string, destinatarios: any[]): Promise<any[]> {
    return destinatarios.map(dest => ({
      id: this.generateId(),
      notificacionId,
      ...dest,
      estado: EstadoNotificacion.PENDIENTE,
      numeroIntentos: 0
    }));
  }

  private async programarEnvioPrivado(notificacionId: string, fechaEnvio: Date): Promise<void> {
    const job = new CronJob(fechaEnvio, async () => {
      await this.enviarNotificacion(notificacionId);
    });

    this.schedulerRegistry.addCronJob(`notificacion-${notificacionId}`, job);
    job.start();
  }

  private async enviarNotificacion(notificacionId: string): Promise<void> {
    this.logger.log(`Enviando notificación: ${notificacionId}`);
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 100));

    this.eventEmitter.emit('notificacion.enviada', {
      notificacionId,
      fechaEnvio: new Date()
    });
  }

  private async aplicarFiltros(empresaId: string, filtros: FiltrosNotificaciones): Promise<any[]> {
    // Simular aplicación de filtros
    return [];
  }

  private async buscarPorId(id: string, empresaId: string): Promise<any> {
    // Simular búsqueda
    return null;
  }
}
