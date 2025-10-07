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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CasosService } from './casos.service';
import { CreateCasoDto } from './dto/create-caso.dto';
import { UpdateCasoDto } from './dto/update-caso.dto';
import { FilterCasosDto } from './dto/filter-casos.dto';

@ApiTags('Casos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('casos')
export class CasosController {
  constructor(private readonly casosService: CasosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('crear_casos')
  @ApiOperation({
    summary: 'Crear nuevo caso',
    description: 'Permite crear un nuevo caso legal asociado a un cliente',
  })
  @ApiResponse({
    status: 201,
    description: 'Caso creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Número de expediente duplicado',
  })
  async create(@Body() createCasoDto: CreateCasoDto, @Request() req) {
    return this.casosService.create(
      createCasoDto,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get()
  @Permissions('ver_casos')
  @ApiOperation({
    summary: 'Listar casos',
    description: 'Obtiene una lista paginada de casos con filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de casos obtenida exitosamente',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    description: 'Buscar por título, descripción o número de expediente',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar por tipo de caso',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado del caso',
  })
  @ApiQuery({
    name: 'prioridad',
    required: false,
    description: 'Filtrar por prioridad',
  })
  @ApiQuery({
    name: 'clienteId',
    required: false,
    description: 'Filtrar por cliente',
  })
  @ApiQuery({
    name: 'usuarioId',
    required: false,
    description: 'Filtrar por usuario responsable',
  })
  @ApiQuery({
    name: 'pagina',
    required: false,
    description: 'Número de página (default: 1)',
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    description: 'Elementos por página (default: 20, max: 100)',
  })
  async findAll(@Query() filters: FilterCasosDto, @Request() req) {
    return this.casosService.findAll(
      filters,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get('estadisticas')
  @Permissions('ver_reportes_casos')
  @ApiOperation({
    summary: 'Obtener estadísticas de casos',
    description: 'Proporciona métricas y estadísticas sobre los casos',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getEstadisticas(@Request() req) {
    return this.casosService.getEstadisticas(req.user.empresaId);
  }

  @Get('cliente/:clienteId')
  @Permissions('ver_casos')
  @ApiOperation({
    summary: 'Listar casos por cliente',
    description: 'Obtiene todos los casos asociados a un cliente específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Casos del cliente obtenidos exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado',
  })
  async findByCliente(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Request() req,
  ) {
    return this.casosService.findByCliente(clienteId, req.user.empresaId);
  }

  @Get('usuario/:usuarioId')
  @Permissions('ver_casos')
  @ApiOperation({
    summary: 'Listar casos por usuario',
    description: 'Obtiene todos los casos asignados a un usuario específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Casos del usuario obtenidos exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async findByUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Request() req,
  ) {
    return this.casosService.findByUsuario(usuarioId, req.user.empresaId);
  }

  @Get(':id')
  @Permissions('ver_casos')
  @ApiOperation({
    summary: 'Obtener caso por ID',
    description: 'Recupera un caso específico con todos sus detalles',
  })
  @ApiResponse({
    status: 200,
    description: 'Caso encontrado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso no encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.casosService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @Permissions('editar_casos')
  @ApiOperation({
    summary: 'Actualizar caso',
    description: 'Modifica los datos de un caso existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Caso actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Número de expediente duplicado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCasoDto: UpdateCasoDto,
    @Request() req,
  ) {
    return this.casosService.update(
      id,
      updateCasoDto,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Patch(':id/asignar')
  @Permissions('asignar_casos')
  @ApiOperation({
    summary: 'Asignar caso a usuario',
    description: 'Asigna un caso a un usuario específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Caso asignado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso o usuario no encontrado',
  })
  async asignarCaso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { usuarioId: string },
    @Request() req,
  ) {
    return this.casosService.asignarCaso(
      id,
      body.usuarioId,
      req.user.empresaId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('eliminar_casos')
  @ApiOperation({
    summary: 'Eliminar caso',
    description: 'Desactiva un caso (eliminación lógica)',
  })
  @ApiResponse({
    status: 204,
    description: 'Caso desactivado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso no encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.casosService.remove(id, req.user.empresaId);
  }
}
