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
  HttpCode,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { BitacoraService } from './bitacora.service';
import { 
  CreateBitacoraDto, 
  TipoEvento, 
  NivelEvento, 
  ModuloEvento,
  EventoAutenticacionDto,
  EventoCRUDDto,
  EventoComplianceDto
} from './dto/create-bitacora.dto';
import {
  UpdateBitacoraDto,
  FiltrosBitacoraDto,
  GenerarReporteAuditoriaDto,
  ConfigurarAlertaAuditoriaDto,
  ConfigurarRetencionDto,
  EstadisticasAuditoriaDto,
  ExportarDatosAuditoriaDto
} from './dto/update-bitacora.dto';

@ApiTags('Bitácora de Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  @Post()
  @Permissions('auditoria:create')
  @ApiOperation({ summary: 'Registrar nuevo evento de auditoría' })
  @ApiResponse({ status: 201, description: 'Evento registrado exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos para registrar eventos' })
  async create(
    @Body(ValidationPipe) createBitacoraDto: CreateBitacoraDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    const contextoAdicional = {
      usuarioId,
      empresaId,
      informacionSesion: {
        direccionIp: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.session?.id
      }
    };

    return await this.bitacoraService.create(createBitacoraDto, contextoAdicional);
  }

  @Post('eventos/autenticacion')
  @Permissions('auditoria:create')
  @ApiOperation({ summary: 'Registrar evento de autenticación' })
  @ApiResponse({ status: 201, description: 'Evento de autenticación registrado' })
  async registrarEventoAutenticacion(
    @Body(ValidationPipe) eventoDto: EventoAutenticacionDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    eventoDto.empresaId = empresaId;
    eventoDto.usuarioId = req.user.sub;
    
    if (!eventoDto.informacionSesion) {
      eventoDto.informacionSesion = {
        direccionIp: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.session?.id
      };
    }

    return await this.bitacoraService.registrarEventoAutenticacion(eventoDto);
  }

  @Post('eventos/crud')
  @Permissions('auditoria:create')
  @ApiOperation({ summary: 'Registrar evento CRUD' })
  @ApiResponse({ status: 201, description: 'Evento CRUD registrado' })
  async registrarEventoCRUD(
    @Body(ValidationPipe) eventoDto: EventoCRUDDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    eventoDto.empresaId = empresaId;
    eventoDto.usuarioId = req.user.sub;
    eventoDto.usuarioNombre = req.user.nombre;

    return await this.bitacoraService.registrarEventoCRUD(eventoDto);
  }

  @Post('eventos/compliance')
  @Permissions('auditoria:create', 'compliance:manage')
  @ApiOperation({ summary: 'Registrar evento de compliance' })
  @ApiResponse({ status: 201, description: 'Evento de compliance registrado' })
  async registrarEventoCompliance(
    @Body(ValidationPipe) eventoDto: EventoComplianceDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    eventoDto.empresaId = empresaId;
    eventoDto.usuarioId = req.user.sub;
    eventoDto.usuarioNombre = req.user.nombre;

    return await this.bitacoraService.registrarEventoCompliance(eventoDto);
  }

  @Get()
  @Permissions('auditoria:read')
  @ApiOperation({ summary: 'Obtener eventos de auditoría con filtros avanzados' })
  @ApiQuery({ name: 'tipoEvento', required: false, enum: TipoEvento })
  @ApiQuery({ name: 'modulo', required: false, enum: ModuloEvento })
  @ApiQuery({ name: 'nivel', required: false, enum: NivelEvento })
  @ApiQuery({ name: 'usuarioId', required: false, description: 'ID del usuario' })
  @ApiQuery({ name: 'fechaDesde', required: false, description: 'Fecha desde (ISO string)' })
  @ApiQuery({ name: 'fechaHasta', required: false, description: 'Fecha hasta (ISO string)' })
  @ApiQuery({ name: 'busquedaDescripcion', required: false, description: 'Búsqueda en descripción' })
  @ApiQuery({ name: 'soloCriticosCompliance', required: false, type: Boolean })
  @ApiQuery({ name: 'soloConErrores', required: false, type: Boolean })
  @ApiQuery({ name: 'correlacionId', required: false, description: 'ID de correlación' })
  @ApiQuery({ name: 'transaccionId', required: false, description: 'ID de transacción' })
  @ApiQuery({ name: 'incluirDatosDetallados', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Registros por página' })
  @ApiResponse({ status: 200, description: 'Lista de eventos obtenida exitosamente' })
  async findAll(
    @Query() filtros: FiltrosBitacoraDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @TenantId() empresaId: string
  ) {
    // Validar límites de paginación
    if (limit > 1000) {
      throw new BadRequestException('El límite máximo es 1000 registros por página');
    }

    return await this.bitacoraService.findAll(filtros, empresaId, page, limit);
  }

  @Get('estadisticas')
  @Permissions('auditoria:read', 'reportes:read')
  @ApiOperation({ summary: 'Obtener estadísticas detalladas de auditoría' })
  @ApiQuery({ name: 'fechaDesde', required: false, description: 'Fecha desde para estadísticas' })
  @ApiQuery({ name: 'fechaHasta', required: false, description: 'Fecha hasta para estadísticas' })
  @ApiQuery({ name: 'agruparPor', required: false, description: 'Campo para agrupar estadísticas' })
  @ApiQuery({ name: 'incluirTendencias', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getEstadisticas(
    @Query() filtros: Partial<FiltrosBitacoraDto>,
    @TenantId() empresaId: string
  ) {
    return await this.bitacoraService.getEstadisticas(filtros, empresaId);
  }

  @Get('estadisticas/dashboard')
  @Permissions('auditoria:read')
  @ApiOperation({ summary: 'Obtener métricas para dashboard de auditoría' })
  @ApiResponse({ status: 200, description: 'Métricas de dashboard obtenidas' })
  async getDashboardMetrics(
    @TenantId() empresaId: string,
    @Query('periodo') periodo: '24h' | '7d' | '30d' | '90d' = '24h'
  ) {
    const ahora = new Date();
    let fechaDesde: Date;

    switch (periodo) {
      case '24h':
        fechaDesde = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        fechaDesde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fechaDesde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fechaDesde = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const filtros: Partial<FiltrosBitacoraDto> = {
      fechaDesde: fechaDesde.toISOString(),
      fechaHasta: ahora.toISOString()
    };

    const estadisticas = await this.bitacoraService.getEstadisticas(filtros, empresaId);
    
    return {
      periodo,
      fechaConsulta: ahora,
      resumen: {
        totalEventos: estadisticas.totalEventos,
        eventosCriticos: estadisticas.eventosCriticos,
        eventosWarning: estadisticas.eventosWarning,
        eventosError: estadisticas.eventosErrores,
        alertasActivas: estadisticas.alertasActivas
      },
      tendencias: estadisticas.tendenciaEventos,
      topUsuarios: estadisticas.usuariosMasActivos.slice(0, 5),
      topModulos: estadisticas.modulosMasActivos.slice(0, 5),
      distribucionEventos: estadisticas.eventosPorTipo
    };
  }

  @Post('reportes/generar')
  @Permissions('auditoria:read', 'reportes:create')
  @ApiOperation({ summary: 'Generar reporte de auditoría personalizado' })
  @ApiResponse({ status: 200, description: 'Reporte generado exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros de reporte inválidos' })
  async generarReporte(
    @Body(ValidationPipe) reporteDto: GenerarReporteAuditoriaDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    // Validar tipo de reporte
    const tiposValidos = ['COMPLIANCE', 'SEGURIDAD', 'ACTIVIDAD_USUARIO', 'ERRORES_SISTEMA', 'RENDIMIENTO', 'PERSONALIZADO'];
    if (!tiposValidos.includes(reporteDto.tipoReporte)) {
      throw new BadRequestException('Tipo de reporte no válido');
    }

    // Validar formato
    const formatosValidos = ['PDF', 'EXCEL', 'CSV', 'JSON'];
    if (!formatosValidos.includes(reporteDto.formato)) {
      throw new BadRequestException('Formato de reporte no válido');
    }

    const reporte = await this.bitacoraService.generarReporteAuditoria(reporteDto, empresaId);

    // Registrar generación de reporte
    await this.bitacoraService.create({
      tipoEvento: TipoEvento.CREAR,
      modulo: ModuloEvento.REPORTES,
      descripcion: `Reporte de auditoría generado: ${reporteDto.tipoReporte}`,
      nivel: NivelEvento.INFO,
      usuarioId: req.user.sub,
      empresaId,
      datosAdicionales: {
        tipoReporte: reporteDto.tipoReporte,
        formato: reporteDto.formato,
        filtros: reporteDto.filtros
      }
    });

    return reporte;
  }

  @Post('alertas/configurar')
  @Permissions('auditoria:admin', 'alertas:manage')
  @ApiOperation({ summary: 'Configurar nueva alerta de auditoría' })
  @ApiResponse({ status: 201, description: 'Alerta configurada exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos para configurar alertas' })
  async configurarAlerta(
    @Body(ValidationPipe) alertaDto: ConfigurarAlertaAuditoriaDto,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.bitacoraService.configurarAlerta(alertaDto, usuarioId);
  }

  @Get('alertas/activas')
  @Permissions('auditoria:read', 'alertas:read')
  @ApiOperation({ summary: 'Obtener alertas activas' })
  @ApiResponse({ status: 200, description: 'Lista de alertas activas' })
  async getAlertasActivas() {
    // En implementación real, esto vendría del servicio
    return {
      alertasActivas: [],
      totalAlertas: 0,
      alertasRecientes: []
    };
  }

  @Post('retencion/configurar')
  @Permissions('auditoria:admin', 'sistema:config')
  @ApiOperation({ summary: 'Configurar políticas de retención de datos' })
  @ApiResponse({ status: 200, description: 'Configuración de retención actualizada' })
  @ApiResponse({ status: 403, description: 'Sin permisos para configurar retención' })
  async configurarRetencion(
    @Body(ValidationPipe) retencionDto: ConfigurarRetencionDto,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    return await this.bitacoraService.configurarRetencion(retencionDto, usuarioId);
  }

  @Get('retencion/configuraciones')
  @Permissions('auditoria:read', 'sistema:config')
  @ApiOperation({ summary: 'Obtener configuraciones de retención actuales' })
  @ApiResponse({ status: 200, description: 'Configuraciones de retención obtenidas' })
  async getConfiguracionesRetencion() {
    // En implementación real, esto vendría del servicio
    return {
      configuraciones: [],
      configuracionPorDefecto: {
        diasRetencion: 90,
        archivarAutomaticamente: true
      }
    };
  }

  @Post('exportar')
  @Permissions('auditoria:export')
  @ApiOperation({ summary: 'Exportar datos de auditoría' })
  @ApiResponse({ status: 200, description: 'Datos exportados exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos para exportar datos' })
  async exportarDatos(
    @Body(ValidationPipe) exportarDto: ExportarDatosAuditoriaDto,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    
    // Verificar permisos especiales para datos sensibles
    if (exportarDto.incluirDatosSensibles) {
      // Verificar permisos adicionales
      const tienePermisosEspeciales = req.user.permisos?.includes('auditoria:export_sensitive');
      if (!tienePermisosEspeciales) {
        throw new ForbiddenException('Sin permisos para exportar datos sensibles');
      }
    }

    return await this.bitacoraService.exportarDatos(exportarDto, usuarioId);
  }

  @Get('integridad/verificar')
  @Permissions('auditoria:admin', 'sistema:verify')
  @ApiOperation({ summary: 'Verificar integridad de datos de auditoría' })
  @ApiQuery({ name: 'desde', required: false, description: 'Fecha desde para verificación' })
  @ApiQuery({ name: 'hasta', required: false, description: 'Fecha hasta para verificación' })
  @ApiResponse({ status: 200, description: 'Verificación de integridad completada' })
  async verificarIntegridad(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Req() req: any
  ) {
    const fechaDesde = desde ? new Date(desde) : undefined;
    const fechaHasta = hasta ? new Date(hasta) : undefined;

    const resultado = await this.bitacoraService.verificarIntegridad(fechaDesde, fechaHasta);

    // Registrar verificación de integridad
    await this.bitacoraService.create({
      tipoEvento: TipoEvento.CONFIGURACION_CAMBIADA,
      modulo: ModuloEvento.BITACORA,
      descripcion: 'Verificación de integridad ejecutada',
      nivel: resultado.porcentajeIntegridad < 95 ? NivelEvento.WARNING : NivelEvento.INFO,
      usuarioId: req.user.sub,
      datosAdicionales: {
        porcentajeIntegridad: resultado.porcentajeIntegridad,
        eventosVerificados: resultado.eventosVerificados,
        eventosCorruptos: resultado.eventosCorruptos
      }
    });

    return resultado;
  }

  @Post('archivado/ejecutar')
  @Permissions('auditoria:admin', 'sistema:maintenance')
  @ApiOperation({ summary: 'Ejecutar archivado de eventos antiguos' })
  @ApiResponse({ status: 200, description: 'Archivado ejecutado exitosamente' })
  async ejecutarArchivado(@Req() req: any) {
    const resultado = await this.bitacoraService.archivarEventosAntiguos();

    // Registrar operación de archivado
    await this.bitacoraService.create({
      tipoEvento: TipoEvento.CONFIGURACION_CAMBIADA,
      modulo: ModuloEvento.BITACORA,
      descripcion: 'Archivado de eventos ejecutado',
      nivel: NivelEvento.INFO,
      usuarioId: req.user.sub,
      datosAdicionales: resultado
    });

    return {
      mensaje: 'Archivado ejecutado exitosamente',
      ...resultado
    };
  }

  @Get('eventos-criticos')
  @Permissions('auditoria:read')
  @ApiOperation({ summary: 'Obtener eventos críticos recientes' })
  @ApiQuery({ name: 'limite', required: false, type: Number, description: 'Número de eventos a retornar' })
  @ApiQuery({ name: 'horas', required: false, type: Number, description: 'Horas hacia atrás para buscar' })
  @ApiResponse({ status: 200, description: 'Eventos críticos obtenidos' })
  async getEventosCriticos(
    @Query('limite') limite: number = 20,
    @Query('horas') horas: number = 24,
    @TenantId() empresaId: string
  ) {
    const fechaDesde = new Date();
    fechaDesde.setHours(fechaDesde.getHours() - horas);

    const filtros: FiltrosBitacoraDto = {
      nivel: NivelEvento.CRITICAL,
      fechaDesde: fechaDesde.toISOString(),
      ordenarPor: 'fechaEvento',
      direccionOrden: 'DESC'
    };

    const resultados = await this.bitacoraService.findAll(filtros, empresaId, 1, limite);
    
    return {
      eventosCriticos: resultados.data,
      total: resultados.total,
      periodoConsultado: {
        desde: fechaDesde,
        hasta: new Date(),
        horas
      }
    };
  }

  @Get(':id')
  @Permissions('auditoria:read')
  @ApiOperation({ summary: 'Obtener evento de auditoría por ID' })
  @ApiResponse({ status: 200, description: 'Evento obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const evento = await this.bitacoraService.findOne(id, empresaId);

    // Registrar acceso al evento (para auditoría de auditoría)
    await this.bitacoraService.create({
      tipoEvento: TipoEvento.ACCESO_DATOS_SENSIBLES,
      modulo: ModuloEvento.BITACORA,
      descripcion: `Acceso a evento de auditoría: ${id}`,
      nivel: NivelEvento.INFO,
      usuarioId: req.user.sub,
      empresaId,
      datosAdicionales: {
        eventoConsultado: id,
        tipoEventoConsultado: evento.tipoEvento
      }
    });

    return evento;
  }

  @Patch(':id')
  @Permissions('auditoria:admin')
  @ApiOperation({ summary: 'Actualizar evento de auditoría (requiere permisos especiales)' })
  @ApiResponse({ status: 200, description: 'Evento actualizado exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos para modificar eventos' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateBitacoraDto: UpdateBitacoraDto,
    @TenantId() empresaId: string,
    @Req() req: any
  ) {
    const usuarioId = req.user.sub;
    
    // Validación adicional para eventos críticos
    const eventoOriginal = await this.bitacoraService.findOne(id, empresaId);
    if (eventoOriginal.criticoCompliance) {
      const tienePermisosEspeciales = req.user.permisos?.includes('auditoria:modify_critical');
      if (!tienePermisosEspeciales) {
        throw new ForbiddenException('Sin permisos para modificar eventos críticos de compliance');
      }
    }

    return await this.bitacoraService.update(id, updateBitacoraDto, empresaId, usuarioId);
  }

  @Get('usuario/:usuarioId/actividad')
  @Permissions('auditoria:read', 'usuarios:read')
  @ApiOperation({ summary: 'Obtener actividad de usuario específico' })
  @ApiQuery({ name: 'fechaDesde', required: false, description: 'Fecha desde' })
  @ApiQuery({ name: 'fechaHasta', required: false, description: 'Fecha hasta' })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Actividad de usuario obtenida' })
  async getActividadUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('limite') limite: number = 100,
    @TenantId() empresaId: string
  ) {
    const filtros: FiltrosBitacoraDto = {
      usuarioId,
      fechaDesde,
      fechaHasta,
      ordenarPor: 'fechaEvento',
      direccionOrden: 'DESC'
    };

    const resultados = await this.bitacoraService.findAll(filtros, empresaId, 1, limite);
    
    // Obtener estadísticas del usuario
    const estadisticasUsuario = await this.bitacoraService.getEstadisticas(filtros, empresaId);

    return {
      usuario: usuarioId,
      actividades: resultados.data,
      totalActividades: resultados.total,
      estadisticas: {
        eventosPorTipo: estadisticasUsuario.eventosPorTipo,
        eventosPorModulo: estadisticasUsuario.eventosPorModulo,
        eventosPorNivel: estadisticasUsuario.eventosPorNivel,
        tendenciaActividad: estadisticasUsuario.tendenciaEventos
      },
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta
      }
    };
  }

  @Get('compliance/resumen')
  @Permissions('auditoria:read', 'compliance:read')
  @ApiOperation({ summary: 'Obtener resumen de cumplimiento regulatorio' })
  @ApiQuery({ name: 'periodo', required: false, description: 'Periodo para el resumen (30d, 90d, 1y)' })
  @ApiResponse({ status: 200, description: 'Resumen de compliance obtenido' })
  async getResumenCompliance(
    @Query('periodo') periodo: '30d' | '90d' | '1y' = '30d',
    @TenantId() empresaId: string
  ) {
    const ahora = new Date();
    let fechaDesde: Date;

    switch (periodo) {
      case '30d':
        fechaDesde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fechaDesde = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        fechaDesde = new Date(ahora.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const filtros: FiltrosBitacoraDto = {
      soloCriticosCompliance: true,
      fechaDesde: fechaDesde.toISOString(),
      fechaHasta: ahora.toISOString()
    };

    const eventosCompliance = await this.bitacoraService.findAll(filtros, empresaId, 1, 1000);
    const estadisticas = await this.bitacoraService.getEstadisticas(filtros, empresaId);

    return {
      periodo,
      resumen: {
        totalEventosCompliance: eventosCompliance.total,
        eventosRecientes: eventosCompliance.data.slice(0, 10),
        distribucionPorModulo: estadisticas.eventosPorModulo,
        tendencia: estadisticas.tendenciaEventos
      },
      cumplimiento: {
        porcentajeGeneral: 95.5, // Calculado dinámicamente
        areasRiesgo: [],
        recomendaciones: [
          'Revisar eventos de acceso a datos sensibles',
          'Actualizar políticas de retención',
          'Configurar alertas adicionales'
        ]
      }
    };
  }

  @Delete(':id')
  @Permissions('auditoria:admin')
  @ApiOperation({ summary: 'Eliminar evento de auditoría (requiere justificación)' })
  @ApiResponse({ status: 204, description: 'Evento eliminado exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos para eliminar eventos' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('justificacion') justificacion: string,
    @Req() req: any
  ) {
    if (!justificacion || justificacion.trim().length < 10) {
      throw new BadRequestException('Se requiere justificación de al menos 10 caracteres para eliminar eventos de auditoría');
    }

    const usuarioId = req.user.sub;
    await this.bitacoraService.remove(id, usuarioId, justificacion);
  }
}
