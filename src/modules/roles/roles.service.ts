import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, In } from 'typeorm';

import { Rol } from '../../entities/rol.entity';
import { Permiso } from '../../entities/permiso.entity';
import { RolPermiso } from '../../entities/rol-permiso.entity';
import { Usuario } from '../../entities/usuario.entity';
import { CreateRolDto, AssignPermissionsDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { CreatePermisoDto, UpdatePermisoDto } from './dto/permiso.dto';

/**
 * Servicio para gestión de roles y permisos
 * Maneja RBAC jerárquico, asignación de permisos y validaciones
 */
@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(Permiso)
    private permisoRepository: Repository<Permiso>,
    @InjectRepository(RolPermiso)
    private rolPermisoRepository: Repository<RolPermiso>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Crear nuevo rol
   */
  async createRol(createRolDto: CreateRolDto, currentUserId?: string): Promise<Rol> {
    const queryRunner = this.rolRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Determinar empresa
      const empresaId = createRolDto.empresaId || 
        (currentUserId ? (await this.usuarioRepository.findOne({ where: { id: currentUserId } }))?.empresaId : null);

      if (!empresaId) {
        throw new BadRequestException('No se pudo determinar la empresa');
      }

      // Verificar si el nombre ya existe en la empresa
      const existingRol = await this.rolRepository.findOne({
        where: { 
          nombre: createRolDto.nombre,
          empresaId,
        },
      });

      if (existingRol) {
        throw new ConflictException('Ya existe un rol con este nombre en la empresa');
      }

      // Crear rol
      const rol = this.rolRepository.create({
        ...createRolDto,
        empresaId,
        activo: createRolDto.activo ?? true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      });

      const savedRol = await queryRunner.manager.save(rol);

      // Asignar permisos si se proporcionan
      if (createRolDto.permisos && createRolDto.permisos.length > 0) {
        await this.assignPermissionsToRole(savedRol.id, createRolDto.permisos, queryRunner);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Rol creado: ${savedRol.nombre} en empresa ${empresaId}`);
      
      return this.findOneRol(savedRol.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear rol: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener todos los roles con filtros
   */
  async findAllRoles(filters?: {
    empresaId?: string;
    search?: string;
    activo?: boolean;
    nivel?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    roles: Rol[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { empresaId, search, activo, nivel, page = 1, limit = 10 } = filters || {};

    const queryBuilder = this.rolRepository.createQueryBuilder('rol')
      .leftJoinAndSelect('rol.permisos', 'rolPermisos')
      .leftJoinAndSelect('rolPermisos.permiso', 'permiso')
      .leftJoin('rol.usuarios', 'usuarios')
      .addSelect('COUNT(usuarios.id)', 'cantidadUsuarios')
      .groupBy('rol.id, rolPermisos.id, permiso.id');

    // Filtro por empresa (obligatorio para multi-tenancy)
    if (empresaId) {
      queryBuilder.andWhere('rol.empresaId = :empresaId', { empresaId });
    }

    // Filtros opcionales
    if (search) {
      queryBuilder.andWhere(
        '(rol.nombre ILIKE :search OR rol.descripcion ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (activo !== undefined) {
      queryBuilder.andWhere('rol.activo = :activo', { activo });
    }

    if (nivel !== undefined) {
      queryBuilder.andWhere('rol.nivel = :nivel', { nivel });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenamiento por nivel jerárquico
    queryBuilder.orderBy('rol.nivel', 'ASC');

    const [roles, total] = await queryBuilder.getManyAndCount();

    return {
      roles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener rol por ID
   */
  async findOneRol(id: string, empresaId?: string): Promise<Rol> {
    const whereCondition: any = { id };
    if (empresaId) {
      whereCondition.empresaId = empresaId;
    }

    const rol = await this.rolRepository.findOne({
      where: whereCondition,
      relations: [
        'permisos',
        'permisos.permiso',
        'usuarios',
      ],
    });

    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }

    return rol;
  }

  /**
   * Actualizar rol
   */
  async updateRol(id: string, updateRolDto: UpdateRolDto, currentUserId?: string): Promise<Rol> {
    const rol = await this.findOneRol(id);

    // Verificar permisos de nivel jerárquico
    if (currentUserId) {
      await this.validateHierarchyPermissions(currentUserId, rol.nivel);
    }

    // Si se está actualizando el nombre, verificar que no exista otro rol con el mismo
    if (updateRolDto.nombre && updateRolDto.nombre !== rol.nombre) {
      const existingRol = await this.rolRepository.findOne({
        where: { 
          nombre: updateRolDto.nombre,
          empresaId: rol.empresaId,
        },
      });

      if (existingRol) {
        throw new ConflictException('Ya existe un rol con este nombre en la empresa');
      }
    }

    // Actualizar campos
    Object.assign(rol, updateRolDto);
    rol.fechaActualizacion = new Date();

    const updatedRol = await this.rolRepository.save(rol);

    this.logger.log(`Rol actualizado: ${updatedRol.id}`);
    
    return this.findOneRol(updatedRol.id);
  }

  /**
   * Eliminar rol
   */
  async removeRol(id: string, currentUserId?: string): Promise<void> {
    const rol = await this.findOneRol(id);

    // Verificar permisos de nivel jerárquico
    if (currentUserId) {
      await this.validateHierarchyPermissions(currentUserId, rol.nivel);
    }

    // Verificar si tiene usuarios asignados
    const usuariosConRol = await this.usuarioRepository.count({
      where: { rolId: id, activo: true },
    });

    if (usuariosConRol > 0) {
      throw new ConflictException(
        `No se puede eliminar el rol porque tiene ${usuariosConRol} usuario(s) asignado(s)`
      );
    }

    // Eliminar relaciones con permisos primero
    await this.rolPermisoRepository.delete({ rolId: id });

    // Soft delete del rol
    await this.rolRepository.softDelete(id);

    this.logger.log(`Rol eliminado: ${rol.nombre} (${id})`);
  }

  /**
   * Asignar permisos a un rol
   */
  async assignPermissions(rolId: string, assignDto: AssignPermissionsDto, currentUserId?: string): Promise<Rol> {
    const rol = await this.findOneRol(rolId);

    // Verificar permisos de nivel jerárquico
    if (currentUserId) {
      await this.validateHierarchyPermissions(currentUserId, rol.nivel);
    }

    const queryRunner = this.rolRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Eliminar permisos actuales
      await queryRunner.manager.delete(RolPermiso, { rolId });

      // Asignar nuevos permisos
      if (assignDto.permisos.length > 0) {
        await this.assignPermissionsToRole(rolId, assignDto.permisos, queryRunner);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Permisos asignados al rol: ${rolId}`);
      
      return this.findOneRol(rolId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al asignar permisos: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crear nuevo permiso
   */
  async createPermiso(createPermisoDto: CreatePermisoDto): Promise<Permiso> {
    // Verificar si el código ya existe
    const existingPermiso = await this.permisoRepository.findOne({
      where: { codigo: createPermisoDto.codigo },
    });

    if (existingPermiso) {
      throw new ConflictException('Ya existe un permiso con este código');
    }

    const permiso = this.permisoRepository.create({
      ...createPermisoDto,
      activo: createPermisoDto.activo ?? true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    const savedPermiso = await this.permisoRepository.save(permiso);

    this.logger.log(`Permiso creado: ${savedPermiso.codigo}`);
    
    return savedPermiso;
  }

  /**
   * Obtener todos los permisos
   */
  async findAllPermisos(filters?: {
    search?: string;
    modulo?: string;
    accion?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    permisos: Permiso[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { search, modulo, accion, activo, page = 1, limit = 20 } = filters || {};

    const queryBuilder = this.permisoRepository.createQueryBuilder('permiso');

    // Filtros
    if (search) {
      queryBuilder.andWhere(
        '(permiso.codigo ILIKE :search OR permiso.nombre ILIKE :search OR permiso.descripcion ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (modulo) {
      queryBuilder.andWhere('permiso.modulo = :modulo', { modulo });
    }

    if (accion) {
      queryBuilder.andWhere('permiso.accion = :accion', { accion });
    }

    if (activo !== undefined) {
      queryBuilder.andWhere('permiso.activo = :activo', { activo });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('permiso.modulo', 'ASC')
                 .addOrderBy('permiso.accion', 'ASC');

    const [permisos, total] = await queryBuilder.getManyAndCount();

    return {
      permisos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener permisos agrupados por módulo
   */
  async getPermisosGroupedByModule(): Promise<Record<string, Permiso[]>> {
    const permisos = await this.permisoRepository.find({
      where: { activo: true },
      order: { modulo: 'ASC', accion: 'ASC' },
    });

    return permisos.reduce((grouped, permiso) => {
      if (!grouped[permiso.modulo]) {
        grouped[permiso.modulo] = [];
      }
      grouped[permiso.modulo].push(permiso);
      return grouped;
    }, {} as Record<string, Permiso[]>);
  }

  /**
   * Actualizar permiso
   */
  async updatePermiso(id: string, updatePermisoDto: UpdatePermisoDto): Promise<Permiso> {
    const permiso = await this.permisoRepository.findOne({ where: { id } });

    if (!permiso) {
      throw new NotFoundException('Permiso no encontrado');
    }

    Object.assign(permiso, updatePermisoDto);
    permiso.fechaActualizacion = new Date();

    const updatedPermiso = await this.permisoRepository.save(permiso);

    this.logger.log(`Permiso actualizado: ${updatedPermiso.id}`);
    
    return updatedPermiso;
  }

  /**
   * Inicializar permisos por defecto del sistema
   */
  async initializeDefaultPermissions(): Promise<void> {
    const defaultPermisos = [
      // Usuarios
      { codigo: 'usuarios.crear', nombre: 'Crear usuarios', modulo: 'usuarios', accion: 'crear' },
      { codigo: 'usuarios.listar', nombre: 'Listar usuarios', modulo: 'usuarios', accion: 'listar' },
      { codigo: 'usuarios.ver', nombre: 'Ver usuarios', modulo: 'usuarios', accion: 'ver' },
      { codigo: 'usuarios.editar', nombre: 'Editar usuarios', modulo: 'usuarios', accion: 'editar' },
      { codigo: 'usuarios.eliminar', nombre: 'Eliminar usuarios', modulo: 'usuarios', accion: 'eliminar' },
      { codigo: 'usuarios.administrar', nombre: 'Administrar usuarios', modulo: 'usuarios', accion: 'administrar' },
      
      // Roles
      { codigo: 'roles.crear', nombre: 'Crear roles', modulo: 'roles', accion: 'crear' },
      { codigo: 'roles.listar', nombre: 'Listar roles', modulo: 'roles', accion: 'listar' },
      { codigo: 'roles.ver', nombre: 'Ver roles', modulo: 'roles', accion: 'ver' },
      { codigo: 'roles.editar', nombre: 'Editar roles', modulo: 'roles', accion: 'editar' },
      { codigo: 'roles.eliminar', nombre: 'Eliminar roles', modulo: 'roles', accion: 'eliminar' },
      
      // Empresas
      { codigo: 'empresas.crear', nombre: 'Crear empresas', modulo: 'empresas', accion: 'crear' },
      { codigo: 'empresas.listar', nombre: 'Listar empresas', modulo: 'empresas', accion: 'listar' },
      { codigo: 'empresas.ver', nombre: 'Ver empresas', modulo: 'empresas', accion: 'ver' },
      { codigo: 'empresas.editar', nombre: 'Editar empresas', modulo: 'empresas', accion: 'editar' },
      { codigo: 'empresas.administrar', nombre: 'Administrar empresas', modulo: 'empresas', accion: 'administrar' },
      
      // Clientes
      { codigo: 'clientes.crear', nombre: 'Crear clientes', modulo: 'clientes', accion: 'crear' },
      { codigo: 'clientes.listar', nombre: 'Listar clientes', modulo: 'clientes', accion: 'listar' },
      { codigo: 'clientes.ver', nombre: 'Ver clientes', modulo: 'clientes', accion: 'ver' },
      { codigo: 'clientes.editar', nombre: 'Editar clientes', modulo: 'clientes', accion: 'editar' },
      { codigo: 'clientes.eliminar', nombre: 'Eliminar clientes', modulo: 'clientes', accion: 'eliminar' },
      
      // Casos
      { codigo: 'casos.crear', nombre: 'Crear casos', modulo: 'casos', accion: 'crear' },
      { codigo: 'casos.listar', nombre: 'Listar casos', modulo: 'casos', accion: 'listar' },
      { codigo: 'casos.ver', nombre: 'Ver casos', modulo: 'casos', accion: 'ver' },
      { codigo: 'casos.editar', nombre: 'Editar casos', modulo: 'casos', accion: 'editar' },
      { codigo: 'casos.eliminar', nombre: 'Eliminar casos', modulo: 'casos', accion: 'eliminar' },
      { codigo: 'casos.gestionar', nombre: 'Gestionar casos', modulo: 'casos', accion: 'administrar' },
    ];

    for (const permisoData of defaultPermisos) {
      const existingPermiso = await this.permisoRepository.findOne({
        where: { codigo: permisoData.codigo },
      });

      if (!existingPermiso) {
        const permiso = this.permisoRepository.create({
          ...permisoData,
          descripcion: `Permiso para ${permisoData.nombre.toLowerCase()}`,
          activo: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
        });

        await this.permisoRepository.save(permiso);
        this.logger.log(`Permiso inicializado: ${permiso.codigo}`);
      }
    }
  }

  /**
   * Validar permisos jerárquicos
   */
  private async validateHierarchyPermissions(currentUserId: string, targetNivel: number): Promise<void> {
    const currentUser = await this.usuarioRepository.findOne({
      where: { id: currentUserId },
      relations: ['rol'],
    });

    if (!currentUser?.rol) {
      throw new ForbiddenException('Usuario sin rol asignado');
    }

    // Solo se pueden gestionar roles de nivel inferior
    if (currentUser.rol.nivel >= targetNivel) {
      throw new ForbiddenException('No puede gestionar roles de nivel superior o igual');
    }
  }

  /**
   * Asignar permisos a rol (método auxiliar)
   */
  private async assignPermissionsToRole(
    rolId: string, 
    permisoIds: string[], 
    queryRunner: QueryRunner
  ): Promise<void> {
    // Verificar que todos los permisos existen
    const permisos = await this.permisoRepository.findBy({
      id: In(permisoIds),
      activo: true,
    });

    if (permisos.length !== permisoIds.length) {
      throw new NotFoundException('Uno o más permisos no fueron encontrados o están inactivos');
    }

    // Crear relaciones rol-permiso
    const rolPermisos = permisoIds.map(permisoId => 
      this.rolPermisoRepository.create({
        rolId,
        permisoId,
        fechaAsignacion: new Date(),
      })
    );

    await queryRunner.manager.save(rolPermisos);
  }
}
