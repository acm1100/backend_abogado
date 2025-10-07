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
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FacturacionService } from './facturacion.service';
import { CreateFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { FilterFacturacionDto } from './dto/filter-facturacion.dto';
import { MetodoPago } from '../../entities/facturacion.entity';

@ApiTags('Facturación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('crear_facturas')
  @ApiOperation({
    summary: 'Crear nueva factura',
    description: 'Permite crear una nueva factura con cálculos automáticos de impuestos',
  })
  @ApiResponse({
    status: 201,
    description: 'Factura creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente, caso o proyecto no encontrado',
  })
  async create(@Body() createFacturacionDto: CreateFacturacionDto, @Request() req) {
    return this.facturacionService.create(
      createFacturacionDto,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get()
  @Permissions('ver_facturas')
  @ApiOperation({
    summary: 'Listar facturas',
    description: 'Obtiene una lista paginada de facturas con filtros y totales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de facturas obtenida exitosamente',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    description: 'Buscar por número, receptor o observaciones',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar por tipo de comprobante',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado de la factura',
  })
  @ApiQuery({
    name: 'clienteId',
    required: false,
    description: 'Filtrar por cliente',
  })
  @ApiQuery({
    name: 'casoId',
    required: false,
    description: 'Filtrar por caso',
  })
  @ApiQuery({
    name: 'vencidas',
    required: false,
    description: 'Solo facturas vencidas',
  })
  @ApiQuery({
    name: 'pagadas',
    required: false,
    description: 'Solo facturas pagadas',
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
  async findAll(@Query() filters: FilterFacturacionDto, @Request() req) {
    return this.facturacionService.findAll(
      filters,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get('estadisticas')
  @Permissions('ver_reportes_facturacion')
  @ApiOperation({
    summary: 'Obtener estadísticas de facturación',
    description: 'Proporciona métricas detalladas y análisis de facturación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @ApiQuery({
    name: 'fechaDesde',
    required: false,
    description: 'Fecha desde para filtrar estadísticas',
  })
  @ApiQuery({
    name: 'fechaHasta',
    required: false,
    description: 'Fecha hasta para filtrar estadísticas',
  })
  @ApiQuery({
    name: 'clienteId',
    required: false,
    description: 'Filtrar estadísticas por cliente específico',
  })
  async getEstadisticas(@Query() filtros: any, @Request() req) {
    return this.facturacionService.getEstadisticas(req.user.empresaId, filtros);
  }

  @Get('reporte/:tipo')
  @Permissions('exportar_facturas')
  @ApiOperation({
    summary: 'Generar reporte de facturación',
    description: 'Genera reportes en formato PDF o Excel',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
  })
  async generarReporte(
    @Param('tipo') tipo: 'PDF' | 'EXCEL',
    @Query() filtros: FilterFacturacionDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.facturacionService.generarReporte(
      tipo,
      filtros,
      req.user.empresaId,
    );

    const fecha = new Date().toISOString().split('T')[0];
    const filename = `facturas_${fecha}.${tipo.toLowerCase()}`;
    const contentType = tipo === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('cliente/:clienteId')
  @Permissions('ver_facturas')
  @ApiOperation({
    summary: 'Listar facturas por cliente',
    description: 'Obtiene todas las facturas asociadas a un cliente específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Facturas del cliente obtenidas exitosamente',
  })
  async findByCliente(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Query() filtros: Partial<FilterFacturacionDto>,
    @Request() req,
  ) {
    const filters: FilterFacturacionDto = { ...filtros, clienteId };
    return this.facturacionService.findAll(
      filters,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get('caso/:casoId')
  @Permissions('ver_facturas')
  @ApiOperation({
    summary: 'Listar facturas por caso',
    description: 'Obtiene todas las facturas asociadas a un caso específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Facturas del caso obtenidas exitosamente',
  })
  async findByCaso(
    @Param('casoId', ParseUUIDPipe) casoId: string,
    @Query() filtros: Partial<FilterFacturacionDto>,
    @Request() req,
  ) {
    const filters: FilterFacturacionDto = { ...filtros, casoId };
    return this.facturacionService.findAll(
      filters,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get(':id')
  @Permissions('ver_facturas')
  @ApiOperation({
    summary: 'Obtener factura por ID',
    description: 'Recupera una factura específica con todos sus detalles',
  })
  @ApiResponse({
    status: 200,
    description: 'Factura encontrada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Factura no encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.facturacionService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @Permissions('editar_facturas')
  @ApiOperation({
    summary: 'Actualizar factura',
    description: 'Modifica los datos de una factura existente (solo borradores y emitidas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Factura actualizada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o factura no editable',
  })
  @ApiResponse({
    status: 404,
    description: 'Factura no encontrada',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFacturacionDto: UpdateFacturacionDto,
    @Request() req,
  ) {
    return this.facturacionService.update(
      id,
      updateFacturacionDto,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Post(':id/pagar')
  @HttpCode(HttpStatus.OK)
  @Permissions('registrar_pagos')
  @ApiOperation({
    summary: 'Registrar pago de factura',
    description: 'Registra un pago total o parcial de una factura',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        montoPagado: {
          type: 'number',
          description: 'Monto del pago',
          example: 1000.00,
        },
        metodoPago: {
          type: 'string',
          enum: Object.values(MetodoPago),
          description: 'Método de pago utilizado',
        },
        referencia: {
          type: 'string',
          description: 'Referencia o comprobante del pago',
          example: 'TXN-20240120-001',
        },
      },
      required: ['montoPagado', 'metodoPago', 'referencia'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pago registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Monto inválido o factura ya pagada',
  })
  async registrarPago(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      montoPagado: number;
      metodoPago: MetodoPago;
      referencia: string;
    },
    @Request() req,
  ) {
    return this.facturacionService.registrarPago(
      id,
      body.montoPagado,
      body.metodoPago,
      body.referencia,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Post(':id/anular')
  @HttpCode(HttpStatus.OK)
  @Permissions('anular_facturas')
  @ApiOperation({
    summary: 'Anular factura',
    description: 'Anula una factura especificando el motivo',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        motivo: {
          type: 'string',
          description: 'Motivo de la anulación',
          example: 'Error en datos del cliente',
          maxLength: 500,
        },
      },
      required: ['motivo'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Factura anulada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Factura no se puede anular en su estado actual',
  })
  async anular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo: string },
    @Request() req,
  ) {
    return this.facturacionService.anular(
      id,
      body.motivo,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('eliminar_facturas')
  @ApiOperation({
    summary: 'Eliminar factura',
    description: 'Desactiva una factura (eliminación lógica). Solo facturas en borrador.',
  })
  @ApiResponse({
    status: 204,
    description: 'Factura desactivada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar factura en este estado',
  })
  @ApiResponse({
    status: 404,
    description: 'Factura no encontrada',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const factura = await this.facturacionService.findOne(id, req.user.empresaId);
    
    // Solo se pueden eliminar facturas en borrador
    if (factura.estado !== 'BORRADOR') {
      throw new Error('Solo se pueden eliminar facturas en borrador');
    }

    await this.facturacionService.update(
      id,
      { activo: false },
      req.user.empresaId,
      req.user.userId,
    );
  }
}
