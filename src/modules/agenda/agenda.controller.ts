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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AgendaService } from './agenda.service';
import { CreateEventoDto, UpdateEventoDto, FiltrosAgendaDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Agenda')
@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @Permissions('agenda:crear')
  @ApiOperation({ 
    summary: 'Crear nuevo evento en la agenda',
    description: 'Crea un nuevo evento/cita en la agenda del bufete'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Evento creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acceso inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sin permisos para crear eventos',
  })
  async create(
    @Body() createEventoDto: CreateEventoDto,
    @Request() req: any,
  ) {
    const evento = await this.agendaService.create(
      createEventoDto,
      req.user.empresaId,
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Evento creado exitosamente',
      data: evento,
    };
  }

  @Get()
  @Permissions('agenda:leer')
  @ApiOperation({ 
    summary: 'Obtener eventos de la agenda',
    description: 'Lista todos los eventos de la agenda con filtros opcionales'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de eventos obtenida exitosamente',
  })
  @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha de inicio del filtro' })
  @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha de fin del filtro' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de evento' })
  @ApiQuery({ name: 'estado', required: false, description: 'Estado del evento' })
  @ApiQuery({ name: 'responsableId', required: false, description: 'ID del responsable' })
  @ApiQuery({ name: 'casoId', required: false, description: 'ID del caso' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'ID del cliente' })
  async findAll(
    @Query() filtros: FiltrosAgendaDto,
    @Request() req: any,
  ) {
    const eventos = await this.agendaService.findAll(
      filtros,
      req.user.empresaId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Eventos obtenidos exitosamente',
      data: eventos,
      total: eventos.length,
    };
  }

  @Get('dia/:fecha')
  @Permissions('agenda:leer')
  @ApiOperation({ 
    summary: 'Obtener eventos de un día específico',
    description: 'Lista todos los eventos programados para una fecha específica'
  })
  @ApiParam({ name: 'fecha', description: 'Fecha en formato YYYY-MM-DD' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eventos del día obtenidos exitosamente',
  })
  async obtenerEventosDelDia(
    @Param('fecha') fecha: string,
    @Request() req: any,
  ) {
    const fechaObj = new Date(fecha);
    const eventos = await this.agendaService.obtenerEventosDelDia(
      fechaObj,
      req.user.empresaId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Eventos del día obtenidos exitosamente',
      data: eventos,
      fecha: fecha,
      total: eventos.length,
    };
  }

  @Get('proximos')
  @Permissions('agenda:leer')
  @ApiOperation({ 
    summary: 'Obtener eventos próximos',
    description: 'Lista los eventos programados para los próximos días'
  })
  @ApiQuery({ name: 'dias', required: false, description: 'Número de días hacia adelante (default: 7)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eventos próximos obtenidos exitosamente',
  })
  async obtenerEventosProximos(
    @Query('dias') dias: string = '7',
    @Request() req: any,
  ) {
    const numeroDias = parseInt(dias, 10) || 7;
    const eventos = await this.agendaService.obtenerEventosProximos(
      req.user.empresaId,
      numeroDias,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Eventos próximos obtenidos exitosamente',
      data: eventos,
      diasConsultados: numeroDias,
      total: eventos.length,
    };
  }

  @Get('usuario/:usuarioId')
  @Permissions('agenda:leer')
  @ApiOperation({ 
    summary: 'Obtener eventos de un usuario específico',
    description: 'Lista todos los eventos asignados a un usuario específico'
  })
  @ApiParam({ name: 'usuarioId', description: 'ID del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eventos del usuario obtenidos exitosamente',
  })
  async obtenerEventosPorUsuario(
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @Request() req: any,
  ) {
    const eventos = await this.agendaService.obtenerEventosPorUsuario(
      usuarioId,
      req.user.empresaId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Eventos del usuario obtenidos exitosamente',
      data: eventos,
      usuarioId,
      total: eventos.length,
    };
  }

  @Get('resumen-semanal')
  @Permissions('agenda:leer')
  @ApiOperation({ 
    summary: 'Obtener resumen semanal de la agenda',
    description: 'Proporciona estadísticas y resumen de los eventos de la semana'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen semanal obtenido exitosamente',
  })
  async obtenerResumenSemanal(@Request() req: any) {
    const resumen = await this.agendaService.obtenerResumenSemanal(
      req.user.empresaId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Resumen semanal obtenido exitosamente',
      data: resumen,
    };
  }

  @Get(':id')
  @Permissions('agenda:leer')
  @ApiOperation({ 
    summary: 'Obtener evento por ID',
    description: 'Obtiene los detalles completos de un evento específico'
  })
  @ApiParam({ name: 'id', description: 'ID del evento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento obtenido exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evento no encontrado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const evento = await this.agendaService.findOne(id, req.user.empresaId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Evento obtenido exitosamente',
      data: evento,
    };
  }

  @Patch(':id')
  @Permissions('agenda:actualizar')
  @ApiOperation({ 
    summary: 'Actualizar evento',
    description: 'Actualiza los datos de un evento existente'
  })
  @ApiParam({ name: 'id', description: 'ID del evento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento actualizado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evento no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventoDto: UpdateEventoDto,
    @Request() req: any,
  ) {
    const evento = await this.agendaService.update(
      id,
      updateEventoDto,
      req.user.empresaId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Evento actualizado exitosamente',
      data: evento,
    };
  }

  @Patch(':id/completar')
  @Permissions('agenda:actualizar')
  @ApiOperation({ 
    summary: 'Marcar evento como completado',
    description: 'Cambia el estado del evento a completado y registra la fecha de finalización'
  })
  @ApiParam({ name: 'id', description: 'ID del evento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento marcado como completado exitosamente',
  })
  async marcarComoCompletado(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const evento = await this.agendaService.marcarComoCompletado(
      id,
      req.user.empresaId,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Evento marcado como completado exitosamente',
      data: evento,
    };
  }

  @Patch(':id/reagendar')
  @Permissions('agenda:actualizar')
  @ApiOperation({ 
    summary: 'Reagendar evento',
    description: 'Cambia la fecha y hora de un evento manteniendo la duración'
  })
  @ApiParam({ name: 'id', description: 'ID del evento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento reagendado exitosamente',
  })
  async reagendarEvento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { nuevaFecha: string; motivo?: string },
    @Request() req: any,
  ) {
    const evento = await this.agendaService.reagendarEvento(
      id,
      new Date(body.nuevaFecha),
      req.user.empresaId,
      body.motivo,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Evento reagendado exitosamente',
      data: evento,
    };
  }

  @Delete(':id')
  @Permissions('agenda:eliminar')
  @ApiOperation({ 
    summary: 'Eliminar evento',
    description: 'Elimina (desactiva) un evento de la agenda'
  })
  @ApiParam({ name: 'id', description: 'ID del evento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evento eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evento no encontrado',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    await this.agendaService.remove(id, req.user.empresaId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Evento eliminado exitosamente',
    };
  }
}
