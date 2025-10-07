import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { CreateEventoDto, UpdateEventoDto, FiltrosAgendaDto } from './dto';
import { Evento, EstadoEvento } from '../../entities/evento.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Caso } from '../../entities/caso.entity';
import { Cliente } from '../../entities/cliente.entity';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Caso)
    private readonly casoRepository: Repository<Caso>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async create(createEventoDto: CreateEventoDto, empresaId: string): Promise<Evento> {
    const evento = this.eventoRepository.create({
      ...createEventoDto,
      empresaId,
    });

    // Validar responsable si se proporciona
    if (createEventoDto.responsableId) {
      const responsable = await this.usuarioRepository.findOne({
        where: {
          id: createEventoDto.responsableId,
          empresaId,
          activo: true,
        },
      });

      if (!responsable) {
        throw new Error('Responsable no válido');
      }
    }

    // Validar caso si se proporciona
    if (createEventoDto.casoId) {
      const caso = await this.casoRepository.findOne({
        where: {
          id: createEventoDto.casoId,
          empresaId,
          activo: true,
        },
      });

      if (!caso) {
        throw new Error('Caso no válido');
      }
    }

    // Validar cliente si se proporciona
    if (createEventoDto.clienteId) {
      const cliente = await this.clienteRepository.findOne({
        where: {
          id: createEventoDto.clienteId,
          empresaId,
          activo: true,
        },
      });

      if (!cliente) {
        throw new Error('Cliente no válido');
      }
    }

    return this.eventoRepository.save(evento);
  }

  async findAll(filtros: FiltrosAgendaDto, empresaId: string): Promise<Evento[]> {
    const queryBuilder = this.eventoRepository
      .createQueryBuilder('evento')
      .leftJoinAndSelect('evento.responsable', 'responsable')
      .leftJoinAndSelect('evento.caso', 'caso')
      .leftJoinAndSelect('evento.cliente', 'cliente')
      .where('evento.empresaId = :empresaId', { empresaId });

    // Filtros de fecha
    if (filtros.fechaInicio && filtros.fechaFin) {
      queryBuilder.andWhere('evento.fechaInicio BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
      });
    } else if (filtros.fechaInicio) {
      queryBuilder.andWhere('evento.fechaInicio >= :fechaInicio', {
        fechaInicio: filtros.fechaInicio,
      });
    } else if (filtros.fechaFin) {
      queryBuilder.andWhere('evento.fechaInicio <= :fechaFin', {
        fechaFin: filtros.fechaFin,
      });
    }

    // Filtro por tipo
    if (filtros.tipo) {
      queryBuilder.andWhere('evento.tipo = :tipo', { tipo: filtros.tipo });
    }

    // Filtro por estado
    if (filtros.estado) {
      queryBuilder.andWhere('evento.estado = :estado', { estado: filtros.estado });
    }

    // Filtro por responsable
    if (filtros.responsableId) {
      queryBuilder.andWhere('evento.responsableId = :responsableId', {
        responsableId: filtros.responsableId,
      });
    }

    // Filtro por caso
    if (filtros.casoId) {
      queryBuilder.andWhere('evento.casoId = :casoId', { casoId: filtros.casoId });
    }

    // Filtro por cliente
    if (filtros.clienteId) {
      queryBuilder.andWhere('evento.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    // Ordenamiento
    queryBuilder.orderBy('evento.fechaInicio', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: string, empresaId: string): Promise<Evento> {
    const evento = await this.eventoRepository.findOne({
      where: { id, empresaId },
      relations: ['responsable', 'caso', 'cliente'],
    });

    if (!evento) {
      throw new Error('Evento no encontrado');
    }

    return evento;
  }

  async update(id: string, updateEventoDto: UpdateEventoDto, empresaId: string): Promise<Evento> {
    const evento = await this.findOne(id, empresaId);

    // Validaciones similares al create
    if (updateEventoDto.responsableId) {
      const responsable = await this.usuarioRepository.findOne({
        where: {
          id: updateEventoDto.responsableId,
          empresaId,
          activo: true,
        },
      });

      if (!responsable) {
        throw new Error('Responsable no válido');
      }
    }

    if (updateEventoDto.casoId) {
      const caso = await this.casoRepository.findOne({
        where: {
          id: updateEventoDto.casoId,
          empresaId,
          activo: true,
        },
      });

      if (!caso) {
        throw new Error('Caso no válido');
      }
    }

    if (updateEventoDto.clienteId) {
      const cliente = await this.clienteRepository.findOne({
        where: {
          id: updateEventoDto.clienteId,
          empresaId,
          activo: true,
        },
      });

      if (!cliente) {
        throw new Error('Cliente no válido');
      }
    }

    Object.assign(evento, updateEventoDto);
    return this.eventoRepository.save(evento);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const evento = await this.findOne(id, empresaId);
    evento.activo = false;
    await this.eventoRepository.save(evento);
  }

  async obtenerEventosDelDia(fecha: Date, empresaId: string): Promise<Evento[]> {
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);

    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    return this.eventoRepository.find({
      where: {
        empresaId,
        fechaInicio: Between(inicioDelDia, finDelDia),
        activo: true,
      },
      relations: ['responsable', 'caso', 'cliente'],
      order: { fechaInicio: 'ASC' },
    });
  }

  async obtenerEventosProximos(empresaId: string, dias: number = 7): Promise<Evento[]> {
    const ahora = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(ahora.getDate() + dias);

    return this.eventoRepository.find({
      where: {
        empresaId,
        fechaInicio: Between(ahora, fechaLimite),
        activo: true,
      },
      relations: ['responsable', 'caso', 'cliente'],
      order: { fechaInicio: 'ASC' },
    });
  }

  async obtenerEventosPorUsuario(usuarioId: string, empresaId: string): Promise<Evento[]> {
    return this.eventoRepository.find({
      where: {
        responsableId: usuarioId,
        empresaId,
        activo: true,
      },
      relations: ['caso', 'cliente'],
      order: { fechaInicio: 'ASC' },
    });
  }

  async marcarComoCompletado(id: string, empresaId: string): Promise<Evento> {
    const evento = await this.findOne(id, empresaId);
    evento.estado = EstadoEvento.COMPLETADO;
    evento.fechaFinalizacion = new Date();
    return this.eventoRepository.save(evento);
  }

  async reagendarEvento(
    id: string, 
    nuevaFecha: Date, 
    empresaId: string,
    motivo?: string
  ): Promise<Evento> {
    const evento = await this.findOne(id, empresaId);
    
    const duracion = evento.fechaFin.getTime() - evento.fechaInicio.getTime();
    
    evento.fechaInicio = nuevaFecha;
    evento.fechaFin = new Date(nuevaFecha.getTime() + duracion);
    
    if (motivo) {
      evento.observaciones = `${evento.observaciones || ''}\nReagendado: ${motivo}`.trim();
    }

    return this.eventoRepository.save(evento);
  }

  async obtenerResumenSemanal(empresaId: string): Promise<any> {
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const eventos = await this.eventoRepository.find({
      where: {
        empresaId,
        fechaInicio: Between(inicioSemana, finSemana),
        activo: true,
      },
      relations: ['responsable'],
    });

    const resumen = {
      totalEventos: eventos.length,
      completados: eventos.filter(e => e.estado === EstadoEvento.COMPLETADO).length,
      pendientes: eventos.filter(e => e.estado === EstadoEvento.PENDIENTE).length,
      cancelados: eventos.filter(e => e.estado === EstadoEvento.CANCELADO).length,
      porTipo: {},
      porResponsable: {},
    };

    // Agrupar por tipo
    eventos.forEach(evento => {
      if (!resumen.porTipo[evento.tipo]) {
        resumen.porTipo[evento.tipo] = 0;
      }
      resumen.porTipo[evento.tipo]++;
    });

    // Agrupar por responsable
    eventos.forEach(evento => {
      if (evento.responsable) {
        const nombreCompleto = `${evento.responsable.nombre} ${evento.responsable.apellidos}`;
        if (!resumen.porResponsable[nombreCompleto]) {
          resumen.porResponsable[nombreCompleto] = 0;
        }
        resumen.porResponsable[nombreCompleto]++;
      }
    });

    return resumen;
  }
}
