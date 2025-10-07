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
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../../entities/usuario.entity';
import { Empresa } from '../../entities/empresa.entity';
import { Rol } from '../../entities/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto, ChangeUserPasswordDto } from './dto/update-usuario.dto';

/**
 * Servicio para gestión de usuarios
 * Maneja CRUD, RBAC, validaciones y configuraciones personales
 */
@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    private configService: ConfigService,
  ) {}

  /**
   * Crear nuevo usuario
   */
  async create(createUsuarioDto: CreateUsuarioDto, currentUserId?: string): Promise<Usuario> {
    const queryRunner = this.usuarioRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar si el email ya existe en la empresa
      const empresaId = createUsuarioDto.empresaId || 
        (currentUserId ? (await this.findOne(currentUserId)).empresaId : null);

      if (!empresaId) {
        throw new BadRequestException('No se pudo determinar la empresa');
      }

      // Verificar empresa existe y está activa
      const empresa = await this.empresaRepository.findOne({
        where: { id: empresaId, activo: true },
        relations: ['suscripciones'],
      });

      if (!empresa) {
        throw new NotFoundException('Empresa no encontrada o inactiva');
      }

      // Verificar límites de usuarios
      const usuariosActuales = await this.usuarioRepository.count({
        where: { empresaId, activo: true },
      });

      const maxUsuarios = empresa.limites?.maxUsuarios || 5;
      if (usuariosActuales >= maxUsuarios) {
        throw new ConflictException(
          `Se ha alcanzado el límite máximo de usuarios (${maxUsuarios}). Actualice su plan.`
        );
      }

      // Verificar si el email ya existe en la empresa
      const existingUser = await this.usuarioRepository.findOne({
        where: { 
          email: createUsuarioDto.email,
          empresaId,
        },
      });

      if (existingUser) {
        throw new ConflictException('Ya existe un usuario con este email en la empresa');
      }

      // Verificar si el DNI ya existe en la empresa
      const existingDni = await this.usuarioRepository.findOne({
        where: { 
          dni: createUsuarioDto.dni,
          empresaId,
        },
      });

      if (existingDni) {
        throw new ConflictException('Ya existe un usuario con este DNI en la empresa');
      }

      // Verificar que el rol existe y pertenece a la empresa
      const rol = await this.rolRepository.findOne({
        where: { 
          id: createUsuarioDto.rolId,
          empresaId,
          activo: true,
        },
      });

      if (!rol) {
        throw new NotFoundException('Rol no encontrado o no válido para esta empresa');
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(createUsuarioDto.password, this.saltRounds);

      // Crear usuario
      const usuario = this.usuarioRepository.create({
        ...createUsuarioDto,
        empresaId,
        password: hashedPassword,
        activo: createUsuarioDto.activo ?? true,
        requiereCambioPassword: createUsuarioDto.requiereCambioPassword ?? true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        configuracionPersonal: {
          tema: 'light',
          idioma: 'es',
          zonaHoraria: 'America/Lima',
          formatoFecha: 'DD/MM/YYYY',
          notificaciones: {
            email: true,
            push: true,
            sms: false,
            frecuencia: 'inmediata',
          },
          ...createUsuarioDto.configuracionPersonal,
        },
        intentosFallidos: 0,
        fechaBloqueo: null,
      });

      const savedUsuario = await queryRunner.manager.save(usuario);

      await queryRunner.commitTransaction();

      this.logger.log(`Usuario creado: ${savedUsuario.email} en empresa ${empresaId}`);
      
      return this.findOne(savedUsuario.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear usuario: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener todos los usuarios con filtros
   */
  async findAll(filters?: {
    empresaId?: string;
    search?: string;
    rolId?: string;
    activo?: boolean;
    especialidad?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    usuarios: Usuario[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { 
      empresaId, 
      search, 
      rolId, 
      activo, 
      especialidad, 
      page = 1, 
      limit = 10 
    } = filters || {};

    const queryBuilder = this.usuarioRepository.createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.empresa', 'empresa')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .leftJoinAndSelect('rol.permisos', 'rolPermisos')
      .leftJoinAndSelect('rolPermisos.permiso', 'permiso');

    // Filtro por empresa (obligatorio para multi-tenancy)
    if (empresaId) {
      queryBuilder.andWhere('usuario.empresaId = :empresaId', { empresaId });
    }

    // Filtros opcionales
    if (search) {
      queryBuilder.andWhere(
        '(usuario.nombre ILIKE :search OR usuario.apellidos ILIKE :search OR usuario.email ILIKE :search OR usuario.dni ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (rolId) {
      queryBuilder.andWhere('usuario.rolId = :rolId', { rolId });
    }

    if (activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', { activo });
    }

    if (especialidad) {
      queryBuilder.andWhere(':especialidad = ANY(usuario.especialidades)', { especialidad });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('usuario.fechaCreacion', 'DESC');

    const [usuarios, total] = await queryBuilder.getManyAndCount();

    return {
      usuarios,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener usuario por ID
   */
  async findOne(id: string, empresaId?: string): Promise<Usuario> {
    const whereCondition: any = { id };
    if (empresaId) {
      whereCondition.empresaId = empresaId;
    }

    const usuario = await this.usuarioRepository.findOne({
      where: whereCondition,
      relations: [
        'empresa',
        'rol',
        'rol.permisos',
        'rol.permisos.permiso',
      ],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Obtener usuario por email
   */
  async findByEmail(email: string, empresaId?: string): Promise<Usuario> {
    const whereCondition: any = { email };
    if (empresaId) {
      whereCondition.empresaId = empresaId;
    }

    const usuario = await this.usuarioRepository.findOne({
      where: whereCondition,
      relations: [
        'empresa',
        'rol',
        'rol.permisos',
        'rol.permisos.permiso',
      ],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Actualizar usuario
   */
  async update(
    id: string, 
    updateUsuarioDto: UpdateUsuarioDto, 
    currentUserId?: string
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    // Verificar permisos si no es el mismo usuario
    if (currentUserId && currentUserId !== id) {
      const currentUser = await this.findOne(currentUserId);
      
      // Solo administradores o usuarios con permisos pueden editar otros usuarios
      if (!currentUser.puedeAccederModulo('usuarios') || 
          !currentUser.tienePermiso('usuarios', 'editar')) {
        throw new ForbiddenException('No tiene permisos para editar este usuario');
      }

      // No se puede editar usuarios de nivel superior
      if (usuario.rol && currentUser.rol && usuario.rol.nivel <= currentUser.rol.nivel) {
        throw new ForbiddenException('No puede editar usuarios de nivel superior o igual');
      }
    }

    // Si se está actualizando el email, verificar que no exista otro usuario con el mismo
    if (updateUsuarioDto.email && updateUsuarioDto.email !== usuario.email) {
      const existingUser = await this.usuarioRepository.findOne({
        where: { 
          email: updateUsuarioDto.email,
          empresaId: usuario.empresaId,
        },
      });

      if (existingUser) {
        throw new ConflictException('Ya existe un usuario con este email en la empresa');
      }
    }

    // Si se está actualizando el DNI, verificar que no exista otro usuario con el mismo
    if (updateUsuarioDto.dni && updateUsuarioDto.dni !== usuario.dni) {
      const existingDni = await this.usuarioRepository.findOne({
        where: { 
          dni: updateUsuarioDto.dni,
          empresaId: usuario.empresaId,
        },
      });

      if (existingDni) {
        throw new ConflictException('Ya existe un usuario con este DNI en la empresa');
      }
    }

    // Si se está actualizando el rol, verificar que existe y pertenece a la empresa
    if (updateUsuarioDto.rolId && updateUsuarioDto.rolId !== usuario.rolId) {
      const rol = await this.rolRepository.findOne({
        where: { 
          id: updateUsuarioDto.rolId,
          empresaId: usuario.empresaId,
          activo: true,
        },
      });

      if (!rol) {
        throw new NotFoundException('Rol no encontrado o no válido para esta empresa');
      }
    }

    // Actualizar campos
    Object.assign(usuario, updateUsuarioDto);
    usuario.fechaActualizacion = new Date();

    // Si se actualiza la configuración personal, hacer merge con la existente
    if (updateUsuarioDto.configuracionPersonal) {
      usuario.configuracionPersonal = {
        ...usuario.configuracionPersonal,
        ...updateUsuarioDto.configuracionPersonal,
      };
    }

    const updatedUsuario = await this.usuarioRepository.save(usuario);

    this.logger.log(`Usuario actualizado: ${updatedUsuario.id}`);
    
    return this.findOne(updatedUsuario.id);
  }

  /**
   * Cambiar contraseña de usuario (por administrador)
   */
  async changeUserPassword(
    userId: string,
    changePasswordDto: ChangeUserPasswordDto,
    currentUserId: string
  ): Promise<void> {
    const usuario = await this.findOne(userId);
    const currentUser = await this.findOne(currentUserId);

    // Verificar permisos
    if (!currentUser.tienePermiso('usuarios', 'administrar')) {
      throw new ForbiddenException('No tiene permisos para cambiar contraseñas de otros usuarios');
    }

    // No se puede cambiar contraseña de usuarios de nivel superior
    if (usuario.rol && currentUser.rol && usuario.rol.nivel <= currentUser.rol.nivel) {
      throw new ForbiddenException('No puede cambiar contraseñas de usuarios de nivel superior o igual');
    }

    // Generar nueva contraseña si no se proporciona
    let newPassword = changePasswordDto.newPassword;
    if (!newPassword) {
      newPassword = this.generateRandomPassword();
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
    
    // Actualizar contraseña
    usuario.password = hashedPassword;
    usuario.fechaUltimoCambioPassword = new Date();
    usuario.requiereCambioPassword = changePasswordDto.forcePasswordChange ?? true;
    usuario.intentosFallidos = 0;
    usuario.fechaBloqueo = null;
    
    await this.usuarioRepository.save(usuario);

    this.logger.log(`Contraseña cambiada por administrador para usuario ${userId}`);
    
    // En producción, enviar la nueva contraseña por email seguro
    this.logger.log(`Nueva contraseña temporal para ${usuario.email}: ${newPassword}`);
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleActive(userId: string, currentUserId: string): Promise<Usuario> {
    const usuario = await this.findOne(userId);
    const currentUser = await this.findOne(currentUserId);

    // Verificar permisos
    if (!currentUser.tienePermiso('usuarios', 'administrar')) {
      throw new ForbiddenException('No tiene permisos para activar/desactivar usuarios');
    }

    // No se puede desactivar a sí mismo
    if (userId === currentUserId) {
      throw new BadRequestException('No puede desactivar su propio usuario');
    }

    // No se puede desactivar usuarios de nivel superior
    if (usuario.rol && currentUser.rol && usuario.rol.nivel <= currentUser.rol.nivel) {
      throw new ForbiddenException('No puede desactivar usuarios de nivel superior o igual');
    }

    usuario.activo = !usuario.activo;
    usuario.fechaActualizacion = new Date();

    const updatedUsuario = await this.usuarioRepository.save(usuario);

    this.logger.log(`Usuario ${usuario.activo ? 'activado' : 'desactivado'}: ${updatedUsuario.id}`);
    
    return this.findOne(updatedUsuario.id);
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async remove(userId: string, currentUserId: string): Promise<void> {
    const usuario = await this.findOne(userId);
    const currentUser = await this.findOne(currentUserId);

    // Verificar permisos
    if (!currentUser.tienePermiso('usuarios', 'eliminar')) {
      throw new ForbiddenException('No tiene permisos para eliminar usuarios');
    }

    // No se puede eliminar a sí mismo
    if (userId === currentUserId) {
      throw new BadRequestException('No puede eliminar su propio usuario');
    }

    // No se puede eliminar usuarios de nivel superior
    if (usuario.rol && currentUser.rol && usuario.rol.nivel <= currentUser.rol.nivel) {
      throw new ForbiddenException('No puede eliminar usuarios de nivel superior o igual');
    }

    // Verificar si tiene casos o actividades pendientes
    // Esto se implementaría cuando tengamos los módulos de casos
    
    // Soft delete
    await this.usuarioRepository.softDelete(userId);

    this.logger.log(`Usuario eliminado: ${usuario.email} (${userId})`);
  }

  /**
   * Obtener estadísticas de usuarios por empresa
   */
  async getStatsByEmpresa(empresaId: string): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    porRol: Array<{ rol: string; cantidad: number }>;
    porEspecialidad: Array<{ especialidad: string; cantidad: number }>;
    recientes: Usuario[];
  }> {
    // Total de usuarios
    const total = await this.usuarioRepository.count({
      where: { empresaId },
    });

    // Usuarios activos
    const activos = await this.usuarioRepository.count({
      where: { empresaId, activo: true },
    });

    // Usuarios por rol
    const usuariosPorRol = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoin('usuario.rol', 'rol')
      .select('rol.nombre', 'rol')
      .addSelect('COUNT(*)', 'cantidad')
      .where('usuario.empresaId = :empresaId', { empresaId })
      .groupBy('rol.nombre')
      .getRawMany();

    // Usuarios por especialidad (considerando que especialidades es un array)
    const usuariosPorEspecialidad = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .select('especialidad', 'especialidad')
      .addSelect('COUNT(*)', 'cantidad')
      .where('usuario.empresaId = :empresaId', { empresaId })
      .andWhere('array_length(usuario.especialidades, 1) > 0')
      .groupBy('especialidad')
      .getRawMany();

    // Usuarios recientes (últimos 5)
    const recientes = await this.usuarioRepository.find({
      where: { empresaId },
      relations: ['rol'],
      order: { fechaCreacion: 'DESC' },
      take: 5,
    });

    return {
      total,
      activos,
      inactivos: total - activos,
      porRol: usuariosPorRol,
      porEspecialidad: usuariosPorEspecialidad,
      recientes,
    };
  }

  /**
   * Buscar usuarios por criterios avanzados
   */
  async searchUsuarios(criteria: {
    empresaId: string;
    texto?: string;
    roles?: string[];
    especialidades?: string[];
    activo?: boolean;
    fechaCreacionDesde?: Date;
    fechaCreacionHasta?: Date;
    limit?: number;
  }): Promise<Usuario[]> {
    const { 
      empresaId, 
      texto, 
      roles, 
      especialidades, 
      activo, 
      fechaCreacionDesde, 
      fechaCreacionHasta,
      limit = 50 
    } = criteria;

    const queryBuilder = this.usuarioRepository.createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.empresaId = :empresaId', { empresaId });

    if (texto) {
      queryBuilder.andWhere(
        '(usuario.nombre ILIKE :texto OR usuario.apellidos ILIKE :texto OR usuario.email ILIKE :texto)',
        { texto: `%${texto}%` }
      );
    }

    if (roles && roles.length > 0) {
      queryBuilder.andWhere('usuario.rolId IN (:...roles)', { roles });
    }

    if (especialidades && especialidades.length > 0) {
      queryBuilder.andWhere('usuario.especialidades && :especialidades', { especialidades });
    }

    if (activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', { activo });
    }

    if (fechaCreacionDesde) {
      queryBuilder.andWhere('usuario.fechaCreacion >= :fechaDesde', { fechaDesde: fechaCreacionDesde });
    }

    if (fechaCreacionHasta) {
      queryBuilder.andWhere('usuario.fechaCreacion <= :fechaHasta', { fechaHasta: fechaCreacionHasta });
    }

    return queryBuilder
      .orderBy('usuario.fechaCreacion', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Generar contraseña aleatoria segura
   */
  private generateRandomPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    
    // Asegurar que tenga al menos uno de cada tipo
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // minúscula
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // mayúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // número
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // especial
    
    // Completar con caracteres aleatorios
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mezclar caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
