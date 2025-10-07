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

import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente, TipoCliente, TipoDocumento } from '../../entities/cliente.entity';

/**
 * Controlador de clientes
 * Maneja operaciones CRUD, validaciones peruanas y gestión de contactos
 */
@ApiTags('Clientes')
@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientesController {
  private readonly logger = new Logger(ClientesController.name);

  constructor(private readonly clientesService: ClientesService) {}

  /**
   * Crear nuevo cliente
   */
  @Post()
  @RequirePermissions('clientes.crear')
  @ApiOperation({ 
    summary: 'Crear cliente',
    description: 'Crea un nuevo cliente con validaciones peruanas (DNI/RUC)',
  })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({
    status: 201,
    description: 'Cliente creado exitosamente',
    type: Cliente,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o documento inválido',
  })
  @ApiResponse({
    status: 409,
    description: 'Cliente ya existe con este documento',
  })
  async create(
    @Body() createClienteDto: CreateClienteDto,
    @Request() req: any,
  ) {
    this.logger.log(`Creando cliente: ${createClienteDto.nombres} (${createClienteDto.numeroDocumento})`);
    return this.clientesService.create(createClienteDto, req.user.id);
  }

  /**
   * Obtener todos los clientes de la empresa
   */
  @Get()
  @RequirePermissions('clientes.listar')
  @ApiOperation({ 
    summary: 'Listar clientes',
    description: 'Obtiene la lista de clientes de la empresa con filtros y paginación',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, documento o email' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Filtrar por tipo de cliente', enum: TipoCliente })
  @ApiQuery({ name: 'tipoDocumento', required: false, description: 'Filtrar por tipo de documento', enum: TipoDocumento })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'categoria', required: false, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'activo', required: false, description: 'Filtrar por estado activo', type: Boolean })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite por página (default: 10)', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        clientes: {
          type: 'array',
          items: { $ref: '#/components/schemas/Cliente' },
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
    @Query('tipo') tipo?: TipoCliente,
    @Query('tipoDocumento') tipoDocumento?: TipoDocumento,
    @Query('estado') estado?: string,
    @Query('categoria') categoria?: string,
    @Query('activo', new DefaultValuePipe(undefined), ParseBoolPipe) activo?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.clientesService.findAll({
      empresaId,
      search,
      tipo,
      tipoDocumento,
      estado,
      categoria,
      activo,
      page,
      limit,
    });
  }

  /**
   * Obtener estadísticas de clientes de la empresa
   */
  @Get('stats')
  @RequirePermissions('clientes.estadisticas')
  @ApiOperation({ 
    summary: 'Estadísticas de clientes',
    description: 'Obtiene estadísticas y métricas de clientes de la empresa',
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
        porTipo: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tipo: { type: 'string' },
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
    this.logger.log(`Obteniendo estadísticas de clientes para empresa: ${empresaId}`);
    return this.clientesService.getStatsByEmpresa(empresaId);
  }

  /**
   * Obtener clientes duplicados
   */
  @Get('duplicates')
  @RequirePermissions('clientes.administrar')
  @ApiOperation({ 
    summary: 'Buscar duplicados',
    description: 'Encuentra clientes duplicados por documento o email',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de duplicados encontrados',
    type: 'array',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          criterio: { type: 'string' },
          clientes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Cliente' },
          },
        },
      },
    },
  })
  async findDuplicates(
    @TenantId() empresaId: string,
  ) {
    this.logger.log(`Buscando clientes duplicados en empresa: ${empresaId}`);
    return this.clientesService.findDuplicates(empresaId);
  }

  /**
   * Obtener cliente por documento
   */
  @Get('documento/:numeroDocumento')
  @RequirePermissions('clientes.ver')
  @ApiOperation({ 
    summary: 'Buscar por documento',
    description: 'Obtiene un cliente por su número de documento',
  })
  @ApiParam({ name: 'numeroDocumento', description: 'Número de documento del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: Cliente,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  async findByDocumento(
    @Param('numeroDocumento') numeroDocumento: string,
    @TenantId() empresaId: string,
  ) {
    return this.clientesService.findByDocumento(numeroDocumento, empresaId);
  }

  /**
   * Obtener cliente por ID
   */
  @Get(':id')
  @RequirePermissions('clientes.ver')
  @ApiOperation({ 
    summary: 'Obtener cliente',
    description: 'Obtiene un cliente específico por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: Cliente,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
  ) {
    return this.clientesService.findOne(id, empresaId);
  }

  /**
   * Actualizar cliente
   */
  @Patch(':id')
  @RequirePermissions('clientes.editar')
  @ApiOperation({ 
    summary: 'Actualizar cliente',
    description: 'Actualiza la información de un cliente',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateClienteDto })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado exitosamente',
    type: Cliente,
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe otro cliente con este documento',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClienteDto: UpdateClienteDto,
    @Request() req: any,
  ) {
    this.logger.log(`Actualizando cliente: ${id}`);
    return this.clientesService.update(id, updateClienteDto);
  }

  /**
   * Activar/Desactivar cliente
   */
  @Post(':id/toggle-active')
  @RequirePermissions('clientes.administrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Activar/Desactivar cliente',
    description: 'Cambia el estado activo/inactivo de un cliente',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Estado del cliente cambiado exitosamente',
    type: Cliente,
  })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    this.logger.log(`Cambiando estado activo de cliente: ${id}`);
    return this.clientesService.toggleActive(id);
  }

  /**
   * Actualizar último contacto
   */
  @Post(':id/contact')
  @RequirePermissions('clientes.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Registrar contacto',
    description: 'Actualiza la fecha de último contacto del cliente',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fecha: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha del contacto (opcional, usa fecha actual si no se proporciona)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Último contacto actualizado exitosamente',
    schema: {
      example: {
        message: 'Último contacto actualizado exitosamente',
      },
    },
  })
  async updateLastContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { fecha?: string },
    @Request() req: any,
  ) {
    this.logger.log(`Actualizando último contacto de cliente: ${id}`);
    
    const fecha = body.fecha ? new Date(body.fecha) : new Date();
    await this.clientesService.updateLastContact(id, fecha);
    
    return { message: 'Último contacto actualizado exitosamente' };
  }

  /**
   * Eliminar cliente
   */
  @Delete(':id')
  @RequirePermissions('clientes.eliminar')
  @ApiOperation({ 
    summary: 'Eliminar cliente',
    description: 'Elimina un cliente del sistema (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Cliente eliminado exitosamente',
    schema: {
      example: {
        message: 'Cliente eliminado exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar el cliente porque tiene casos activos',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    this.logger.log(`Eliminando cliente: ${id}`);
    await this.clientesService.remove(id);
    
    return { message: 'Cliente eliminado exitosamente' };
  }
}
