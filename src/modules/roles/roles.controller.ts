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
  HttpStatus,
  HttpCode,
  ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto, AsignarPermisosDto, AsignarUsuariosDto } from './dto/update-rol.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear nuevo rol',
    description: 'Crea un nuevo rol en el sistema con los permisos especificados'
  })
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente',
    schema: {
      example: {
        id: 'uuid-del-rol',
        nombre: 'Abogado Senior',
        descripcion: 'Rol para abogados con experiencia',
        esActivo: true,
        permisos: ['casos:crear', 'casos:leer', 'casos:actualizar']
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para crear roles'
  })
  @Permission('roles:crear')
  async create(
    @Body() createRolDto: CreateRolDto,
    @Request() req: any
  ) {
    return this.rolesService.create(createRolDto, req.user.empresaId, req.user.sub);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener lista de roles',
    description: 'Obtiene todos los roles de la empresa con paginación y filtros'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-del-rol',
            nombre: 'Abogado Senior',
            descripcion: 'Rol para abogados con experiencia',
            esActivo: true,
            cantidadUsuarios: 5,
            cantidadPermisos: 25
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      }
    }
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Número de página (por defecto: 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Cantidad de elementos por página (por defecto: 20)',
    example: 20
  })
  @ApiQuery({ 
    name: 'buscar', 
    required: false, 
    type: String, 
    description: 'Buscar en nombre y descripción del rol',
    example: 'abogado'
  })
  @ApiQuery({ 
    name: 'esActivo', 
    required: false, 
    type: Boolean, 
    description: 'Filtrar por estado activo/inactivo',
    example: true
  })
  @ApiQuery({ 
    name: 'ordenarPor', 
    required: false, 
    type: String, 
    description: 'Campo para ordenar (nombre, fechaCreacion)',
    example: 'nombre'
  })
  @ApiQuery({ 
    name: 'orden', 
    required: false, 
    enum: ['ASC', 'DESC'], 
    description: 'Dirección del ordenamiento',
    example: 'ASC'
  })
  @Permission('roles:leer')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('buscar') buscar?: string,
    @Query('esActivo') esActivo?: boolean,
    @Query('ordenarPor') ordenarPor?: string,
    @Query('orden') orden?: 'ASC' | 'DESC',
    @Request() req: any
  ) {
    return this.rolesService.findAll(
      req.user.empresaId,
      { buscar, esActivo, ordenarPor, orden },
      page,
      limit
    );
  }

  @Get('disponibles')
  @ApiOperation({ 
    summary: 'Obtener roles disponibles para asignación',
    description: 'Obtiene solo los roles activos disponibles para asignar a usuarios'
  })
  @ApiResponse({
    status: 200,
    description: 'Roles disponibles obtenidos exitosamente'
  })
  @Permission('roles:leer')
  async findDisponibles(@Request() req: any) {
    return this.rolesService.findDisponibles(req.user.empresaId);
  }

  @Get('sistema')
  @ApiOperation({ 
    summary: 'Obtener roles del sistema',
    description: 'Obtiene los roles predefinidos del sistema que no pueden ser modificados'
  })
  @ApiResponse({
    status: 200,
    description: 'Roles del sistema obtenidos exitosamente'
  })
  @Permission('roles:leer')
  async findRolesSistema() {
    return this.rolesService.findRolesSistema();
  }

  @Get('estadisticas')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de roles',
    description: 'Obtiene estadísticas sobre el uso de roles en la empresa'
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        totalRoles: 8,
        rolesActivos: 6,
        rolesPersonalizados: 3,
        distribuccionUsuarios: {
          'Abogado Senior': 5,
          'Abogado Junior': 8,
          'Asistente Legal': 3
        }
      }
    }
  })
  @Permission('roles:estadisticas')
  async obtenerEstadisticas(@Request() req: any) {
    return this.rolesService.obtenerEstadisticas(req.user.empresaId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener rol por ID',
    description: 'Obtiene la información detallada de un rol específico'
  })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado exitosamente',
    schema: {
      example: {
        id: 'uuid-del-rol',
        nombre: 'Abogado Senior',
        descripcion: 'Rol para abogados con experiencia',
        esActivo: true,
        esSistema: false,
        permisos: [
          {
            id: 'perm-1',
            nombre: 'casos:crear',
            descripcion: 'Crear casos'
          }
        ],
        usuarios: [
          {
            id: 'user-1',
            nombres: 'Juan',
            apellidos: 'Pérez',
            email: 'juan@ejemplo.com'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @Permission('roles:leer')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string, 
    @Request() req: any
  ) {
    return this.rolesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar rol',
    description: 'Actualiza la información de un rol existente'
  })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @Permission('roles:actualizar')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRolDto: UpdateRolDto,
    @Request() req: any
  ) {
    return this.rolesService.update(id, updateRolDto, req.user.empresaId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Eliminar rol',
    description: 'Elimina un rol del sistema. No se pueden eliminar roles del sistema o roles con usuarios asignados.'
  })
  @ApiResponse({
    status: 204,
    description: 'Rol eliminado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar el rol (tiene usuarios asignados o es rol del sistema)'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @Permission('roles:eliminar')
  async remove(
    @Param('id', ParseUUIDPipe) id: string, 
    @Request() req: any
  ) {
    return this.rolesService.remove(id, req.user.empresaId);
  }

  @Post(':id/asignar-permisos')
  @ApiOperation({ 
    summary: 'Asignar permisos a rol',
    description: 'Asigna una lista de permisos específicos a un rol'
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos asignados exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @ApiBody({ 
    description: 'Lista de permisos para asignar',
    type: AsignarPermisosDto
  })
  @Permission('roles:asignar-permisos')
  async asignarPermisos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() asignarPermisosDto: AsignarPermisosDto,
    @Request() req: any
  ) {
    return this.rolesService.asignarPermisos(id, asignarPermisosDto.permisosIds, req.user.empresaId);
  }

  @Delete(':id/permisos/:permisoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Quitar permiso de rol',
    description: 'Remueve un permiso específico de un rol'
  })
  @ApiResponse({
    status: 204,
    description: 'Permiso removido exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol o permiso no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @ApiParam({ name: 'permisoId', description: 'ID único del permiso', type: 'string' })
  @Permission('roles:quitar-permisos')
  async quitarPermiso(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
    @Request() req: any
  ) {
    return this.rolesService.quitarPermiso(id, permisoId, req.user.empresaId);
  }

  @Post(':id/asignar-usuarios')
  @ApiOperation({ 
    summary: 'Asignar usuarios a rol',
    description: 'Asigna una lista de usuarios a un rol específico'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuarios asignados exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @ApiBody({ 
    description: 'Lista de usuarios para asignar',
    type: AsignarUsuariosDto
  })
  @Permission('roles:asignar-usuarios')
  async asignarUsuarios(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() asignarUsuariosDto: AsignarUsuariosDto,
    @Request() req: any
  ) {
    return this.rolesService.asignarUsuarios(id, asignarUsuariosDto.usuariosIds, req.user.empresaId);
  }

  @Delete(':id/usuarios/:usuarioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Quitar usuario de rol',
    description: 'Remueve un usuario específico de un rol'
  })
  @ApiResponse({
    status: 204,
    description: 'Usuario removido del rol exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol o usuario no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @ApiParam({ name: 'usuarioId', description: 'ID único del usuario', type: 'string' })
  @Permission('roles:quitar-usuarios')
  async quitarUsuario(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Request() req: any
  ) {
    return this.rolesService.quitarUsuario(id, usuarioId, req.user.empresaId);
  }

  @Post(':id/clonar')
  @ApiOperation({ 
    summary: 'Clonar rol',
    description: 'Crea una copia de un rol existente con todos sus permisos'
  })
  @ApiResponse({
    status: 201,
    description: 'Rol clonado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol original no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol a clonar', type: 'string' })
  @ApiBody({
    description: 'Datos para el nuevo rol clonado',
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del nuevo rol' },
        descripcion: { type: 'string', description: 'Descripción del nuevo rol' }
      },
      required: ['nombre']
    }
  })
  @Permission('roles:crear')
  async clonar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { nombre: string; descripcion?: string },
    @Request() req: any
  ) {
    return this.rolesService.clonar(id, body.nombre, body.descripcion, req.user.empresaId, req.user.sub);
  }

  @Patch(':id/activar')
  @ApiOperation({ 
    summary: 'Activar rol',
    description: 'Activa un rol previamente desactivado'
  })
  @ApiResponse({
    status: 200,
    description: 'Rol activado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @Permission('roles:activar')
  async activar(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.rolesService.cambiarEstado(id, true, req.user.empresaId);
  }

  @Patch(':id/desactivar')
  @ApiOperation({ 
    summary: 'Desactivar rol',
    description: 'Desactiva un rol. Los usuarios con este rol mantendrán sus permisos hasta que se les asigne otro rol.'
  })
  @ApiResponse({
    status: 200,
    description: 'Rol desactivado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede desactivar un rol del sistema'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @Permission('roles:desactivar')
  async desactivar(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.rolesService.cambiarEstado(id, false, req.user.empresaId);
  }

  @Get(':id/usuarios')
  @ApiOperation({ 
    summary: 'Obtener usuarios del rol',
    description: 'Obtiene todos los usuarios que tienen asignado un rol específico'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuarios del rol obtenidos exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @ApiQuery({ 
    name: 'incluirInactivos', 
    required: false, 
    type: Boolean, 
    description: 'Incluir usuarios inactivos',
    example: false
  })
  @Permission('roles:leer')
  async obtenerUsuariosDelRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('incluirInactivos') incluirInactivos: boolean = false,
    @Request() req: any
  ) {
    return this.rolesService.obtenerUsuariosDelRol(id, req.user.empresaId, incluirInactivos);
  }

  @Get(':id/permisos')
  @ApiOperation({ 
    summary: 'Obtener permisos del rol',
    description: 'Obtiene todos los permisos asignados a un rol específico'
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos del rol obtenidos exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiParam({ name: 'id', description: 'ID único del rol', type: 'string' })
  @Permission('roles:leer')
  async obtenerPermisosDelRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.rolesService.obtenerPermisosDelRol(id, req.user.empresaId);
  }
}
