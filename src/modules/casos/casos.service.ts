import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindManyOptions,
  Like,
  Between,
  In,
  SelectQueryBuilder,
} from 'typeorm';
import { Caso, EstadoCaso, PrioridadCaso } from '../../entities/caso.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Usuario } from '../../entities/usuario.entity';
import { CreateCasoDto } from './dto/create-caso.dto';
import { UpdateCasoDto } from './dto/update-caso.dto';
import { FilterCasosDto } from './dto/filter-casos.dto';

@Injectable()
export class CasosService {
  constructor(
    @InjectRepository(Caso)
    private casosRepository: Repository<Caso>,
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  /**
   * Crear un nuevo caso
   */
  async create(
    createCasoDto: CreateCasoDto,
    empresaId: string,
    usuarioCreadorId: string,
  ): Promise<Caso> {
    // Verificar que el cliente exista y pertenezca a la empresa
    const cliente = await this.clientesRepository.findOne({
      where: {
        id: createCasoDto.clienteId,
        empresaId,
        activo: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException(
        'Cliente no encontrado o no pertenece a la empresa',
      );
    }

    // Verificar usuario responsable si se proporciona
    let usuarioResponsable: Usuario | null = null;
    if (createCasoDto.usuarioId) {
      usuarioResponsable = await this.usuariosRepository.findOne({
        where: {
          id: createCasoDto.usuarioId,
          empresaId,
          activo: true,
        },
      });

      if (!usuarioResponsable) {
        throw new NotFoundException(
          'Usuario responsable no encontrado o no pertenece a la empresa',
        );
      }
    }

    // Verificar número de expediente único (si se proporciona)
    if (createCasoDto.numeroExpediente) {
      const existeExpediente = await this.casosRepository.findOne({
        where: {
          numeroExpediente: createCasoDto.numeroExpediente,
          empresaId,
        },
      });

      if (existeExpediente) {
        throw new ConflictException(
          'Ya existe un caso con ese número de expediente',
        );
      }
    }

    // Generar código interno del caso
    const codigoInterno = await this.generateCodigoInterno(empresaId);

    // Crear el caso
    const caso = this.casosRepository.create({
      ...createCasoDto,
      empresaId,
      codigoInterno,
      usuarioCreadorId,
      usuarioId: createCasoDto.usuarioId || usuarioCreadorId,
      estado: createCasoDto.estado || EstadoCaso.ABIERTO,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      configuracion: {
        notificaciones: {
          recordatorios: true,
          actualizaciones: true,
          vencimientos: true,
          ...createCasoDto.configuracion?.notificaciones,
        },
        facturacion: {
          facturable: true,
          moneda: 'PEN',
          ...createCasoDto.configuracion?.facturacion,
        },
        acceso: {
          nivelAcceso: 'PUBLICO',
          equipoAsignado: [usuarioCreadorId, createCasoDto.usuarioId].filter(Boolean),
          ...createCasoDto.configuracion?.acceso,
        },
        ...createCasoDto.configuracion,
      },
    });

    const casoGuardado = await this.casosRepository.save(caso);

    // Retornar el caso con relaciones
    return this.findOne(casoGuardado.id, empresaId);
  }

  /**
   * Buscar casos con filtros y paginación
   */
  async findAll(
    filters: FilterCasosDto,
    empresaId: string,
    usuarioId?: string,
  ): Promise<{
    casos: Caso[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  }> {
    const queryBuilder = this.casosRepository
      .createQueryBuilder('caso')
      .leftJoinAndSelect('caso.cliente', 'cliente')
      .leftJoinAndSelect('caso.usuario', 'usuario')
      .leftJoinAndSelect('caso.usuarioCreador', 'usuarioCreador')
      .where('caso.empresaId = :empresaId', { empresaId });

    // Filtros de búsqueda
    this.applyFilters(queryBuilder, filters, usuarioId);

    // Ordenamiento
    const orderField = this.getOrderField(filters.ordenarPor);
    queryBuilder.orderBy(orderField, filters.direccion || 'DESC');

    // Paginación
    const pagina = filters.pagina || 1;
    const limite = Math.min(filters.limite || 20, 100);
    const offset = (pagina - 1) * limite;

    queryBuilder.skip(offset).take(limite);

    const [casos, total] = await queryBuilder.getManyAndCount();

    return {
      casos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Buscar caso por ID
   */
  async findOne(id: string, empresaId: string): Promise<Caso> {
    const caso = await this.casosRepository.findOne({
      where: { id, empresaId },
      relations: [
        'cliente',
        'usuario',
        'usuarioCreador',
        'documentos',
        'flujosTrabajo',
        'gastos',
        'facturacion',
      ],
    });

    if (!caso) {
      throw new NotFoundException('Caso no encontrado');
    }

    return caso;
  }

  /**
   * Actualizar caso
   */
  async update(
    id: string,
    updateCasoDto: UpdateCasoDto,
    empresaId: string,
    usuarioId: string,
  ): Promise<Caso> {
    const caso = await this.findOne(id, empresaId);

    // Verificar nuevo cliente si se proporciona
    if (updateCasoDto.clienteId && updateCasoDto.clienteId !== caso.clienteId) {
      const cliente = await this.clientesRepository.findOne({
        where: {
          id: updateCasoDto.clienteId,
          empresaId,
          activo: true,
        },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }
    }

    // Verificar nuevo usuario responsable si se proporciona
    if (updateCasoDto.usuarioId && updateCasoDto.usuarioId !== caso.usuarioId) {
      const usuarioResponsable = await this.usuariosRepository.findOne({
        where: {
          id: updateCasoDto.usuarioId,
          empresaId,
          activo: true,
        },
      });

      if (!usuarioResponsable) {
        throw new NotFoundException('Usuario responsable no encontrado');
      }
    }

    // Verificar cambio de número de expediente
    if (
      updateCasoDto.numeroExpediente &&
      updateCasoDto.numeroExpediente !== caso.numeroExpediente
    ) {
      const existeExpediente = await this.casosRepository.findOne({
        where: {
          numeroExpediente: updateCasoDto.numeroExpediente,
          empresaId,
          id: Not(id),
        },
      });

      if (existeExpediente) {
        throw new ConflictException(
          'Ya existe un caso con ese número de expediente',
        );
      }
    }

    // Actualizar configuración
    if (updateCasoDto.configuracion) {
      updateCasoDto.configuracion = {
        ...caso.configuracion,
        ...updateCasoDto.configuracion,
      };
    }

    // Registrar cambio de estado si aplica
    if (updateCasoDto.estado && updateCasoDto.estado !== caso.estado) {
      // Aquí se podría crear un registro de historial de estados
      caso.fechaUltimaActualizacion = new Date();
    }

    Object.assign(caso, updateCasoDto);
    caso.fechaActualizacion = new Date();

    const casoActualizado = await this.casosRepository.save(caso);
    return this.findOne(casoActualizado.id, empresaId);
  }

  /**
   * Eliminar caso (soft delete)
   */
  async remove(id: string, empresaId: string): Promise<void> {
    const caso = await this.findOne(id, empresaId);

    caso.activo = false;
    caso.fechaActualizacion = new Date();

    await this.casosRepository.save(caso);
  }

  /**
   * Obtener estadísticas de casos
   */
  async getEstadisticas(empresaId: string): Promise<{
    total: number;
    porEstado: Record<string, number>;
    porTipo: Record<string, number>;
    porPrioridad: Record<string, number>;
    vencenProximamente: number;
    sinAsignar: number;
    porcentajeResueltos: number;
  }> {
    const casos = await this.casosRepository.find({
      where: { empresaId, activo: true },
    });

    const total = casos.length;
    const porEstado = this.groupByField(casos, 'estado');
    const porTipo = this.groupByField(casos, 'tipo');
    const porPrioridad = this.groupByField(casos, 'prioridad');

    const hoy = new Date();
    const proximosMes = new Date();
    proximosMes.setMonth(proximosMes.getMonth() + 1);

    const vencenProximamente = casos.filter(
      caso =>
        caso.fechaLimite &&
        new Date(caso.fechaLimite) >= hoy &&
        new Date(caso.fechaLimite) <= proximosMes,
    ).length;

    const sinAsignar = casos.filter(caso => !caso.usuarioId).length;

    const resueltos = casos.filter(
      caso =>
        caso.estado === EstadoCaso.CERRADO || caso.estado === EstadoCaso.RESUELTO,
    ).length;

    const porcentajeResueltos = total > 0 ? (resueltos / total) * 100 : 0;

    return {
      total,
      porEstado,
      porTipo,
      porPrioridad,
      vencenProximamente,
      sinAsignar,
      porcentajeResueltos,
    };
  }

  /**
   * Asignar caso a usuario
   */
  async asignarCaso(
    casoId: string,
    usuarioId: string,
    empresaId: string,
  ): Promise<Caso> {
    const caso = await this.findOne(casoId, empresaId);

    const usuario = await this.usuariosRepository.findOne({
      where: { id: usuarioId, empresaId, activo: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    caso.usuarioId = usuarioId;
    caso.fechaActualizacion = new Date();

    if (caso.estado === EstadoCaso.ABIERTO) {
      caso.estado = EstadoCaso.EN_PROCESO;
    }

    await this.casosRepository.save(caso);
    return this.findOne(casoId, empresaId);
  }

  /**
   * Buscar casos por cliente
   */
  async findByCliente(
    clienteId: string,
    empresaId: string,
  ): Promise<Caso[]> {
    return this.casosRepository.find({
      where: { clienteId, empresaId, activo: true },
      relations: ['usuario', 'usuarioCreador'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  /**
   * Buscar casos por usuario
   */
  async findByUsuario(
    usuarioId: string,
    empresaId: string,
  ): Promise<Caso[]> {
    return this.casosRepository.find({
      where: { usuarioId, empresaId, activo: true },
      relations: ['cliente', 'usuarioCreador'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  // Métodos privados

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Caso>,
    filters: FilterCasosDto,
    usuarioId?: string,
  ): void {
    if (filters.busqueda) {
      queryBuilder.andWhere(
        '(caso.titulo ILIKE :busqueda OR caso.descripcion ILIKE :busqueda OR caso.numeroExpediente ILIKE :busqueda)',
        { busqueda: `%${filters.busqueda}%` },
      );
    }

    if (filters.tipo) {
      queryBuilder.andWhere('caso.tipo = :tipo', { tipo: filters.tipo });
    }

    if (filters.estado) {
      queryBuilder.andWhere('caso.estado = :estado', { estado: filters.estado });
    }

    if (filters.prioridad) {
      queryBuilder.andWhere('caso.prioridad = :prioridad', {
        prioridad: filters.prioridad,
      });
    }

    if (filters.clienteId) {
      queryBuilder.andWhere('caso.clienteId = :clienteId', {
        clienteId: filters.clienteId,
      });
    }

    if (filters.usuarioId) {
      queryBuilder.andWhere('caso.usuarioId = :usuarioIdFilter', {
        usuarioIdFilter: filters.usuarioId,
      });
    }

    if (filters.especialidad) {
      queryBuilder.andWhere('caso.especialidad ILIKE :especialidad', {
        especialidad: `%${filters.especialidad}%`,
      });
    }

    if (filters.juzgado) {
      queryBuilder.andWhere('caso.juzgado ILIKE :juzgado', {
        juzgado: `%${filters.juzgado}%`,
      });
    }

    if (filters.fechaInicioDesde) {
      queryBuilder.andWhere('caso.fechaInicio >= :fechaInicioDesde', {
        fechaInicioDesde: filters.fechaInicioDesde,
      });
    }

    if (filters.fechaInicioHasta) {
      queryBuilder.andWhere('caso.fechaInicio <= :fechaInicioHasta', {
        fechaInicioHasta: filters.fechaInicioHasta,
      });
    }

    if (filters.fechaLimiteDesde) {
      queryBuilder.andWhere('caso.fechaLimite >= :fechaLimiteDesde', {
        fechaLimiteDesde: filters.fechaLimiteDesde,
      });
    }

    if (filters.fechaLimiteHasta) {
      queryBuilder.andWhere('caso.fechaLimite <= :fechaLimiteHasta', {
        fechaLimiteHasta: filters.fechaLimiteHasta,
      });
    }

    if (filters.confidencial !== undefined) {
      queryBuilder.andWhere('caso.confidencial = :confidencial', {
        confidencial: filters.confidencial,
      });
    }

    if (filters.activo !== undefined) {
      queryBuilder.andWhere('caso.activo = :activo', {
        activo: filters.activo,
      });
    }

    if (filters.etiquetas && filters.etiquetas.length > 0) {
      queryBuilder.andWhere('caso.etiquetas && :etiquetas', {
        etiquetas: filters.etiquetas,
      });
    }
  }

  private getOrderField(ordenarPor?: string): string {
    const camposValidos = {
      fechaCreacion: 'caso.fechaCreacion',
      fechaActualizacion: 'caso.fechaActualizacion',
      fechaInicio: 'caso.fechaInicio',
      fechaLimite: 'caso.fechaLimite',
      titulo: 'caso.titulo',
      prioridad: 'caso.prioridad',
      estado: 'caso.estado',
      montoReclamado: 'caso.montoReclamado',
    };

    return camposValidos[ordenarPor] || 'caso.fechaCreacion';
  }

  private groupByField(casos: Caso[], field: string): Record<string, number> {
    return casos.reduce((acc, caso) => {
      const value = caso[field] || 'Sin definir';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private async generateCodigoInterno(empresaId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CASO-${year}`;

    const ultimoCaso = await this.casosRepository
      .createQueryBuilder('caso')
      .where('caso.empresaId = :empresaId', { empresaId })
      .andWhere('caso.codigoInterno LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('caso.codigoInterno', 'DESC')
      .getOne();

    let numeroSecuencial = 1;
    if (ultimoCaso && ultimoCaso.codigoInterno) {
      const match = ultimoCaso.codigoInterno.match(/-(\d+)$/);
      if (match) {
        numeroSecuencial = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${numeroSecuencial.toString().padStart(4, '0')}`;
  }
}
