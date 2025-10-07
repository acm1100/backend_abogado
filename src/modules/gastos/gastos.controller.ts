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
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { GastosService } from './gastos.service';
import {
  CreateGastoDto,
  UpdateGastoDto,
  CambiarEstadoGastoDto,
  AsignarGastoDto,
  ReembolsoGastoDto,
  FiltrosGastoDto,
  PaginacionGastoDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

@ApiTags('Gastos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TransformInterceptor)
@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear nuevo gasto',
    description: 'Registra un nuevo gasto en el sistema con validación de comprobantes y proveedores'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Gasto creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sin permisos para crear gastos',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'comprobante', maxCount: 1 },
      { name: 'documentosAdicionales', maxCount: 10 },
    ])
  )
  @Permissions('gastos:create')
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createGastoDto: CreateGastoDto,
    @UploadedFiles() files: { comprobante?: Express.Multer.File[]; documentosAdicionales?: Express.Multer.File[] },
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.gastosService.create(
      createGastoDto,
      req.user.id,
      empresaId,
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener gastos con filtros',
    description: 'Lista todos los gastos con capacidad de filtrado, búsqueda y paginación'
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar por tipo de gasto',
    enum: ['OPERATIVO', 'ADMINISTRATIVO', 'COMERCIAL', 'LEGAL'],
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    description: 'Filtrar por categoría',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
    enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO', 'FACTURADO'],
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio para filtrar',
    type: 'string',
    format: 'date',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin para filtrar',
    type: 'string',
    format: 'date',
  })
  @ApiQuery({
    name: 'montoMinimo',
    required: false,
    description: 'Monto mínimo para filtrar',
    type: 'number',
  })
  @ApiQuery({
    name: 'montoMaximo',
    required: false,
    description: 'Monto máximo para filtrar',
    type: 'number',
  })
  @ApiQuery({
    name: 'moneda',
    required: false,
    description: 'Filtrar por moneda',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @ApiQuery({
    name: 'casoId',
    required: false,
    description: 'Filtrar por ID del caso',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'proyectoId',
    required: false,
    description: 'Filtrar por ID del proyecto',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'clienteId',
    required: false,
    description: 'Filtrar por ID del cliente',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'usuarioId',
    required: false,
    description: 'Filtrar por ID del usuario',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'reembolsable',
    required: false,
    description: 'Filtrar por gastos reembolsables',
    type: 'boolean',
  })
  @ApiQuery({
    name: 'facturable',
    required: false,
    description: 'Filtrar por gastos facturables',
    type: 'boolean',
  })
  @ApiQuery({
    name: 'proveedor',
    required: false,
    description: 'Buscar por nombre del proveedor',
    type: 'string',
  })
  @ApiQuery({
    name: 'pagina',
    required: false,
    description: 'Número de página',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    description: 'Elementos por página',
    type: 'number',
    example: 10,
  })
  @ApiQuery({
    name: 'ordenarPor',
    required: false,
    description: 'Campo para ordenar',
    enum: ['fechaGasto', 'monto', 'fechaCreacion', 'estado', 'descripcion', 'categoria'],
  })
  @ApiQuery({
    name: 'orden',
    required: false,
    description: 'Dirección del ordenamiento',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de gastos obtenida exitosamente',
  })
  @Permissions('gastos:read')
  async findAll(
    @Query() query: any,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    const filtros: FiltrosGastoDto = {
      tipo: query.tipo,
      categoria: query.categoria,
      estado: query.estado,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      montoMinimo: query.montoMinimo ? parseFloat(query.montoMinimo) : undefined,
      montoMaximo: query.montoMaximo ? parseFloat(query.montoMaximo) : undefined,
      moneda: query.moneda,
      casoId: query.casoId,
      proyectoId: query.proyectoId,
      clienteId: query.clienteId,
      usuarioId: query.usuarioId,
      reembolsable: query.reembolsable === 'true' ? true : query.reembolsable === 'false' ? false : undefined,
      facturable: query.facturable === 'true' ? true : query.facturable === 'false' ? false : undefined,
      proveedor: query.proveedor,
      metodoPago: query.metodoPago,
      tipoComprobante: query.tipoComprobante,
      activo: query.activo === 'false' ? false : true,
    };

    const paginacion: PaginacionGastoDto = {
      pagina: parseInt(query.pagina) || 1,
      limite: parseInt(query.limite) || 10,
      ordenamiento: query.ordenarPor ? {
        campo: query.ordenarPor,
        direccion: query.orden || 'DESC',
      } : undefined,
    };

    return await this.gastosService.findAll(
      filtros,
      paginacion,
      empresaId,
      req.user.id,
    );
  }

  @Get('estadisticas')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de gastos',
    description: 'Obtiene estadísticas consolidadas de gastos con métricas y análisis'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @Permissions('gastos:stats')
  async obtenerEstadisticas(
    @Query() query: any,
    @TenantId() empresaId: string,
  ) {
    const filtros: FiltrosGastoDto = {
      tipo: query.tipo,
      categoria: query.categoria,
      estado: query.estado,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      montoMinimo: query.montoMinimo ? parseFloat(query.montoMinimo) : undefined,
      montoMaximo: query.montoMaximo ? parseFloat(query.montoMaximo) : undefined,
      moneda: query.moneda,
      casoId: query.casoId,
      proyectoId: query.proyectoId,
      clienteId: query.clienteId,
      reembolsable: query.reembolsable === 'true' ? true : query.reembolsable === 'false' ? false : undefined,
      facturable: query.facturable === 'true' ? true : query.facturable === 'false' ? false : undefined,
    };

    return await this.gastosService.obtenerEstadisticas(filtros, empresaId);
  }

  @Get('pendientes-aprobacion')
  @ApiOperation({ 
    summary: 'Obtener gastos pendientes de aprobación',
    description: 'Lista los gastos que requieren aprobación del usuario actual'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gastos pendientes obtenidos exitosamente',
  })
  @Permissions('gastos:approve')
  async obtenerGastosPorAprobar(
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.gastosService.obtenerGastosPorAprobar(empresaId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener gasto por ID',
    description: 'Obtiene los detalles completos de un gasto específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gasto encontrado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gasto no encontrado',
  })
  @Permissions('gastos:read')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
  ) {
    return await this.gastosService.findOne(id, empresaId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar gasto',
    description: 'Actualiza los datos de un gasto existente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gasto actualizado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gasto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sin permisos para actualizar el gasto',
  })
  @Permissions('gastos:update')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGastoDto: UpdateGastoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.gastosService.update(id, updateGastoDto, req.user.id, empresaId);
  }

  @Patch(':id/estado')
  @ApiOperation({ 
    summary: 'Cambiar estado de gasto',
    description: 'Cambia el estado de un gasto (aprobar, rechazar, etc.)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado cambiado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gasto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Transición de estado no válida',
  })
  @Permissions('gastos:change-status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cambiarEstadoDto: CambiarEstadoGastoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.gastosService.cambiarEstado(id, cambiarEstadoDto, req.user.id, empresaId);
  }

  @Patch(':id/asignar')
  @ApiOperation({ 
    summary: 'Asignar gasto a caso/proyecto/cliente',
    description: 'Asigna o reasigna un gasto a un caso, proyecto o cliente específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gasto asignado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gasto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Asignación no válida',
  })
  @Permissions('gastos:assign')
  @UsePipes(new ValidationPipe({ transform: true }))
  async asignar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() asignarGastoDto: AsignarGastoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.gastosService.asignar(id, asignarGastoDto, req.user.id, empresaId);
  }

  @Post(':id/reembolso')
  @ApiOperation({ 
    summary: 'Procesar reembolso de gasto',
    description: 'Procesa el reembolso de un gasto aprobado'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reembolso procesado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gasto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Gasto no reembolsable o estado inválido',
  })
  @HttpCode(HttpStatus.OK)
  @Permissions('gastos:reimburse')
  @UsePipes(new ValidationPipe({ transform: true }))
  async procesarReembolso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reembolsoDto: ReembolsoGastoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.gastosService.procesarReembolso(id, reembolsoDto, req.user.id, empresaId);
  }

  @Post(':id/aprobar')
  @ApiOperation({ 
    summary: 'Aprobar gasto',
    description: 'Aprueba un gasto pendiente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gasto aprobado exitosamente',
  })
  @HttpCode(HttpStatus.OK)
  @Permissions('gastos:approve')
  async aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo?: string; observaciones?: string },
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    const cambiarEstadoDto: CambiarEstadoGastoDto = {
      estado: 'APROBADO' as any,
      motivo: body.motivo || 'Gasto aprobado',
      observaciones: body.observaciones,
    };

    return await this.gastosService.cambiarEstado(id, cambiarEstadoDto, req.user.id, empresaId);
  }

  @Post(':id/rechazar')
  @ApiOperation({ 
    summary: 'Rechazar gasto',
    description: 'Rechaza un gasto pendiente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gasto rechazado exitosamente',
  })
  @HttpCode(HttpStatus.OK)
  @Permissions('gastos:reject')
  async rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo: string; observaciones?: string },
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    const cambiarEstadoDto: CambiarEstadoGastoDto = {
      estado: 'RECHAZADO' as any,
      motivo: body.motivo,
      observaciones: body.observaciones,
    };

    return await this.gastosService.cambiarEstado(id, cambiarEstadoDto, req.user.id, empresaId);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar gasto',
    description: 'Elimina un gasto del sistema (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del gasto',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Gasto eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Gasto no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No se puede eliminar el gasto en su estado actual',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('gastos:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    await this.gastosService.remove(id, req.user.id, empresaId);
  }
}
