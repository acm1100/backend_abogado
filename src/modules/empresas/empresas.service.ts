import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Empresa } from '../../entities/empresa.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { Suscripcion } from '../../entities/suscripcion.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

/**
 * Servicio para gestión de empresas
 * Maneja CRUD, validaciones RUC/SUNAT, configuraciones multi-tenant
 */
@Injectable()
export class EmpresasService {
  private readonly logger = new Logger(EmpresasService.name);

  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(Suscripcion)
    private suscripcionRepository: Repository<Suscripcion>,
    private configService: ConfigService,
  ) {}

  /**
   * Crear nueva empresa
   */
  async create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    const queryRunner = this.empresaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar si el RUC ya existe
      const existingEmpresa = await this.empresaRepository.findOne({
        where: { ruc: createEmpresaDto.ruc },
      });

      if (existingEmpresa) {
        throw new ConflictException('Ya existe una empresa registrada con este RUC');
      }

      // Validar RUC con SUNAT (simulado)
      const rucValidation = await this.validateRucWithSunat(createEmpresaDto.ruc);
      if (!rucValidation.valid) {
        throw new BadRequestException(`RUC inválido: ${rucValidation.message}`);
      }

      // Crear empresa
      const empresa = this.empresaRepository.create({
        ...createEmpresaDto,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        // Configuración predeterminada si no se proporciona
        configuracion: {
          zonaHoraria: 'America/Lima',
          formatoFecha: 'DD/MM/YYYY',
          moneda: 'PEN',
          ...createEmpresaDto.configuracion,
        },
        limites: {
          maxUsuarios: createEmpresaDto.maxUsuarios || 5,
          almacenamientoGb: createEmpresaDto.almacenamientoGb || 10,
          maxCasos: 100,
          maxClientes: 500,
        },
      });

      const savedEmpresa = await queryRunner.manager.save(empresa);

      // Crear suscripción básica por defecto
      const suscripcion = this.suscripcionRepository.create({
        empresaId: savedEmpresa.id,
        tipo: 'BASICO',
        estado: 'ACTIVA',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        configuracion: {
          maxUsuarios: createEmpresaDto.maxUsuarios || 5,
          almacenamientoGb: createEmpresaDto.almacenamientoGb || 10,
          funcionalidades: ['casos_basico', 'clientes', 'documentos', 'reportes_basico'],
        },
      });

      await queryRunner.manager.save(suscripcion);

      // Crear roles básicos para la empresa
      await this.createDefaultRoles(queryRunner, savedEmpresa.id);

      await queryRunner.commitTransaction();

      this.logger.log(`Empresa creada: ${savedEmpresa.razonSocial} (${savedEmpresa.ruc})`);
      
      return this.findOne(savedEmpresa.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear empresa: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener todas las empresas con filtros
   */
  async findAll(filters?: {
    search?: string;
    tipo?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    empresas: Empresa[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { search, tipo, activo, page = 1, limit = 10 } = filters || {};

    const queryBuilder = this.empresaRepository.createQueryBuilder('empresa')
      .leftJoinAndSelect('empresa.suscripcion', 'suscripcion')
      .leftJoinAndSelect('empresa.usuarios', 'usuarios');

    // Filtros
    if (search) {
      queryBuilder.andWhere(
        '(empresa.razonSocial ILIKE :search OR empresa.nombreComercial ILIKE :search OR empresa.ruc ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (tipo) {
      queryBuilder.andWhere('empresa.tipo = :tipo', { tipo });
    }

    if (activo !== undefined) {
      queryBuilder.andWhere('empresa.activo = :activo', { activo });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('empresa.fechaCreacion', 'DESC');

    const [empresas, total] = await queryBuilder.getManyAndCount();

    return {
      empresas,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener empresa por ID
   */
  async findOne(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
      relations: [
        'suscripcion',
        'usuarios',
        'usuarios.rol',
      ],
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return empresa;
  }

  /**
   * Obtener empresa por RUC
   */
  async findByRuc(ruc: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { ruc },
      relations: ['suscripcion'],
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return empresa;
  }

  /**
   * Actualizar empresa
   */
  async update(id: string, updateEmpresaDto: UpdateEmpresaDto): Promise<Empresa> {
    const empresa = await this.findOne(id);

    // Si se está actualizando el RUC, verificar que no exista otra empresa con el mismo
    if (updateEmpresaDto.ruc && updateEmpresaDto.ruc !== empresa.ruc) {
      const existingEmpresa = await this.empresaRepository.findOne({
        where: { ruc: updateEmpresaDto.ruc },
      });

      if (existingEmpresa) {
        throw new ConflictException('Ya existe una empresa registrada con este RUC');
      }

      // Validar nuevo RUC con SUNAT
      const rucValidation = await this.validateRucWithSunat(updateEmpresaDto.ruc);
      if (!rucValidation.valid) {
        throw new BadRequestException(`RUC inválido: ${rucValidation.message}`);
      }
    }

    // Actualizar campos
    Object.assign(empresa, updateEmpresaDto);
    empresa.fechaActualizacion = new Date();

    // Si se actualiza la configuración, hacer merge con la existente
    if (updateEmpresaDto.configuracion) {
      empresa.configuracion = {
        ...empresa.configuracion,
        ...updateEmpresaDto.configuracion,
      };
    }

    const updatedEmpresa = await this.empresaRepository.save(empresa);

    this.logger.log(`Empresa actualizada: ${updatedEmpresa.id}`);
    
    return this.findOne(updatedEmpresa.id);
  }

  /**
   * Activar/Desactivar empresa
   */
  async toggleActive(id: string): Promise<Empresa> {
    const empresa = await this.findOne(id);
    
    empresa.activo = !empresa.activo;
    empresa.fechaActualizacion = new Date();

    if (!empresa.activo) {
      // Si se desactiva la empresa, desactivar también todos sus usuarios
      await this.usuarioRepository.update(
        { empresaId: id },
        { activo: false, fechaActualizacion: new Date() }
      );
    }

    const updatedEmpresa = await this.empresaRepository.save(empresa);

    this.logger.log(`Empresa ${empresa.activo ? 'activada' : 'desactivada'}: ${updatedEmpresa.id}`);
    
    return this.findOne(updatedEmpresa.id);
  }

  /**
   * Eliminar empresa (soft delete)
   */
  async remove(id: string): Promise<void> {
    const empresa = await this.findOne(id);

    // Verificar si tiene usuarios activos
    const usuariosActivos = await this.usuarioRepository.count({
      where: { empresaId: id, activo: true },
    });

    if (usuariosActivos > 0) {
      throw new ConflictException(
        'No se puede eliminar la empresa porque tiene usuarios activos'
      );
    }

    // Soft delete
    await this.empresaRepository.softDelete(id);

    this.logger.log(`Empresa eliminada: ${empresa.razonSocial} (${id})`);
  }

  /**
   * Obtener estadísticas de la empresa
   */
  async getStats(empresaId: string): Promise<{
    usuarios: {
      total: number;
      activos: number;
      porRol: Array<{ rol: string; cantidad: number }>;
    };
    limites: {
      usuarios: { actual: number; maximo: number };
      almacenamiento: { actual: number; maximo: number };
    };
    suscripcion: {
      tipo: string;
      estado: string;
      diasRestantes: number;
    };
  }> {
    const empresa = await this.findOne(empresaId);

    // Estadísticas de usuarios
    const totalUsuarios = await this.usuarioRepository.count({
      where: { empresaId },
    });

    const usuariosActivos = await this.usuarioRepository.count({
      where: { empresaId, activo: true },
    });

    const usuariosPorRol = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoin('usuario.rol', 'rol')
      .select('rol.nombre', 'rol')
      .addSelect('COUNT(*)', 'cantidad')
      .where('usuario.empresaId = :empresaId', { empresaId })
      .groupBy('rol.nombre')
      .getRawMany();

    // Calcular días restantes de suscripción
    const diasRestantes = empresa.suscripcion?.fechaFin
      ? Math.ceil((empresa.suscripcion.fechaFin.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      usuarios: {
        total: totalUsuarios,
        activos: usuariosActivos,
        porRol: usuariosPorRol,
      },
      limites: {
        usuarios: {
          actual: totalUsuarios,
          maximo: empresa.limites?.maxUsuarios || 5,
        },
        almacenamiento: {
          actual: 0, // Calcular espacio usado real
          maximo: empresa.limites?.almacenamientoGb || 10,
        },
      },
      suscripcion: {
        tipo: empresa.suscripcion?.tipo || 'BASICO',
        estado: empresa.suscripcion?.estado || 'INACTIVA',
        diasRestantes,
      },
    };
  }

  /**
   * Validar RUC con SUNAT (simulado)
   */
  private async validateRucWithSunat(ruc: string): Promise<{
    valid: boolean;
    message?: string;
    data?: {
      razonSocial?: string;
      direccion?: string;
      estado?: string;
    };
  }> {
    // Simulación de validación con SUNAT

    
    // Validación básica de formato
    if (!/^20\d{9}$/.test(ruc)) {
      return {
        valid: false,
        message: 'El RUC debe tener 11 dígitos y comenzar con 20',
      };
    }

    // Simular respuesta exitosa
    return {
      valid: true,
      data: {
        razonSocial: 'Empresa Consultada SAC',
        direccion: 'Av. Principal 123, Lima',
        estado: 'ACTIVO',
      },
    };
  }

  /**
   * Crear roles por defecto para nueva empresa
   */
  private async createDefaultRoles(queryRunner: QueryRunner, empresaId: string): Promise<void> {
    const defaultRoles = [
      {
        nombre: 'Administrador',
        descripcion: 'Acceso completo al sistema',
        nivel: 1,
        activo: true,
        empresaId,
      },
      {
        nombre: 'Socio',
        descripcion: 'Acceso a casos y clientes asignados',
        nivel: 2,
        activo: true,
        empresaId,
      },
      {
        nombre: 'Abogado Senior',
        descripcion: 'Gestión completa de casos',
        nivel: 3,
        activo: true,
        empresaId,
      },
      {
        nombre: 'Abogado Junior',
        descripcion: 'Acceso limitado a casos asignados',
        nivel: 4,
        activo: true,
        empresaId,
      },
      {
        nombre: 'Asistente Legal',
        descripcion: 'Soporte en documentación y seguimiento',
        nivel: 5,
        activo: true,
        empresaId,
      },
    ];

    for (const rolData of defaultRoles) {
      const rol = this.rolRepository.create(rolData);
      await queryRunner.manager.save(rol);
    }
  }
}
