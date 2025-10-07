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
  Req,
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RegistrosTiempoService, FiltrosRegistroTiempo } from './registros-tiempo.service';
import { 
  CreateRegistroTiempoDto, 
  IniciarTemporizadorDto, 
  DetenerTemporizadorDto 
} from './dto/create-registro-tiempo.dto';
import { 
  UpdateRegistroTiempoDto,
  CambiarEstadoRegistroDto,
  AprobarRegistroDto,
  RechazarRegistroDto,
  MarcarFacturadoDto,
  ActualizarConfiguracionFacturacionDto,
  RegistrarDescansoDto,
  CopiarRegistroDto,
  GenerarReporteRegistrosDto,
  ConfigurarNotificacionesDto
} from './dto/update-registro-tiempo.dto';

@ApiTags('Registros de Tiempo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registros-tiempo')
export class RegistrosTiempoController {
  constructor(private readonly registrosTiempoService: RegistrosTiempoService) {}

  @Post()
  @Permissions('registros_tiempo:create')
  @ApiOperation({ summary: 'Crear nuevo registro de tiempo' })
  @ApiResponse({ status: 201, description: 'Registro de tiempo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Cliente, caso o proyecto no encontrado' })
  async create(
    @Body(ValidationPipe) createRegistroTiempoDto: CreateRegistroTiempoDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.create(createRegistroTiempoDto, empresaId, usuarioId);
  }

  @Get()
  @Permissions('registros_tiempo:read')
  @ApiOperation({ summary: 'Obtener lista de registros de tiempo con filtros' })
  @ApiQuery({ name: 'usuarioId', required: false, description: 'ID del usuario' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'ID del cliente' })
  @ApiQuery({ name: 'casoId', required: false, description: 'ID del caso' })
  @ApiQuery({ name: 'proyectoId', required: false, description: 'ID del proyecto' })
  @ApiQuery({ name: 'estado', required: false, description: 'Estado del registro' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de registro' })
  @ApiQuery({ name: 'categoria', required: false, description: 'Categoría del tiempo' })
  @ApiQuery({ name: 'fechaDesde', required: false, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaHasta', required: false, description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiQuery({ name: 'soloFacturables', required: false, description: 'Solo registros facturables' })
  @ApiQuery({ name: 'soloAprobados', required: false, description: 'Solo registros aprobados' })
  @ApiQuery({ name: 'soloPendientes', required: false, description: 'Solo registros pendientes' })
  @ApiQuery({ name: 'busqueda', required: false, description: 'Búsqueda en descripción, cliente o usuario' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Registros por página' })
  @ApiResponse({ status: 200, description: 'Lista de registros obtenida exitosamente' })
  async findAll(
    @Query() filtros: FiltrosRegistroTiempo,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @TenantId() empresaId: string
  ) {
    return await this.registrosTiempoService.findAll(filtros, empresaId, page, limit);
  }

  @Get('estadisticas')
  @Permissions('registros_tiempo:read', 'reportes:read')
  @ApiOperation({ summary: 'Obtener estadísticas de tiempo' })
  @ApiQuery({ name: 'usuarioId', required: false, description: 'ID del usuario para filtrar' })
  @ApiQuery({ name: 'fechaDesde', required: false, description: 'Fecha desde para estadísticas' })
  @ApiQuery({ name: 'fechaHasta', required: false, description: 'Fecha hasta para estadísticas' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getEstadisticas(
    @Query('usuarioId') usuarioId: string,
    @Query() filtros: Partial<FiltrosRegistroTiempo>,
    @TenantId() empresaId: string
  ) {
    return await this.registrosTiempoService.getEstadisticas(empresaId, usuarioId, filtros);
  }

  @Get('facturacion/resumen')
  @Permissions('registros_tiempo:read', 'facturacion:read')
  @ApiOperation({ summary: 'Obtener resumen de facturación de registros de tiempo' })
  @ApiQuery({ name: 'fechaDesde', required: false, description: 'Fecha desde para resumen' })
  @ApiQuery({ name: 'fechaHasta', required: false, description: 'Fecha hasta para resumen' })
  @ApiResponse({ status: 200, description: 'Resumen de facturación obtenido exitosamente' })
  async getResumenFacturacion(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
    @TenantId() empresaId: string
  ) {
    return await this.registrosTiempoService.getResumenFacturacion(empresaId, fechaDesde, fechaHasta);
  }

  @Get('temporizador/activo')
  @Permissions('registros_tiempo:create')
  @ApiOperation({ summary: 'Obtener temporizador activo del usuario' })
  @ApiResponse({ status: 200, description: 'Temporizador activo obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'No hay temporizador activo' })
  async getTemporizadorActivo(@Req() req: any) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.obtenerTemporizadorActivo(usuarioId);
  }

  @Post('temporizador/iniciar')
  @Permissions('registros_tiempo:create')
  @ApiOperation({ summary: 'Iniciar nuevo temporizador de tiempo' })
  @ApiResponse({ status: 201, description: 'Temporizador iniciado exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya existe un temporizador activo' })
  async iniciarTemporizador(
    @Body(ValidationPipe) iniciarDto: IniciarTemporizadorDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.iniciarTemporizador(iniciarDto, empresaId, usuarioId);
  }

  @Post('temporizador/:id/detener')
  @Permissions('registros_tiempo:create')
  @ApiOperation({ summary: 'Detener temporizador y crear registro de tiempo' })
  @ApiResponse({ status: 201, description: 'Registro de tiempo creado exitosamente' })
  @ApiResponse({ status: 404, description: 'Temporizador no encontrado' })
  async detenerTemporizador(
    @Param('id') temporizadorId: string,
    @Body(ValidationPipe) detenerDto: DetenerTemporizadorDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.detenerTemporizador(temporizadorId, detenerDto, empresaId, usuarioId);
  }

  @Patch('temporizador/:id/pausar')
  @Permissions('registros_tiempo:create')
  @ApiOperation({ summary: 'Pausar temporizador activo' })
  @ApiResponse({ status: 200, description: 'Temporizador pausado exitosamente' })
  async pausarTemporizador(
    @Param('id') temporizadorId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.pausarTemporizador(temporizadorId, usuarioId);
  }

  @Patch('temporizador/:id/reanudar')
  @Permissions('registros_tiempo:create')
  @ApiOperation({ summary: 'Reanudar temporizador pausado' })
  @ApiResponse({ status: 200, description: 'Temporizador reanudado exitosamente' })
  async reanudarTemporizador(
    @Param('id') temporizadorId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.reanudarTemporizador(temporizadorId, usuarioId);
  }

  @Get(':id')
  @Permissions('registros_tiempo:read')
  @ApiOperation({ summary: 'Obtener registro de tiempo por ID' })
  @ApiResponse({ status: 200, description: 'Registro obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string
  ) {
    return await this.registrosTiempoService.findOne(id, empresaId);
  }

  @Patch(':id')
  @Permissions('registros_tiempo:update')
  @ApiOperation({ summary: 'Actualizar registro de tiempo' })
  @ApiResponse({ status: 200, description: 'Registro actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede actualizar registro facturado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para editar este registro' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateRegistroTiempoDto: UpdateRegistroTiempoDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.update(id, updateRegistroTiempoDto, empresaId, usuarioId);
  }

  @Patch(':id/estado')
  @Permissions('registros_tiempo:approve')
  @ApiOperation({ summary: 'Cambiar estado de registro de tiempo' })
  @ApiResponse({ status: 200, description: 'Estado cambiado exitosamente' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) cambiarEstadoDto: CambiarEstadoRegistroDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.cambiarEstado(id, cambiarEstadoDto, empresaId, usuarioId);
  }

  @Post(':id/aprobar')
  @Permissions('registros_tiempo:approve')
  @ApiOperation({ summary: 'Aprobar registro de tiempo pendiente' })
  @ApiResponse({ status: 200, description: 'Registro aprobado exitosamente' })
  @ApiResponse({ status: 400, description: 'Solo se pueden aprobar registros pendientes' })
  async aprobarRegistro(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) aprobarDto: AprobarRegistroDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.aprobarRegistro(id, aprobarDto, empresaId, usuarioId);
  }

  @Post(':id/rechazar')
  @Permissions('registros_tiempo:approve')
  @ApiOperation({ summary: 'Rechazar registro de tiempo pendiente' })
  @ApiResponse({ status: 200, description: 'Registro rechazado exitosamente' })
  @ApiResponse({ status: 400, description: 'Solo se pueden rechazar registros pendientes' })
  async rechazarRegistro(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) rechazarDto: RechazarRegistroDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.rechazarRegistro(id, rechazarDto, empresaId, usuarioId);
  }

  @Post(':id/facturar')
  @Permissions('registros_tiempo:invoice', 'facturacion:create')
  @ApiOperation({ summary: 'Marcar registro como facturado' })
  @ApiResponse({ status: 200, description: 'Registro marcado como facturado exitosamente' })
  @ApiResponse({ status: 400, description: 'Solo se pueden facturar registros aprobados' })
  async marcarFacturado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) marcarFacturadoDto: MarcarFacturadoDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.registrosTiempoService.marcarFacturado(id, marcarFacturadoDto, empresaId, usuarioId);
  }

  @Post(':id/copiar')
  @Permissions('registros_tiempo:create')
  @ApiOperation({ summary: 'Copiar registro de tiempo para reutilizar' })
  @ApiResponse({ status: 201, description: 'Registro copiado exitosamente' })
  async copiarRegistro(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) copiarDto: CopiarRegistroDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    
    // Obtener registro original
    const registroOriginal = await this.registrosTiempoService.findOne(id, empresaId);
    
    // Crear nuevo registro basado en el original
    const createDto: CreateRegistroTiempoDto = {
      clienteId: registroOriginal.clienteId,
      casoId: registroOriginal.casoId,
      proyectoId: registroOriginal.proyectoId,
      fecha: copiarDto.nuevaFecha || new Date().toISOString().split('T')[0],
      horaInicio: copiarDto.nuevaHoraInicio || registroOriginal.horaInicio,
      horaFin: copiarDto.nuevaHoraFin || registroOriginal.horaFin,
      descripcion: copiarDto.nuevaDescripcion || registroOriginal.descripcion,
      tipo: registroOriginal.tipo,
      categoria: registroOriginal.categoria,
      configuracionFacturacion: registroOriginal.configuracionFacturacion
    };

    return await this.registrosTiempoService.create(createDto, empresaId, usuarioId);
  }

  @Post('reportes/generar')
  @Permissions('registros_tiempo:read', 'reportes:create')
  @ApiOperation({ summary: 'Generar reporte personalizado de registros de tiempo' })
  @ApiResponse({ status: 200, description: 'Reporte generado exitosamente' })
  async generarReporte(
    @Body(ValidationPipe) reporteDto: GenerarReporteRegistrosDto,
    @TenantId() empresaId: string
  ) {
    // Obtener registros según filtros
    const resultados = await this.registrosTiempoService.findAll(
      reporteDto.filtros || {},
      empresaId,
      1,
      10000 // Límite alto para reportes
    );

    // Obtener estadísticas
    const estadisticas = await this.registrosTiempoService.getEstadisticas(
      empresaId,
      reporteDto.filtros?.usuarioId,
      reporteDto.filtros
    );

    return {
      metadatos: {
        fechaGeneracion: new Date(),
        tipoReporte: reporteDto.tipoReporte,
        formato: reporteDto.formato,
        totalRegistros: resultados.total,
        filtrosAplicados: reporteDto.filtros
      },
      datos: {
        registros: resultados.data,
        estadisticas,
        resumen: {
          totalHoras: estadisticas.totalHoras,
          horasFacturables: estadisticas.horasFacturables,
          ingresosPotenciales: estadisticas.ingresosPotenciales,
          ingresosFacturados: estadisticas.ingresosFacturados
        }
      }
    };
  }

  @Post('lotes/aprobar')
  @Permissions('registros_tiempo:approve')
  @ApiOperation({ summary: 'Aprobar múltiples registros en lote' })
  @ApiResponse({ status: 200, description: 'Registros aprobados en lote exitosamente' })
  async aprobarLote(
    @Body() data: { 
      registroIds: string[], 
      observaciones?: string,
      aplicarAjustesGlobales?: boolean,
      ajustesGlobales?: {
        factorHoras?: number;
        tarifaHora?: number;
        porcentajeDescuento?: number;
      }
    },
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    const resultados = [];

    for (const registroId of data.registroIds) {
      try {
        const aprobarDto: AprobarRegistroDto = {
          observaciones: data.observaciones,
          ...(data.aplicarAjustesGlobales && data.ajustesGlobales && {
            horasAjustadas: data.ajustesGlobales.factorHoras,
            tarifaAjustada: data.ajustesGlobales.tarifaHora,
            motivoAjustes: 'Ajuste aplicado en lote'
          })
        };

        const resultado = await this.registrosTiempoService.aprobarRegistro(
          registroId, 
          aprobarDto, 
          empresaId, 
          usuarioId
        );
        
        resultados.push({
          registroId,
          exito: true,
          registro: resultado
        });
      } catch (error) {
        resultados.push({
          registroId,
          exito: false,
          error: error.message
        });
      }
    }

    return {
      totalProcesados: data.registroIds.length,
      exitosos: resultados.filter(r => r.exito).length,
      fallidos: resultados.filter(r => !r.exito).length,
      resultados
    };
  }

  @Delete(':id')
  @Permissions('registros_tiempo:delete')
  @ApiOperation({ summary: 'Eliminar registro de tiempo' })
  @ApiResponse({ status: 204, description: 'Registro eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar registro facturado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para eliminar este registro' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    await this.registrosTiempoService.remove(id, empresaId, usuarioId);
  }
}
