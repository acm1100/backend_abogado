import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto, ChangeUserPasswordDto } from './dto/update-usuario.dto';
import { Usuario } from '../../entities/usuario.entity';

/**
 * Controlador de usuarios
 * Maneja operaciones CRUD, RBAC y gestión de perfiles
 */
@ApiTags('Usuarios')
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsuariosController {
  private readonly logger = new Logger(UsuariosController.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Crear nuevo usuario
   */
  @Post()
  @RequirePermissions('usuarios.crear')
  @ApiOperation({ 
    summary: 'Crear usuario',
    description: 'Crea un nuevo usuario en la empresa actual con validaciones RBAC',
  })
  @ApiBody({ type: CreateUsuarioDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: Usuario,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o límite de usuarios alcanzado',
  })
  @ApiResponse({
    status: 409,
    description: 'Email o DNI ya existe en la empresa',
  })
  async create(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @Request() req: any,
  ) {
    this.logger.log(`Creando usuario: ${createUsuarioDto.email}`);
    return this.usuariosService.create(createUsuarioDto, req.user.id);
  }

  /**
   * Obtener todos los usuarios de la empresa
   */
  @Get()
  @RequirePermissions('usuarios.listar')
  @ApiOperation({ 
    summary: 'Listar usuarios',
    description: 'Obtiene la lista de usuarios de la empresa con filtros y paginación',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, email o DNI' })
  @ApiQuery({ name: 'rolId', required: false, description: 'Filtrar por rol' })
  @ApiQuery({ name: 'activo', required: false, description: 'Filtrar por estado activo', type: Boolean })
  @ApiQuery({ name: 'especialidad', required: false, description: 'Filtrar por especialidad' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite por página (default: 10)', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        usuarios: {
          type: 'array',
          items: { $ref: '#/components/schemas/Usuario' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(
    @TenantId() empresaId: string,
    @Query('search') search?: string,
    @Query('rolId') rolId?: string,
    @Query('activo', new DefaultValuePipe(undefined), ParseBoolPipe) activo?: boolean,
    @Query('especialidad') especialidad?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.usuariosService.findAll({
      empresaId,
      search,
      rolId,
      activo,
      especialidad,
      page,
      limit,
    });
  }

  /**
   * Obtener perfil del usuario actual
   */
  @Get('me')
  @ApiOperation({ 
    summary: 'Perfil actual',
    description: 'Obtiene la información completa del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario actual',
    type: Usuario,
  })
  async getCurrentUser(@Request() req: any) {
    return this.usuariosService.findOne(req.user.id);
  }

  /**
   * Obtener estadísticas de usuarios de la empresa
   */
  @Get('stats')
  @RequirePermissions('usuarios.estadisticas')
  @ApiOperation({ 
    summary: 'Estadísticas de usuarios',
    description: 'Obtiene estadísticas y métricas de usuarios de la empresa',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        activos: { type: 'number' },
        inactivos: { type: 'number' },
        porRol: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rol: { type: 'string' },
              cantidad: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getStats(
    @TenantId() empresaId: string,
    @Request() req: any,
  ) {
    this.logger.log(`Obteniendo estadísticas de usuarios para empresa: ${empresaId}`);
    return this.usuariosService.getStatsByEmpresa(empresaId);
  }

  /**
   * Buscar usuarios con criterios avanzados
   */
  @Get('search')
  @RequirePermissions('usuarios.buscar')
  @ApiOperation({ 
    summary: 'Búsqueda avanzada',
    description: 'Búsqueda avanzada de usuarios con múltiples criterios',
  })
  @ApiQuery({ name: 'texto', required: false, description: 'Texto a buscar en nombre, apellidos o email' })
  @ApiQuery({ name: 'roles', required: false, description: 'Lista de IDs de roles (separados por coma)' })
  @ApiQuery({ name: 'especialidades', required: false, description: 'Lista de especialidades (separadas por coma)' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados (default: 50)' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda',
    type: [Usuario],
  })
  async searchUsuarios(
    @TenantId() empresaId: string,
    @Query('texto') texto?: string,
    @Query('roles') roles?: string,
    @Query('especialidades') especialidades?: string,
    @Query('activo', new DefaultValuePipe(undefined), ParseBoolPipe) activo?: boolean,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    const rolesArray = roles ? roles.split(',').filter(r => r.trim()) : undefined;
    const especialidadesArray = especialidades ? especialidades.split(',').filter(e => e.trim()) : undefined;

    return this.usuariosService.searchUsuarios({
      empresaId,
      texto,
      roles: rolesArray,
      especialidades: especialidadesArray,
      activo,
      limit,
    });
  }

  /**
   * Obtener usuario por ID
   */
  @Get(':id')
  @RequirePermissions('usuarios.ver')
  @ApiOperation({ 
    summary: 'Obtener usuario',
    description: 'Obtiene un usuario específico por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: Usuario,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
  ) {
    return this.usuariosService.findOne(id, empresaId);
  }

  /**
   * Actualizar usuario
   */
  @Patch(':id')
  @RequirePermissions('usuarios.editar')
  @ApiOperation({ 
    summary: 'Actualizar usuario',
    description: 'Actualiza la información de un usuario con validaciones RBAC',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateUsuarioDto })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    type: Usuario,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para editar este usuario',
  })
  @ApiResponse({
    status: 409,
    description: 'Email o DNI ya existe en la empresa',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Request() req: any,
  ) {
    this.logger.log(`Actualizando usuario: ${id}`);
    return this.usuariosService.update(id, updateUsuarioDto, req.user.id);
  }

  /**
   * Actualizar perfil del usuario actual
   */
  @Patch('me/profile')
  @ApiOperation({ 
    summary: 'Actualizar perfil propio',
    description: 'Permite al usuario actualizar su propio perfil',
  })
  @ApiBody({ type: UpdateUsuarioDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    type: Usuario,
  })
  async updateProfile(
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Request() req: any,
  ) {
    this.logger.log(`Usuario actualizando su perfil: ${req.user.id}`);
    
    // Filtrar campos que el usuario no puede cambiar sobre sí mismo
    const filteredDto = {
      nombre: updateUsuarioDto.nombre,
      apellidos: updateUsuarioDto.apellidos,
      telefono: updateUsuarioDto.telefono,
      telefonoAlternativo: updateUsuarioDto.telefonoAlternativo,
      direccion: updateUsuarioDto.direccion,
      especialidades: updateUsuarioDto.especialidades,
      configuracionPersonal: updateUsuarioDto.configuracionPersonal,
    };

    return this.usuariosService.update(req.user.id, filteredDto);
  }

  /**
   * Cambiar contraseña de usuario (por administrador)
   */
  @Post(':id/change-password')
  @RequirePermissions('usuarios.administrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cambiar contraseña',
    description: 'Permite a un administrador cambiar la contraseña de un usuario',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'string', format: 'uuid' })
  @ApiBody({ type: ChangeUserPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    schema: {
      example: {
        message: 'Contraseña cambiada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para cambiar contraseñas',
  })
  async changeUserPassword(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() changePasswordDto: ChangeUserPasswordDto,
    @Request() req: any,
  ) {
    this.logger.log(`Cambiando contraseña de usuario: ${userId}`);
    await this.usuariosService.changeUserPassword(userId, changePasswordDto, req.user.id);
    
    return { message: 'Contraseña cambiada exitosamente' };
  }

  /**
   * Activar/Desactivar usuario
   */
  @Post(':id/toggle-active')
  @RequirePermissions('usuarios.administrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Activar/Desactivar usuario',
    description: 'Cambia el estado activo/inactivo de un usuario',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario cambiado exitosamente',
    type: Usuario,
  })
  @ApiResponse({
    status: 400,
    description: 'No puede desactivar su propio usuario',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para cambiar el estado del usuario',
  })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    this.logger.log(`Cambiando estado activo de usuario: ${id}`);
    return this.usuariosService.toggleActive(id, req.user.id);
  }

  /**
   * Eliminar usuario
   */
  @Delete(':id')
  @RequirePermissions('usuarios.eliminar')
  @ApiOperation({ 
    summary: 'Eliminar usuario',
    description: 'Elimina un usuario del sistema (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente',
    schema: {
      example: {
        message: 'Usuario eliminado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No puede eliminar su propio usuario',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para eliminar usuarios',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    this.logger.log(`Eliminando usuario: ${id}`);
    await this.usuariosService.remove(id, req.user.id);
    
    return { message: 'Usuario eliminado exitosamente' };
  }
}
