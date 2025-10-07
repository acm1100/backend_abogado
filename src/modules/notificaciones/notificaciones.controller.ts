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
  HttpCode
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { NotificacionesService, FiltrosNotificaciones } from './notificaciones.service';
import { CreateNotificacionDto, TipoNotificacion, PrioridadNotificacion, CategoriaNotificacion } from './dto/create-notificacion.dto';
import { 
  UpdateNotificacionDto, 
  EstadoNotificacion, 
  MarcarLeidaDto,
  ProgramarEnvioDto,
  CancelarNotificacionDto
} from './dto/update-notificacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva notificación' })
  @ApiResponse({
    status: 201,
    description: 'Notificación creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @Permissions('notificaciones:crear')
  async create(
    @Body() createNotificacionDto: CreateNotificacionDto,
    @Request() req: any
  ) {
    return this.notificacionesService.create(
      createNotificacionDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de notificaciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones obtenida exitosamente',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de elementos por página' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoNotificacion, isArray: true, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoNotificacion, isArray: true, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'prioridad', required: false, enum: PrioridadNotificacion, isArray: true, description: 'Filtrar por prioridad' })
  @ApiQuery({ name: 'categoria', required: false, enum: CategoriaNotificacion, isArray: true, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'fechaDesde', required: false, type: String, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaHasta', required: false, type: String, description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiQuery({ name: 'usuarioId', required: false, type: String, description: 'Filtrar por usuario destinatario' })
  @ApiQuery({ name: 'casoId', required: false, type: String, description: 'Filtrar por caso relacionado' })
  @ApiQuery({ name: 'proyectoId', required: false, type: String, description: 'Filtrar por proyecto relacionado' })
  @ApiQuery({ name: 'clienteId', required: false, type: String, description: 'Filtrar por cliente relacionado' })
  @ApiQuery({ name: 'soloNoLeidas', required: false, type: Boolean, description: 'Solo notificaciones no leídas' })
  @ApiQuery({ name: 'soloExpiran', required: false, type: Boolean, description: 'Solo notificaciones que expiran' })
  @Permissions('notificaciones:leer')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('estado') estado?: EstadoNotificacion[],
    @Query('tipo') tipo?: TipoNotificacion[],
    @Query('prioridad') prioridad?: PrioridadNotificacion[],
    @Query('categoria') categoria?: CategoriaNotificacion[],
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('casoId') casoId?: string,
    @Query('proyectoId') proyectoId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('soloNoLeidas') soloNoLeidas?: boolean,
    @Query('soloExpiran') soloExpiran?: boolean,
    @Request() req: any
  ) {
    const filtros: FiltrosNotificaciones = {
      estado: Array.isArray(estado) ? estado : estado ? [estado] : undefined,
      tipo: Array.isArray(tipo) ? tipo : tipo ? [tipo] : undefined,
      prioridad: Array.isArray(prioridad) ? prioridad : prioridad ? [prioridad] : undefined,
      categoria: Array.isArray(categoria) ? categoria : categoria ? [categoria] : undefined,
      fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
      usuarioId,
      casoId,
      proyectoId,
      clienteId,
      soloNoLeidas,
      soloExpiran
    };

    return this.notificacionesService.findAll(
      req.user.empresaId,
      filtros,
      page,
      limit
    );
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de notificaciones' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @ApiQuery({ name: 'fechaDesde', required: false, type: String, description: 'Fecha desde para estadísticas' })
  @ApiQuery({ name: 'fechaHasta', required: false, type: String, description: 'Fecha hasta para estadísticas' })
  @Permissions('notificaciones:estadisticas')
  async obtenerEstadisticas(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Request() req: any
  ) {
    return this.notificacionesService.obtenerEstadisticas(
      req.user.empresaId,
      fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta ? new Date(fechaHasta) : undefined
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener notificación por ID' })
  @ApiResponse({
    status: 200,
    description: 'Notificación encontrada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @Permissions('notificaciones:leer')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.notificacionesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar notificación' })
  @ApiResponse({
    status: 200,
    description: 'Notificación actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @Permissions('notificaciones:actualizar')
  async update(
    @Param('id') id: string,
    @Body() updateNotificacionDto: UpdateNotificacionDto,
    @Request() req: any
  ) {
    return this.notificacionesService.update(id, updateNotificacionDto, req.user.empresaId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar notificación' })
  @ApiResponse({
    status: 204,
    description: 'Notificación eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @Permissions('notificaciones:eliminar')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.notificacionesService.remove(id, req.user.empresaId);
  }

  @Patch(':id/marcar-leida')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @Permissions('notificaciones:leer')
  async marcarComoLeida(
    @Param('id') id: string,
    @Body() marcarLeidaDto: MarcarLeidaDto,
    @Request() req: any
  ) {
    return this.notificacionesService.marcarComoLeida(id, req.user.sub, marcarLeidaDto);
  }

  @Post(':id/programar')
  @ApiOperation({ summary: 'Programar envío de notificación' })
  @ApiResponse({
    status: 200,
    description: 'Envío programado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @Permissions('notificaciones:programar')
  async programarEnvio(
    @Param('id') id: string,
    @Body() programarDto: ProgramarEnvioDto,
    @Request() req: any
  ) {
    return this.notificacionesService.programarEnvio(id, programarDto);
  }

  @Post(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar notificación' })
  @ApiResponse({
    status: 200,
    description: 'Notificación cancelada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @Permissions('notificaciones:cancelar')
  async cancelar(
    @Param('id') id: string,
    @Body() cancelarDto: CancelarNotificacionDto,
    @Request() req: any
  ) {
    return this.notificacionesService.cancelar(id, req.user.empresaId, cancelarDto);
  }

  @Post(':id/reenviar')
  @ApiOperation({ summary: 'Reenviar notificación' })
  @ApiResponse({
    status: 200,
    description: 'Notificación reenviada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @Permissions('notificaciones:reenviar')
  async reenviar(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.notificacionesService.reenviar(id, req.user.empresaId);
  }

  // Endpoints específicos para diferentes tipos de notificaciones

  @Post('vencimientos')
  @ApiOperation({ summary: 'Crear notificación de vencimiento' })
  @ApiResponse({
    status: 201,
    description: 'Notificación de vencimiento creada exitosamente',
  })
  @Permissions('notificaciones:crear')
  async crearNotificacionVencimiento(
    @Body() body: {
      casoId?: string;
      proyectoId?: string;
      fechaVencimiento: string;
      descripcion: string;
      usuariosIds: string[];
    },
    @Request() req: any
  ) {
    const createDto: CreateNotificacionDto = {
      titulo: 'Vencimiento Próximo',
      mensaje: `${body.descripcion}. Fecha de vencimiento: ${new Date(body.fechaVencimiento).toLocaleDateString()}`,
      tipo: TipoNotificacion.EMAIL,
      prioridad: PrioridadNotificacion.ALTA,
      categoria: CategoriaNotificacion.VENCIMIENTO,
      destinatarios: body.usuariosIds.map(usuarioId => ({ usuarioId })),
      casoId: body.casoId,
      proyectoId: body.proyectoId,
      fechaProgramada: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Un día antes
    };

    return this.notificacionesService.create(createDto, req.user.empresaId, req.user.sub);
  }

  @Post('recordatorios')
  @ApiOperation({ summary: 'Crear recordatorio' })
  @ApiResponse({
    status: 201,
    description: 'Recordatorio creado exitosamente',
  })
  @Permissions('notificaciones:crear')
  async crearRecordatorio(
    @Body() body: {
      titulo: string;
      mensaje: string;
      fechaRecordatorio: string;
      usuariosIds: string[];
      casoId?: string;
      proyectoId?: string;
    },
    @Request() req: any
  ) {
    const createDto: CreateNotificacionDto = {
      titulo: body.titulo,
      mensaje: body.mensaje,
      tipo: TipoNotificacion.SISTEMA,
      prioridad: PrioridadNotificacion.NORMAL,
      categoria: CategoriaNotificacion.RECORDATORIO,
      destinatarios: body.usuariosIds.map(usuarioId => ({ usuarioId })),
      casoId: body.casoId,
      proyectoId: body.proyectoId,
      fechaProgramada: body.fechaRecordatorio,
    };

    return this.notificacionesService.create(createDto, req.user.empresaId, req.user.sub);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Obtener notificaciones de un usuario específico' })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones del usuario obtenidas exitosamente',
  })
  @ApiParam({ name: 'usuarioId', description: 'ID del usuario' })
  @ApiQuery({ name: 'soloNoLeidas', required: false, type: Boolean, description: 'Solo no leídas' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados' })
  @Permissions('notificaciones:leer')
  async findByUsuario(
    @Param('usuarioId') usuarioId: string,
    @Query('soloNoLeidas') soloNoLeidas: boolean = false,
    @Query('limit') limit: number = 50,
    @Request() req: any
  ) {
    const filtros: FiltrosNotificaciones = {
      usuarioId,
      soloNoLeidas
    };

    return this.notificacionesService.findAll(
      req.user.empresaId,
      filtros,
      1,
      limit
    );
  }
}
