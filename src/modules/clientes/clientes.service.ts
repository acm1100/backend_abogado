import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, Like } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Cliente, TipoCliente, TipoDocumento, EstadoCliente } from '../../entities/cliente.entity';
import { Usuario } from '../../entities/usuario.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

/**
 * Servicio para gestión de clientes
 * Maneja CRUD, validaciones peruanas, categorización y historial
 */
@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private configService: ConfigService,
  ) {}

  /**
   * Crear nuevo cliente
   */
  async create(createClienteDto: CreateClienteDto, currentUserId?: string): Promise<Cliente> {
    const queryRunner = this.clienteRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Determinar empresa del usuario actual
      const empresaId = currentUserId ? 
        (await this.usuarioRepository.findOne({ where: { id: currentUserId } }))?.empresaId : null;

      if (!empresaId) {
        throw new BadRequestException('No se pudo determinar la empresa');
      }

      // Validar documento de identidad
      this.validateDocumento(createClienteDto.tipoDocumento, createClienteDto.numeroDocumento);

      // Verificar si el cliente ya existe (por documento y empresa)
      const existingCliente = await this.clienteRepository.findOne({
        where: { 
          numeroDocumento: createClienteDto.numeroDocumento,
          empresaId,
        },
      });

      if (existingCliente) {
        throw new ConflictException('Ya existe un cliente con este número de documento');
      }

      // Validar consistencia entre tipo de cliente y documento
      this.validateClienteDocumentoConsistency(createClienteDto.tipo, createClienteDto.tipoDocumento);

      // Crear cliente
      const cliente = this.clienteRepository.create({
        empresaId,
        tipoCliente: createClienteDto.tipo,
        nombres: createClienteDto.nombres,
        apellidos: createClienteDto.apellidos,
        razonSocial: createClienteDto.razonSocial,
        email: createClienteDto.email,
        telefono: createClienteDto.telefono,
        tipoDocumento: createClienteDto.tipoDocumento,
        numeroDocumento: createClienteDto.numeroDocumento,
        direccion: createClienteDto.direccion ? `${createClienteDto.direccion.direccion}, ${createClienteDto.direccion.distrito}` : undefined,
        nombreCompleto: this.buildNombreCompleto(createClienteDto),
        activo: createClienteDto.activo ?? true,
        estado: EstadoCliente.ACTIVO,
        configuracion: {
          notificaciones: {
            email: true,
            sms: false,
            whatsapp: false,
          },
          preferencias: {
            idioma: 'es',
            formatoFecha: 'DD/MM/YYYY',
            moneda: 'PEN',
          },
          ...createClienteDto.configuracion,
        },
      });

      const savedCliente = await queryRunner.manager.save(cliente);

      await queryRunner.commitTransaction();

      this.logger.log(`Cliente creado: ${savedCliente.nombreCompleto} (${savedCliente.numeroDocumento})`);
      
      return this.findOne(savedCliente.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear cliente: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener todos los clientes con filtros
   */
  async findAll(filters?: {
    empresaId?: string;
    search?: string;
    tipo?: TipoCliente;
    tipoDocumento?: TipoDocumento;
    estado?: string;
    categoria?: string;
    activo?: boolean;
    fechaCreacionDesde?: Date;
    fechaCreacionHasta?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    clientes: Cliente[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      empresaId, 
      search, 
      tipo, 
      tipoDocumento, 
      estado, 
      categoria, 
      activo, 
      fechaCreacionDesde, 
      fechaCreacionHasta,
      page = 1, 
      limit = 10 
    } = filters || {};

    const queryBuilder = this.clienteRepository.createQueryBuilder('cliente');

    // Filtro por empresa (obligatorio para multi-tenancy)
    if (empresaId) {
      queryBuilder.andWhere('cliente.empresaId = :empresaId', { empresaId });
    }

    // Filtros opcionales
    if (search) {
      queryBuilder.andWhere(
        '(cliente.nombres ILIKE :search OR cliente.apellidos ILIKE :search OR cliente.nombreCompleto ILIKE :search OR cliente.numeroDocumento ILIKE :search OR cliente.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (tipo) {
      queryBuilder.andWhere('cliente.tipo = :tipo', { tipo });
    }

    if (tipoDocumento) {
      queryBuilder.andWhere('cliente.tipoDocumento = :tipoDocumento', { tipoDocumento });
    }

    if (estado) {
      queryBuilder.andWhere('cliente.estado = :estado', { estado });
    }

    if (categoria) {
      queryBuilder.andWhere(':categoria = ANY(cliente.categorias)', { categoria });
    }

    if (activo !== undefined) {
      queryBuilder.andWhere('cliente.activo = :activo', { activo });
    }

    if (fechaCreacionDesde) {
      queryBuilder.andWhere('cliente.fechaCreacion >= :fechaDesde', { fechaDesde: fechaCreacionDesde });
    }

    if (fechaCreacionHasta) {
      queryBuilder.andWhere('cliente.fechaCreacion <= :fechaHasta', { fechaHasta: fechaCreacionHasta });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('cliente.fechaCreacion', 'DESC');

    const [clientes, total] = await queryBuilder.getManyAndCount();

    return {
      clientes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener cliente por ID
   */
  async findOne(id: string, empresaId?: string): Promise<Cliente> {
    const whereCondition: any = { id };
    if (empresaId) {
      whereCondition.empresaId = empresaId;
    }

    const cliente = await this.clienteRepository.findOne({
      where: whereCondition,
      relations: ['casos', 'casos.usuario'],
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  /**
   * Obtener cliente por número de documento
   */
  async findByDocumento(numeroDocumento: string, empresaId?: string): Promise<Cliente> {
    const whereCondition: any = { numeroDocumento };
    if (empresaId) {
      whereCondition.empresaId = empresaId;
    }

    const cliente = await this.clienteRepository.findOne({
      where: whereCondition,
      relations: ['casos'],
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  /**
   * Actualizar cliente
   */
  async update(id: string, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);

    // Si se está actualizando el documento, verificar que no exista otro cliente con el mismo
    if (updateClienteDto.numeroDocumento && updateClienteDto.numeroDocumento !== cliente.numeroDocumento) {
      // Validar nuevo documento
      if (updateClienteDto.tipoDocumento) {
        this.validateDocumento(updateClienteDto.tipoDocumento, updateClienteDto.numeroDocumento);
      } else {
        this.validateDocumento(cliente.tipoDocumento as TipoDocumento, updateClienteDto.numeroDocumento);
      }

      const existingCliente = await this.clienteRepository.findOne({
        where: { 
          numeroDocumento: updateClienteDto.numeroDocumento,
          empresaId: cliente.empresaId,
        },
      });

      if (existingCliente) {
        throw new ConflictException('Ya existe un cliente con este número de documento');
      }
    }

    // Actualizar campos
    Object.assign(cliente, updateClienteDto);
    cliente.fechaActualizacion = new Date();

    // Actualizar nombre completo si es necesario
    if (updateClienteDto.nombres || updateClienteDto.apellidos) {
      cliente.nombreCompleto = this.buildNombreCompleto({
        nombres: updateClienteDto.nombres || cliente.nombres,
        apellidos: updateClienteDto.apellidos || cliente.apellidos,
        tipo: cliente.tipoCliente,
      });
    }

    // Si se actualiza la configuración, hacer merge con la existente
    if (updateClienteDto.configuracion) {
      cliente.configuracion = {
        ...cliente.configuracion,
        ...updateClienteDto.configuracion,
      };
    }

    const updatedCliente = await this.clienteRepository.save(cliente);

    this.logger.log(`Cliente actualizado: ${updatedCliente.id}`);
    
    return this.findOne(updatedCliente.id);
  }

  /**
   * Activar/Desactivar cliente
   */
  async toggleActive(id: string): Promise<Cliente> {
    const cliente = await this.findOne(id);
    
    cliente.activo = !cliente.activo;
    cliente.estado = cliente.activo ? EstadoCliente.ACTIVO : EstadoCliente.INACTIVO;
    cliente.fechaActualizacion = new Date();

    const updatedCliente = await this.clienteRepository.save(cliente);

    this.logger.log(`Cliente ${cliente.activo ? 'activado' : 'desactivado'}: ${updatedCliente.id}`);
    
    return this.findOne(updatedCliente.id);
  }

  /**
   * Eliminar cliente (soft delete)
   */
  async remove(id: string): Promise<void> {
    const cliente = await this.findOne(id);

    // Verificar si tiene casos activos
    const casosActivos = cliente.casosActivos || 0;
    if (casosActivos > 0) {
      throw new ConflictException(
        `No se puede eliminar el cliente porque tiene ${casosActivos} caso(s) activo(s)`
      );
    }

    // Soft delete
    await this.clienteRepository.softDelete(id);

    this.logger.log(`Cliente eliminado: ${cliente.nombreCompleto} (${id})`);
  }

  /**
   * Obtener estadísticas de clientes por empresa
   */
  async getStatsByEmpresa(empresaId: string): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    porTipo: Array<{ tipo: string; cantidad: number }>;
    porEstado: Array<{ estado: string; cantidad: number }>;
    porCategoria: Array<{ categoria: string; cantidad: number }>;
    recientes: Cliente[];
    topFacturacion: Cliente[];
  }> {
    // Total de clientes
    const total = await this.clienteRepository.count({
      where: { empresaId },
    });

    // Clientes activos
    const activos = await this.clienteRepository.count({
      where: { empresaId, activo: true },
    });

    // Clientes por tipo
    const clientesPorTipo = await this.clienteRepository
      .createQueryBuilder('cliente')
      .select('cliente.tipo', 'tipo')
      .addSelect('COUNT(*)', 'cantidad')
      .where('cliente.empresaId = :empresaId', { empresaId })
      .groupBy('cliente.tipo')
      .getRawMany();

    // Clientes por estado
    const clientesPorEstado = await this.clienteRepository
      .createQueryBuilder('cliente')
      .select('cliente.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('cliente.empresaId = :empresaId', { empresaId })
      .groupBy('cliente.estado')
      .getRawMany();

    // Clientes por categoría
    const clientesPorCategoria = await this.clienteRepository
      .createQueryBuilder('cliente')
      .select('categoria', 'categoria')
      .addSelect('COUNT(*)', 'cantidad')
      .where('cliente.empresaId = :empresaId', { empresaId })
      .andWhere('array_length(cliente.categorias, 1) > 0')
      .groupBy('categoria')
      .getRawMany();

    // Clientes recientes (últimos 10)
    const recientes = await this.clienteRepository.find({
      where: { empresaId },
      order: { fechaCreacion: 'DESC' },
      take: 10,
    });

    // Top clientes por facturación
    const topFacturacion = await this.clienteRepository.find({
      where: { empresaId },
      order: { totalFacturado: 'DESC' },
      take: 10,
    });

    return {
      total,
      activos,
      inactivos: total - activos,
      porTipo: clientesPorTipo,
      porEstado: clientesPorEstado,
      porCategoria: clientesPorCategoria,
      recientes,
      topFacturacion,
    };
  }

  /**
   * Buscar clientes duplicados
   */
  async findDuplicates(empresaId: string): Promise<Array<{
    criterio: string;
    clientes: Cliente[];
  }>> {
    const duplicates = [];

    // Duplicados por documento
    const duplicadosPorDocumento = await this.clienteRepository
      .createQueryBuilder('cliente')
      .select('cliente.numeroDocumento', 'documento')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('array_agg(cliente.id)', 'ids')
      .where('cliente.empresaId = :empresaId', { empresaId })
      .groupBy('cliente.numeroDocumento')
      .having('COUNT(*) > 1')
      .getRawMany();

    for (const dup of duplicadosPorDocumento) {
      const clientes = await this.clienteRepository.findByIds(dup.ids);
      duplicates.push({
        criterio: `Documento: ${dup.documento}`,
        clientes,
      });
    }

    // Duplicados por email
    const duplicadosPorEmail = await this.clienteRepository
      .createQueryBuilder('cliente')
      .select('cliente.email', 'email')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('array_agg(cliente.id)', 'ids')
      .where('cliente.empresaId = :empresaId', { empresaId })
      .andWhere('cliente.email IS NOT NULL')
      .groupBy('cliente.email')
      .having('COUNT(*) > 1')
      .getRawMany();

    for (const dup of duplicadosPorEmail) {
      const clientes = await this.clienteRepository.findByIds(dup.ids);
      duplicates.push({
        criterio: `Email: ${dup.email}`,
        clientes,
      });
    }

    return duplicates;
  }

  /**
   * Actualizar último contacto
   */
  async updateLastContact(clienteId: string, fecha?: Date): Promise<void> {
    await this.clienteRepository.update(clienteId, {
      fechaUltimoContacto: fecha || new Date(),
      fechaActualizacion: new Date(),
    });
  }

  /**
   * Validar documento de identidad peruano
   */
  private validateDocumento(tipoDocumento: TipoDocumento, numeroDocumento: string): void {
    switch (tipoDocumento) {
      case TipoDocumento.DNI:
        if (!/^\d{8}$/.test(numeroDocumento)) {
          throw new BadRequestException('El DNI debe tener exactamente 8 dígitos');
        }
        break;
      
      case TipoDocumento.RUC:
        if (!/^(10|20)\d{9}$/.test(numeroDocumento)) {
          throw new BadRequestException('El RUC debe tener 11 dígitos y comenzar con 10 o 20');
        }
        break;
      
      case TipoDocumento.PASAPORTE:
        if (!/^[A-Z0-9]{6,12}$/.test(numeroDocumento)) {
          throw new BadRequestException('El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos');
        }
        break;
      
      case TipoDocumento.CARNET_EXTRANJERIA:
        if (!/^\d{9}$/.test(numeroDocumento)) {
          throw new BadRequestException('El carnet de extranjería debe tener exactamente 9 dígitos');
        }
        break;
      
      default:
        throw new BadRequestException('Tipo de documento no válido');
    }
  }

  /**
   * Validar consistencia entre tipo de cliente y documento
   */
  private validateClienteDocumentoConsistency(tipoCliente: TipoCliente, tipoDocumento: TipoDocumento): void {
    if (tipoCliente === TipoCliente.PERSONA_NATURAL) {
      if (tipoDocumento === TipoDocumento.RUC) {
        throw new BadRequestException('Una persona natural no puede tener RUC como documento principal');
      }
    }

    if (tipoCliente === TipoCliente.EMPRESA) {
      if (tipoDocumento !== TipoDocumento.RUC) {
        throw new BadRequestException('Una empresa debe tener RUC como documento');
      }
    }
  }

  /**
   * Construir nombre completo
   */
  private buildNombreCompleto(data: { nombres: string; apellidos?: string; tipo: TipoCliente }): string {
    if (data.tipo === TipoCliente.EMPRESA) {
      return data.nombres; // Para empresas, nombres es la razón social
    }
    
    return data.apellidos ? `${data.nombres} ${data.apellidos}` : data.nombres;
  }
}
