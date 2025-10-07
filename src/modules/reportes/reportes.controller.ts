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
  Res
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportesService, FiltrosReportes } from './reportes.service';
import { 
  CreateReporteDto, 
  TipoReporte, 
  FormatoReporte, 
  EstadoReporte,
  FrecuenciaReporte
} from './dto/create-reporte.dto';
import { 
  UpdateReporteDto,
  EjecutarReporteDto,
  ProgramarReporteDto,
  CompartirReporteDto,
  ExportarReporteDto
} from './dto/update-reporte.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo reporte' })
  @ApiResponse({
    status: 201,
    description: 'Reporte creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @Permissions('reportes:crear')
  async create(
    @Body() createReporteDto: CreateReporteDto,
    @Request() req: any
  ) {
    return this.reportesService.create(
      createReporteDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de reportes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de reportes obtenida exitosamente',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de elementos por página' })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoReporte, isArray: true, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'formato', required: false, enum: FormatoReporte, isArray: true, description: 'Filtrar por formato' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoReporte, isArray: true, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'etiquetas', required: false, type: [String], description: 'Filtrar por etiquetas' })
  @ApiQuery({ name: 'soloPublicos', required: false, type: Boolean, description: 'Solo reportes públicos' })
  @ApiQuery({ name: 'soloPersonales', required: false, type: Boolean, description: 'Solo reportes personales' })
  @ApiQuery({ name: 'buscar', required: false, type: String, description: 'Búsqueda en nombre y descripción' })
  @Permissions('reportes:leer')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('tipo') tipo?: TipoReporte[],
    @Query('formato') formato?: FormatoReporte[],
    @Query('estado') estado?: EstadoReporte[],
    @Query('etiquetas') etiquetas?: string[],
    @Query('soloPublicos') soloPublicos?: boolean,
    @Query('soloPersonales') soloPersonales?: boolean,
    @Query('buscar') buscar?: string,
    @Request() req: any
  ) {
    const filtros: FiltrosReportes = {
      tipo: Array.isArray(tipo) ? tipo : tipo ? [tipo] : undefined,
      formato: Array.isArray(formato) ? formato : formato ? [formato] : undefined,
      estado: Array.isArray(estado) ? estado : estado ? [estado] : undefined,
      etiquetas: Array.isArray(etiquetas) ? etiquetas : etiquetas ? [etiquetas] : undefined,
      soloPublicos,
      soloPersonales,
      buscar,
      creadoPorId: soloPersonales ? req.user.sub : undefined
    };

    return this.reportesService.findAll(
      req.user.empresaId,
      filtros,
      page,
      limit
    );
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de reportes' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @Permissions('reportes:estadisticas')
  async obtenerEstadisticas(@Request() req: any) {
    return this.reportesService.obtenerEstadisticas(req.user.empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener reporte por ID' })
  @ApiResponse({
    status: 200,
    description: 'Reporte encontrado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Reporte no encontrado',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @Permissions('reportes:leer')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.reportesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar reporte' })
  @ApiResponse({
    status: 200,
    description: 'Reporte actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Reporte no encontrado',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @Permissions('reportes:actualizar')
  async update(
    @Param('id') id: string,
    @Body() updateReporteDto: UpdateReporteDto,
    @Request() req: any
  ) {
    return this.reportesService.update(id, updateReporteDto, req.user.empresaId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar reporte' })
  @ApiResponse({
    status: 204,
    description: 'Reporte eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Reporte no encontrado',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @Permissions('reportes:eliminar')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.reportesService.remove(id, req.user.empresaId);
  }

  @Post(':id/ejecutar')
  @ApiOperation({ summary: 'Ejecutar reporte' })
  @ApiResponse({
    status: 200,
    description: 'Reporte ejecutado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Reporte no encontrado',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @Permissions('reportes:ejecutar')
  async ejecutar(
    @Param('id') id: string,
    @Body() ejecutarDto: EjecutarReporteDto,
    @Request() req: any
  ) {
    return this.reportesService.ejecutar(id, ejecutarDto, req.user.empresaId);
  }

  @Post(':id/programar')
  @ApiOperation({ summary: 'Programar ejecución de reporte' })
  @ApiResponse({
    status: 200,
    description: 'Reporte programado exitosamente',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @Permissions('reportes:programar')
  async programar(
    @Param('id') id: string,
    @Body() programarDto: ProgramarReporteDto,
    @Request() req: any
  ) {
    return this.reportesService.programar(id, programarDto, req.user.empresaId);
  }

  @Post(':id/compartir')
  @ApiOperation({ summary: 'Compartir reporte con otros usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Reporte compartido exitosamente',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @Permissions('reportes:compartir')
  async compartir(
    @Param('id') id: string,
    @Body() compartirDto: CompartirReporteDto,
    @Request() req: any
  ) {
    return this.reportesService.compartir(id, compartirDto, req.user.empresaId);
  }

  @Post(':id/exportar')
  @ApiOperation({ summary: 'Exportar reporte en formato específico' })
  @ApiResponse({
    status: 200,
    description: 'Reporte exportado exitosamente',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @Permissions('reportes:exportar')
  async exportar(
    @Param('id') id: string,
    @Body() exportarDto: ExportarReporteDto,
    @Request() req: any,
    @Res() res: Response
  ) {
    const resultado = await this.reportesService.exportar(id, exportarDto, req.user.empresaId);

    // Configurar headers para descarga
    const extension = this.getExtensionPorFormato(resultado.formato);
    const filename = `${resultado.nombre}.${extension}`;
    
    res.set({
      'Content-Type': this.getContentTypePorFormato(resultado.formato),
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return res.send(resultado.contenido);
  }

  // Endpoints específicos por tipo de reporte

  @Get('tipos/financieros')
  @ApiOperation({ summary: 'Obtener reportes financieros' })
  @ApiResponse({
    status: 200,
    description: 'Reportes financieros obtenidos exitosamente',
  })
  @Permissions('reportes:leer')
  async obtenerFinancieros(@Request() req: any) {
    const filtros: FiltrosReportes = {
      tipo: [TipoReporte.FINANCIERO, TipoReporte.FACTURACION, TipoReporte.GASTOS],
      estado: [EstadoReporte.ACTIVO]
    };

    const result = await this.reportesService.findAll(req.user.empresaId, filtros, 1, 100);
    return result.data;
  }

  @Get('tipos/operacionales')
  @ApiOperation({ summary: 'Obtener reportes operacionales' })
  @ApiResponse({
    status: 200,
    description: 'Reportes operacionales obtenidos exitosamente',
  })
  @Permissions('reportes:leer')
  async obtenerOperacionales(@Request() req: any) {
    const filtros: FiltrosReportes = {
      tipo: [TipoReporte.OPERACIONAL, TipoReporte.CASOS, TipoReporte.PROYECTOS, TipoReporte.TIEMPO],
      estado: [EstadoReporte.ACTIVO]
    };

    const result = await this.reportesService.findAll(req.user.empresaId, filtros, 1, 100);
    return result.data;
  }

  @Get('dashboards/principales')
  @ApiOperation({ summary: 'Obtener dashboards principales' })
  @ApiResponse({
    status: 200,
    description: 'Dashboards obtenidos exitosamente',
  })
  @Permissions('reportes:leer')
  async obtenerDashboards(@Request() req: any) {
    const filtros: FiltrosReportes = {
      tipo: [TipoReporte.DASHBOARD],
      estado: [EstadoReporte.ACTIVO],
      soloPublicos: true
    };

    const result = await this.reportesService.findAll(req.user.empresaId, filtros, 1, 50);
    return result.data;
  }

  @Post('predefinidos/facturacionMensual')
  @ApiOperation({ summary: 'Ejecutar reporte predefinido de facturación mensual' })
  @ApiResponse({
    status: 200,
    description: 'Reporte de facturación ejecutado exitosamente',
  })
  @Permissions('reportes:ejecutar')
  async facturacionMensual(
    @Body() body: { mes: number; año: number },
    @Request() req: any
  ) {
    const ejecutarDto: EjecutarReporteDto = {
      parametros: { mes: body.mes, año: body.año },
      rangoFechas: {
        fechaInicio: `${body.año}-${body.mes.toString().padStart(2, '0')}-01`,
        fechaFin: `${body.año}-${body.mes.toString().padStart(2, '0')}-31`
      }
    };

    // Asumimos que existe un reporte predefinido de facturación
    return this.reportesService.ejecutar('facturacion-mensual', ejecutarDto, req.user.empresaId);
  }

  @Post('predefinidos/productividadUsuarios')
  @ApiOperation({ summary: 'Ejecutar reporte predefinido de productividad por usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Reporte de productividad ejecutado exitosamente',
  })
  @Permissions('reportes:ejecutar')
  async productividadUsuarios(
    @Body() body: { fechaInicio: string; fechaFin: string; usuariosIds?: string[] },
    @Request() req: any
  ) {
    const ejecutarDto: EjecutarReporteDto = {
      parametros: { usuariosIds: body.usuariosIds },
      rangoFechas: {
        fechaInicio: body.fechaInicio,
        fechaFin: body.fechaFin
      }
    };

    return this.reportesService.ejecutar('productividad-usuarios', ejecutarDto, req.user.empresaId);
  }

  @Post('predefinidos/estadoCasos')
  @ApiOperation({ summary: 'Ejecutar reporte predefinido de estado de casos' })
  @ApiResponse({
    status: 200,
    description: 'Reporte de casos ejecutado exitosamente',
  })
  @Permissions('reportes:ejecutar')
  async estadoCasos(
    @Body() body: { estados?: string[]; clientesIds?: string[]; fechaDesde?: string },
    @Request() req: any
  ) {
    const ejecutarDto: EjecutarReporteDto = {
      parametros: { 
        estados: body.estados, 
        clientesIds: body.clientesIds 
      },
      filtrosAdicionales: body.fechaDesde ? [{
        campo: 'fecha_creacion',
        operador: '>=',
        valor: body.fechaDesde
      }] : undefined
    };

    return this.reportesService.ejecutar('estado-casos', ejecutarDto, req.user.empresaId);
  }

  @Get('usuario/:usuarioId/reportes')
  @ApiOperation({ summary: 'Obtener reportes creados por un usuario específico' })
  @ApiResponse({
    status: 200,
    description: 'Reportes del usuario obtenidos exitosamente',
  })
  @ApiParam({ name: 'usuarioId', description: 'ID del usuario' })
  @Permissions('reportes:leer')
  async obtenerReportesUsuario(
    @Param('usuarioId') usuarioId: string,
    @Request() req: any
  ) {
    const filtros: FiltrosReportes = {
      creadoPorId: usuarioId
    };

    return this.reportesService.findAll(req.user.empresaId, filtros, 1, 100);
  }

  @Get('publicos/disponibles')
  @ApiOperation({ summary: 'Obtener reportes públicos disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Reportes públicos obtenidos exitosamente',
  })
  @Permissions('reportes:leer')
  async obtenerReportesPublicos(@Request() req: any) {
    const filtros: FiltrosReportes = {
      soloPublicos: true,
      estado: [EstadoReporte.ACTIVO]
    };

    const result = await this.reportesService.findAll(req.user.empresaId, filtros, 1, 100);
    return result.data;
  }

  @Get('programados/proximas-ejecuciones')
  @ApiOperation({ summary: 'Obtener próximas ejecuciones programadas' })
  @ApiResponse({
    status: 200,
    description: 'Próximas ejecuciones obtenidas exitosamente',
  })
  @Permissions('reportes:leer')
  async obtenerProximasEjecuciones(@Request() req: any) {
    // Simular obtención de próximas ejecuciones
    return {
      proximasEjecuciones: [
        {
          reporteId: 'rep1',
          nombreReporte: 'Facturación Mensual',
          proximaEjecucion: new Date(Date.now() + 24 * 60 * 60 * 1000),
          frecuencia: 'mensual'
        },
        {
          reporteId: 'rep2',
          nombreReporte: 'Estado de Casos',
          proximaEjecucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          frecuencia: 'semanal'
        }
      ]
    };
  }

  // Métodos auxiliares privados

  private getExtensionPorFormato(formato: string): string {
    const extensiones = {
      'pdf': 'pdf',
      'excel': 'xlsx',
      'csv': 'csv',
      'json': 'json',
      'html': 'html'
    };

    return extensiones[formato] || 'txt';
  }

  private getContentTypePorFormato(formato: string): string {
    const contentTypes = {
      'pdf': 'application/pdf',
      'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'json': 'application/json',
      'html': 'text/html'
    };

    return contentTypes[formato] || 'text/plain';
  }
}
