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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FlujosTrabajoService } from './flujos-trabajo.service';
import {
  CreateFlujoTrabajoDto,
  UpdateFlujoTrabajoDto,
  CambiarEstadoFlujoDto,
  EjectutarFlujoDto,
  ActualizarPasoDto,
  DuplicarFlujoDto,
  ImportarFlujoDto,
  FiltrosFlujoTrabajoDto,
  TipoFlujoTrabajo,
  EstadoFlujoTrabajo,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

@ApiTags('Flujos de Trabajo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TransformInterceptor)
@Controller('flujos-trabajo')
export class FlujosTrabajoController {
  constructor(private readonly flujosTrabajoService: FlujosTrabajoService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear nuevo flujo de trabajo',
    description: 'Crea un flujo de trabajo automatizado con pasos, acciones y triggers configurables'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Flujo de trabajo creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o estructura del flujo incorrecta',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sin permisos para crear flujos de trabajo',
  })
  @Permissions('workflows:create')
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createFlujoTrabajoDto: CreateFlujoTrabajoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.create(
      createFlujoTrabajoDto,
      req.user.id,
      empresaId,
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener flujos de trabajo',
    description: 'Lista todos los flujos de trabajo con capacidad de filtrado y búsqueda'
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar por tipo de flujo',
    enum: TipoFlujoTrabajo,
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
    enum: EstadoFlujoTrabajo,
  })
  @ApiQuery({
    name: 'activo',
    required: false,
    description: 'Filtrar por flujos activos',
    type: 'boolean',
  })
  @ApiQuery({
    name: 'prioridad',
    required: false,
    description: 'Filtrar por prioridad',
    type: 'number',
  })
  @ApiQuery({
    name: 'usuarioCreador',
    required: false,
    description: 'Filtrar por creador (UUID)',
    type: 'string',
  })
  @ApiQuery({
    name: 'etiquetas',
    required: false,
    description: 'Filtrar por etiquetas (separadas por coma)',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de flujos de trabajo obtenida exitosamente',
  })
  @Permissions('workflows:read')
  async findAll(
    @Query() query: any,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    const filtros: FiltrosFlujoTrabajoDto = {
      tipo: query.tipo,
      estado: query.estado,
      activo: query.activo === 'true' ? true : query.activo === 'false' ? false : undefined,
      prioridad: query.prioridad ? parseInt(query.prioridad) : undefined,
      usuarioCreador: query.usuarioCreador,
      etiquetas: query.etiquetas ? query.etiquetas.split(',').map((t: string) => t.trim()) : undefined,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      version: query.version,
      administrador: query.administrador,
      tieneEjecuciones: query.tieneEjecuciones === 'true' ? true : query.tieneEjecuciones === 'false' ? false : undefined,
    };

    return await this.flujosTrabajoService.findAll(
      filtros,
      empresaId,
      req.user.id,
    );
  }

  @Get('estadisticas')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de flujos',
    description: 'Obtiene estadísticas consolidadas de todos los flujos de trabajo'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @Permissions('workflows:stats')
  async obtenerEstadisticas(
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.obtenerEstadisticas(empresaId);
  }

  @Get('tipos')
  @ApiOperation({ 
    summary: 'Obtener tipos de flujos disponibles',
    description: 'Lista todos los tipos de flujos de trabajo disponibles'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipos de flujos obtenidos exitosamente',
  })
  @Permissions('workflows:read')
  async obtenerTipos() {
    return {
      tipos: Object.values(TipoFlujoTrabajo).map(tipo => ({
        valor: tipo,
        descripcion: this.getDescripcionTipo(tipo),
        categoria: this.getCategoriaTipo(tipo),
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener flujo por ID',
    description: 'Obtiene los detalles completos de un flujo de trabajo específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flujo de trabajo encontrado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Flujo de trabajo no encontrado',
  })
  @Permissions('workflows:read')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.findOne(id, empresaId);
  }

  @Get(':id/metricas')
  @ApiOperation({ 
    summary: 'Obtener métricas de un flujo',
    description: 'Obtiene métricas detalladas de rendimiento y ejecución de un flujo específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Métricas obtenidas exitosamente',
  })
  @Permissions('workflows:metrics')
  async obtenerMetricas(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.obtenerMetricas(id, empresaId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar flujo de trabajo',
    description: 'Actualiza los datos y configuración de un flujo de trabajo existente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flujo de trabajo actualizado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Flujo de trabajo no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o cambios no permitidos',
  })
  @Permissions('workflows:update')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFlujoTrabajoDto: UpdateFlujoTrabajoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.update(
      id,
      updateFlujoTrabajoDto,
      req.user.id,
      empresaId,
    );
  }

  @Patch(':id/estado')
  @ApiOperation({ 
    summary: 'Cambiar estado de flujo',
    description: 'Cambia el estado de un flujo (activar, pausar, archivar, etc.)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado cambiado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Transición de estado no válida',
  })
  @Permissions('workflows:change-status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cambiarEstadoDto: CambiarEstadoFlujoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.cambiarEstado(
      id,
      cambiarEstadoDto,
      req.user.id,
      empresaId,
    );
  }

  @Post(':id/ejecutar')
  @ApiOperation({ 
    summary: 'Ejecutar flujo de trabajo',
    description: 'Inicia la ejecución de un flujo de trabajo con los datos proporcionados'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ejecución iniciada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Flujo no ejecutable o datos insuficientes',
  })
  @HttpCode(HttpStatus.OK)
  @Permissions('workflows:execute')
  @UsePipes(new ValidationPipe({ transform: true }))
  async ejecutar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() ejecutarDto: EjectutarFlujoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.ejecutar(
      id,
      ejecutarDto,
      req.user.id,
      empresaId,
    );
  }

  @Post(':id/duplicar')
  @ApiOperation({ 
    summary: 'Duplicar flujo de trabajo',
    description: 'Crea una copia de un flujo existente con las modificaciones especificadas'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo a duplicar',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Flujo duplicado exitosamente',
  })
  @HttpCode(HttpStatus.CREATED)
  @Permissions('workflows:create')
  @UsePipes(new ValidationPipe({ transform: true }))
  async duplicar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() duplicarDto: DuplicarFlujoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    return await this.flujosTrabajoService.duplicar(
      id,
      duplicarDto,
      req.user.id,
      empresaId,
    );
  }

  @Post('importar')
  @ApiOperation({ 
    summary: 'Importar flujo de trabajo',
    description: 'Importa un flujo desde una definición JSON externa'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Flujo importado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Estructura de flujo inválida',
  })
  @HttpCode(HttpStatus.CREATED)
  @Permissions('workflows:import')
  @UsePipes(new ValidationPipe({ transform: true }))
  async importar(
    @Body() importarDto: ImportarFlujoDto,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    // Implementar lógica de importación
    throw new Error('Funcionalidad de importación no implementada');
  }

  @Get(':id/exportar')
  @ApiOperation({ 
    summary: 'Exportar flujo de trabajo',
    description: 'Exporta la definición completa de un flujo en formato JSON'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flujo exportado exitosamente',
  })
  @Permissions('workflows:export')
  async exportar(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() empresaId: string,
  ) {
    const flujo = await this.flujosTrabajoService.findOne(id, empresaId);
    
    return {
      version: '1.0',
      flujo: {
        nombre: flujo.nombre,
        descripcion: flujo.descripcion,
        tipo: flujo.tipo,
        tareas: flujo.tareas,
        configuracion: flujo.configuracion,
        etiquetas: flujo.tags,
      },
      metadata: {
        exportadoPor: 'Sistema',
        fechaExportacion: new Date().toISOString(),
        version: flujo.version,
      },
    };
  }

  @Post(':id/activar')
  @ApiOperation({ 
    summary: 'Activar flujo de trabajo',
    description: 'Activa un flujo de trabajo para que pueda ser ejecutado'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flujo activado exitosamente',
  })
  @HttpCode(HttpStatus.OK)
  @Permissions('workflows:activate')
  async activar(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    const cambiarEstadoDto: CambiarEstadoFlujoDto = {
      estado: EstadoFlujoTrabajo.ACTIVO,
      motivo: 'Flujo activado manualmente',
    };

    return await this.flujosTrabajoService.cambiarEstado(
      id,
      cambiarEstadoDto,
      req.user.id,
      empresaId,
    );
  }

  @Post(':id/pausar')
  @ApiOperation({ 
    summary: 'Pausar flujo de trabajo',
    description: 'Pausa temporalmente un flujo de trabajo activo'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Flujo pausado exitosamente',
  })
  @HttpCode(HttpStatus.OK)
  @Permissions('workflows:pause')
  async pausar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo?: string },
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    const cambiarEstadoDto: CambiarEstadoFlujoDto = {
      estado: EstadoFlujoTrabajo.PAUSADO,
      motivo: body.motivo || 'Flujo pausado manualmente',
    };

    return await this.flujosTrabajoService.cambiarEstado(
      id,
      cambiarEstadoDto,
      req.user.id,
      empresaId,
    );
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar flujo de trabajo',
    description: 'Elimina un flujo de trabajo del sistema (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del flujo de trabajo',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Flujo eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No se puede eliminar el flujo con ejecuciones activas',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('workflows:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @TenantId() empresaId: string,
  ) {
    await this.flujosTrabajoService.remove(id, req.user.id, empresaId);
  }

  // Métodos utilitarios privados
  private getDescripcionTipo(tipo: TipoFlujoTrabajo): string {
    const descripciones: Record<TipoFlujoTrabajo, string> = {
      [TipoFlujoTrabajo.PROCESO_LEGAL]: 'Procesos y procedimientos legales',
      [TipoFlujoTrabajo.APROBACION_DOCUMENTO]: 'Aprobación y revisión de documentos',
      [TipoFlujoTrabajo.REVISION_CASO]: 'Revisión y seguimiento de casos',
      [TipoFlujoTrabajo.AUTORIZACION_GASTO]: 'Autorización y aprobación de gastos',
      [TipoFlujoTrabajo.VALIDACION_FACTURA]: 'Validación y procesamiento de facturas',
      [TipoFlujoTrabajo.ONBOARDING_CLIENTE]: 'Incorporación de nuevos clientes',
      [TipoFlujoTrabajo.SEGUIMIENTO_PROYECTO]: 'Seguimiento y control de proyectos',
      [TipoFlujoTrabajo.PROCESO_DISCIPLINARIO]: 'Procesos disciplinarios internos',
      [TipoFlujoTrabajo.AUDITORIA_INTERNA]: 'Auditorías y revisiones internas',
      [TipoFlujoTrabajo.PERSONALIZADO]: 'Flujos personalizados definidos por el usuario',
    };

    return descripciones[tipo] || 'Tipo de flujo no definido';
  }

  private getCategoriaTipo(tipo: TipoFlujoTrabajo): string {
    const categorias: Record<TipoFlujoTrabajo, string> = {
      [TipoFlujoTrabajo.PROCESO_LEGAL]: 'Legal',
      [TipoFlujoTrabajo.APROBACION_DOCUMENTO]: 'Documentos',
      [TipoFlujoTrabajo.REVISION_CASO]: 'Casos',
      [TipoFlujoTrabajo.AUTORIZACION_GASTO]: 'Finanzas',
      [TipoFlujoTrabajo.VALIDACION_FACTURA]: 'Finanzas',
      [TipoFlujoTrabajo.ONBOARDING_CLIENTE]: 'Clientes',
      [TipoFlujoTrabajo.SEGUIMIENTO_PROYECTO]: 'Proyectos',
      [TipoFlujoTrabajo.PROCESO_DISCIPLINARIO]: 'Recursos Humanos',
      [TipoFlujoTrabajo.AUDITORIA_INTERNA]: 'Cumplimiento',
      [TipoFlujoTrabajo.PERSONALIZADO]: 'General',
    };

    return categorias[tipo] || 'General';
  }
}
