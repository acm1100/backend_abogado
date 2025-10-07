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
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ProyectosService, FiltrosProyecto } from './proyectos.service';
import { CreateProyectoDto, EstadoProyecto, TipoProyecto, PrioridadProyecto } from './dto/create-proyecto.dto';
import { 
  UpdateProyectoDto,
  CambiarEstadoProyectoDto,
  AsignarRecursoDto,
  ActualizarHitoDto,
  ActualizarPresupuestoDto,
  ReportarAvanceDto,
  CerrarProyectoDto
} from './dto/update-proyecto.dto';

@ApiTags('proyectos')
@Controller('proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Post()
  @Permissions('proyectos:create')
  @ApiOperation({ 
    summary: 'Crear nuevo proyecto',
    description: 'Crea un nuevo proyecto legal con toda la información necesaria para su gestión'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Proyecto creado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Datos inválidos o cliente/caso no encontrado'
  })
  async create(@Body() createProyectoDto: CreateProyectoDto, @Request() req) {
    return await this.proyectosService.create(
      createProyectoDto, 
      req.user.empresaId, 
      req.user.sub
    );
  }

  @Get()
  @Permissions('proyectos:read')
  @ApiOperation({ 
    summary: 'Listar proyectos',
    description: 'Obtiene lista paginada de proyectos con filtros avanzados'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página (default: 20)' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'Filtrar por cliente' })
  @ApiQuery({ name: 'casoId', required: false, description: 'Filtrar por caso' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoProyecto, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoProyecto, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'prioridad', required: false, enum: PrioridadProyecto, description: 'Filtrar por prioridad' })
  @ApiQuery({ name: 'responsableId', required: false, description: 'Filtrar por responsable' })
  @ApiQuery({ name: 'fechaInicioDesde', required: false, description: 'Fecha inicio desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaInicioHasta', required: false, description: 'Fecha inicio hasta (YYYY-MM-DD)' })
  @ApiQuery({ name: 'presupuestoMin', required: false, description: 'Presupuesto mínimo' })
  @ApiQuery({ name: 'presupuestoMax', required: false, description: 'Presupuesto máximo' })
  @ApiQuery({ name: 'soloAtrasados', required: false, type: 'boolean', description: 'Solo proyectos atrasados' })
  @ApiQuery({ name: 'soloVencimientos', required: false, type: 'boolean', description: 'Solo con vencimientos próximos' })
  @ApiQuery({ name: 'busqueda', required: false, description: 'Búsqueda en nombre, descripción o código' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista de proyectos obtenida exitosamente'
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('clienteId') clienteId?: string,
    @Query('casoId') casoId?: string,
    @Query('estado') estado?: EstadoProyecto,
    @Query('tipo') tipo?: TipoProyecto,
    @Query('prioridad') prioridad?: PrioridadProyecto,
    @Query('responsableId') responsableId?: string,
    @Query('fechaInicioDesde') fechaInicioDesde?: string,
    @Query('fechaInicioHasta') fechaInicioHasta?: string,
    @Query('presupuestoMin') presupuestoMin?: number,
    @Query('presupuestoMax') presupuestoMax?: number,
    @Query('soloAtrasados') soloAtrasados?: boolean,
    @Query('soloVencimientos') soloVencimientos?: boolean,
    @Query('busqueda') busqueda?: string,
    @Request() req?
  ) {
    const filtros: FiltrosProyecto = {
      clienteId,
      casoId,
      estado,
      tipo,
      prioridad,
      responsableId,
      fechaInicioDesde,
      fechaInicioHasta,
      presupuestoMin,
      presupuestoMax,
      soloAtrasados,
      soloVencimientos,
      busqueda
    };

    return await this.proyectosService.findAll(
      filtros,
      req.user.empresaId,
      page,
      limit
    );
  }

  @Get('estadisticas')
  @Permissions('proyectos:stats')
  @ApiOperation({ 
    summary: 'Estadísticas de proyectos',
    description: 'Obtiene estadísticas generales de proyectos de la empresa'
  })
  @ApiQuery({ name: 'fechaInicioDesde', required: false, description: 'Fecha inicio desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaInicioHasta', required: false, description: 'Fecha inicio hasta (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Estadísticas obtenidas exitosamente'
  })
  async getEstadisticas(
    @Query('fechaInicioDesde') fechaInicioDesde?: string,
    @Query('fechaInicioHasta') fechaInicioHasta?: string,
    @Request() req?
  ) {
    const filtros: Partial<FiltrosProyecto> = {
      fechaInicioDesde,
      fechaInicioHasta
    };

    return await this.proyectosService.getEstadisticas(
      req.user.empresaId,
      filtros
    );
  }

  @Get(':id')
  @Permissions('proyectos:read')
  @ApiOperation({ 
    summary: 'Obtener proyecto por ID',
    description: 'Obtiene información detallada de un proyecto específico'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Proyecto encontrado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Proyecto no encontrado'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.proyectosService.findOne(id, req.user.empresaId);
  }

  @Get(':id/resumen-financiero')
  @Permissions('proyectos:read', 'financiero:read')
  @ApiOperation({ 
    summary: 'Resumen financiero del proyecto',
    description: 'Obtiene el resumen financiero detallado del proyecto'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Resumen financiero obtenido exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Proyecto no encontrado'
  })
  async getResumenFinanciero(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.proyectosService.getResumenFinanciero(id, req.user.empresaId);
  }

  @Patch(':id')
  @Permissions('proyectos:update')
  @ApiOperation({ 
    summary: 'Actualizar proyecto',
    description: 'Actualiza información del proyecto (excepto estado)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Proyecto actualizado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Proyecto no encontrado'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Datos inválidos o proyecto no se puede actualizar'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateProyectoDto: UpdateProyectoDto, 
    @Request() req
  ) {
    return await this.proyectosService.update(
      id, 
      updateProyectoDto, 
      req.user.empresaId, 
      req.user.sub
    );
  }

  @Patch(':id/estado')
  @Permissions('proyectos:update:estado')
  @ApiOperation({ 
    summary: 'Cambiar estado del proyecto',
    description: 'Cambia el estado del proyecto con validaciones de transición'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Estado cambiado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Transición de estado no válida'
  })
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cambiarEstadoDto: CambiarEstadoProyectoDto,
    @Request() req
  ) {
    return await this.proyectosService.cambiarEstado(
      id,
      cambiarEstadoDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Post(':id/recursos')
  @Permissions('proyectos:update:recursos')
  @ApiOperation({ 
    summary: 'Asignar recurso al proyecto',
    description: 'Asigna un usuario como recurso del proyecto'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Recurso asignado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Usuario ya asignado o datos inválidos'
  })
  async asignarRecurso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() asignarRecursoDto: AsignarRecursoDto,
    @Request() req
  ) {
    return await this.proyectosService.asignarRecurso(
      id,
      asignarRecursoDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Patch(':id/hitos')
  @Permissions('proyectos:update:hitos')
  @ApiOperation({ 
    summary: 'Actualizar hito del proyecto',
    description: 'Crea, actualiza, completa o elimina hitos del proyecto'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Hito actualizado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Hito no encontrado'
  })
  async actualizarHito(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actualizarHitoDto: ActualizarHitoDto,
    @Request() req
  ) {
    return await this.proyectosService.actualizarHito(
      id,
      actualizarHitoDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Patch(':id/presupuesto')
  @Permissions('proyectos:update:presupuesto')
  @ApiOperation({ 
    summary: 'Actualizar presupuesto del proyecto',
    description: 'Actualiza el presupuesto del proyecto con opción de solicitar aprobación'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Presupuesto actualizado exitosamente'
  })
  async actualizarPresupuesto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actualizarPresupuestoDto: ActualizarPresupuestoDto,
    @Request() req
  ) {
    return await this.proyectosService.actualizarPresupuesto(
      id,
      actualizarPresupuestoDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Post(':id/reportar-avance')
  @Permissions('proyectos:update:avance')
  @ApiOperation({ 
    summary: 'Reportar avance del proyecto',
    description: 'Registra un reporte de avance del proyecto con actividades y métricas'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Avance reportado exitosamente'
  })
  async reportarAvance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reportarAvanceDto: ReportarAvanceDto,
    @Request() req
  ) {
    return await this.proyectosService.reportarAvance(
      id,
      reportarAvanceDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Post(':id/cerrar')
  @Permissions('proyectos:close')
  @ApiOperation({ 
    summary: 'Cerrar proyecto',
    description: 'Cierra el proyecto con información de resultados y cierre'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Proyecto cerrado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Proyecto no se puede cerrar'
  })
  async cerrarProyecto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cerrarProyectoDto: CerrarProyectoDto,
    @Request() req
  ) {
    return await this.proyectosService.cerrarProyecto(
      id,
      cerrarProyectoDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Delete(':id')
  @Permissions('proyectos:delete')
  @ApiOperation({ 
    summary: 'Eliminar proyecto',
    description: 'Elimina un proyecto (solo en estado planificación)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Proyecto eliminado exitosamente'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Proyecto no se puede eliminar'
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.proyectosService.remove(id, req.user.empresaId, req.user.sub);
    return { message: 'Proyecto eliminado exitosamente' };
  }

  // Endpoints adicionales para gestión avanzada

  @Get(':id/cronologia')
  @Permissions('proyectos:read')
  @ApiOperation({ 
    summary: 'Cronología del proyecto',
    description: 'Obtiene la cronología de eventos del proyecto'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cronología obtenida exitosamente'
  })
  async getCronologia(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Por implementar: servicio de cronología
    return {
      message: 'Cronología del proyecto - Por implementar',
      proyectoId: id
    };
  }

  @Get(':id/documentos')
  @Permissions('proyectos:read', 'documentos:read')
  @ApiOperation({ 
    summary: 'Documentos del proyecto',
    description: 'Lista todos los documentos asociados al proyecto'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Documentos obtenidos exitosamente'
  })
  async getDocumentos(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Por implementar: integración con módulo de documentos
    return {
      message: 'Documentos del proyecto - Por implementar',
      proyectoId: id
    };
  }

  @Get(':id/tiempo-registrado')
  @Permissions('proyectos:read', 'tiempo:read')
  @ApiOperation({ 
    summary: 'Tiempo registrado en el proyecto',
    description: 'Obtiene el resumen de tiempo registrado por todos los recursos'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Tiempo registrado obtenido exitosamente'
  })
  async getTiempoRegistrado(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Por implementar: integración con módulo de registros de tiempo
    return {
      message: 'Tiempo registrado - Por implementar',
      proyectoId: id
    };
  }

  @Get(':id/gastos')
  @Permissions('proyectos:read', 'gastos:read')
  @ApiOperation({ 
    summary: 'Gastos del proyecto',
    description: 'Lista todos los gastos asociados al proyecto'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Gastos obtenidos exitosamente'
  })
  async getGastos(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Por implementar: integración con módulo de gastos
    return {
      message: 'Gastos del proyecto - Por implementar',
      proyectoId: id
    };
  }

  @Post(':id/notificaciones')
  @Permissions('proyectos:update', 'notificaciones:send')
  @ApiOperation({ 
    summary: 'Enviar notificación del proyecto',
    description: 'Envía notificaciones a los recursos del proyecto'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Notificación enviada exitosamente'
  })
  async enviarNotificacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() notificacionDto: any,
    @Request() req
  ) {
    // Por implementar: integración con módulo de notificaciones
    return {
      message: 'Notificación enviada - Por implementar',
      proyectoId: id,
      datos: notificacionDto
    };
  }

  @Post(':id/plantillas/:plantillaId/aplicar')
  @Permissions('proyectos:update', 'plantillas:use')
  @ApiOperation({ 
    summary: 'Aplicar plantilla al proyecto',
    description: 'Aplica una plantilla de proyecto para configurar hitos y actividades'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Plantilla aplicada exitosamente'
  })
  async aplicarPlantilla(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('plantillaId', ParseUUIDPipe) plantillaId: string,
    @Request() req
  ) {
    // Por implementar: integración con módulo de plantillas
    return {
      message: 'Plantilla aplicada - Por implementar',
      proyectoId: id,
      plantillaId
    };
  }

  @Post(':id/duplicar')
  @Permissions('proyectos:create')
  @ApiOperation({ 
    summary: 'Duplicar proyecto',
    description: 'Crea un nuevo proyecto basado en uno existente'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Proyecto duplicado exitosamente'
  })
  async duplicarProyecto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datosNuevoProyecto: any,
    @Request() req
  ) {
    // Por implementar: lógica de duplicación
    return {
      message: 'Proyecto duplicado - Por implementar',
      proyectoOriginalId: id,
      datos: datosNuevoProyecto
    };
  }

  @Get(':id/alertas')
  @Permissions('proyectos:read')
  @ApiOperation({ 
    summary: 'Alertas del proyecto',
    description: 'Obtiene las alertas activas del proyecto (vencimientos, presupuesto, etc.)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Alertas obtenidas exitosamente'
  })
  async getAlertas(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Por implementar: sistema de alertas
    return {
      message: 'Alertas del proyecto - Por implementar',
      proyectoId: id
    };
  }
}
