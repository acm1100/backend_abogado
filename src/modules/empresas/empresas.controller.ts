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
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Controlador de empresas
 * Maneja operaciones CRUD y gestión de empresas multi-tenant
 */
@ApiTags('Empresas')
@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmpresasController {
  private readonly logger = new Logger(EmpresasController.name);

  constructor(private readonly empresasService: EmpresasService) {}

  /**
   * Crear nueva empresa
   */
  @Public() // Endpoint público para registro inicial
  @Post()
  @ApiOperation({
    summary: 'Crear nueva empresa',
    description: 'Registra una nueva empresa en el sistema con configuración inicial',
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa creada exitosamente',
    type: CreateEmpresaDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o RUC incorrecto',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una empresa con este RUC',
  })
  async create(@Body() createEmpresaDto: CreateEmpresaDto) {
    this.logger.log(`Creando empresa: ${createEmpresaDto.razonSocial}`);
    return this.empresasService.create(createEmpresaDto);
  }

  /**
   * Obtener todas las empresas (solo para super admin)
   */
  @Get()
  @RequirePermissions('empresas.listar')
  @ApiOperation({
    summary: 'Listar empresas',
    description: 'Obtiene la lista de empresas con filtros y paginación',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por razón social, nombre comercial o RUC',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar por tipo de empresa',
  })
  @ApiQuery({
    name: 'activo',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo/inactivo',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas obtenida exitosamente',
  })
  async findAll(
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
    @Query('activo') activo?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.empresasService.findAll({
      search,
      tipo,
      activo,
      page,
      limit,
    });
  }

  /**
   * Obtener empresa actual del usuario
   */
  @Get('me')
  @ApiOperation({
    summary: 'Obtener empresa actual',
    description: 'Obtiene la información de la empresa del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de la empresa obtenida exitosamente',
  })
  async getCurrentEmpresa(@Request() req: any) {
    const empresaId = req.user.empresaId;
    return this.empresasService.findOne(empresaId);
  }

  /**
   * Obtener empresa por ID
   */
  @Get(':id')
  @RequirePermissions('empresas.ver')
  @ApiOperation({
    summary: 'Obtener empresa por ID',
    description: 'Obtiene la información detallada de una empresa específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la empresa',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.empresasService.findOne(id);
  }

  /**
   * Obtener empresa por RUC
   */
  @Get('ruc/:ruc')
  @RequirePermissions('empresas.ver')
  @ApiOperation({
    summary: 'Obtener empresa por RUC',
    description: 'Busca una empresa utilizando su número de RUC',
  })
  @ApiParam({
    name: 'ruc',
    description: 'Número de RUC de la empresa',
    example: '20123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada',
  })
  async findByRuc(@Param('ruc') ruc: string) {
    return this.empresasService.findByRuc(ruc);
  }

  /**
   * Actualizar empresa
   */
  @Patch(':id')
  @RequirePermissions('empresas.editar')
  @ApiOperation({
    summary: 'Actualizar empresa',
    description: 'Actualiza la información de una empresa existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la empresa',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto con RUC existente',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
    @Request() req: any,
  ) {
    // Verificar que el usuario puede editar esta empresa
    if (req.user.empresaId !== id && !req.user.tienePermiso('sistema', 'admin')) {
      throw new ConflictException('No tiene permisos para editar esta empresa');
    }

    this.logger.log(`Actualizando empresa: ${id}`);
    return this.empresasService.update(id, updateEmpresaDto);
  }

  /**
   * Activar/Desactivar empresa
   */
  @Patch(':id/toggle-active')
  @RequirePermissions('empresas.administrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar/Desactivar empresa',
    description: 'Cambia el estado activo/inactivo de una empresa',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la empresa',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la empresa cambiado exitosamente',
  })
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Cambiando estado de empresa: ${id}`);
    return this.empresasService.toggleActive(id);
  }

  /**
   * Obtener estadísticas de la empresa
   */
  @Get(':id/stats')
  @RequirePermissions('empresas.estadisticas')
  @ApiOperation({
    summary: 'Obtener estadísticas de empresa',
    description: 'Obtiene estadísticas y métricas de la empresa',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la empresa',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    // Verificar que el usuario puede ver las estadísticas de esta empresa
    if (req.user.empresaId !== id && !req.user.tienePermiso('sistema', 'admin')) {
      throw new ConflictException('No tiene permisos para ver las estadísticas de esta empresa');
    }

    return this.empresasService.getStats(id);
  }

  /**
   * Estadísticas de la empresa actual
   */
  @Get('me/stats')
  @ApiOperation({
    summary: 'Estadísticas de empresa actual',
    description: 'Obtiene estadísticas de la empresa del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getCurrentEmpresaStats(@Request() req: any) {
    const empresaId = req.user.empresaId;
    return this.empresasService.getStats(empresaId);
  }

  /**
   * Eliminar empresa (solo super admin)
   */
  @Delete(':id')
  @RequirePermissions('empresas.eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar empresa',
    description: 'Elimina una empresa del sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la empresa',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Empresa eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar empresa con usuarios activos',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Eliminando empresa: ${id}`);
    return this.empresasService.remove(id);
  }
}
