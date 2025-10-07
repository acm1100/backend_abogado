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
import { PlantillasService, FiltrosPlantillas } from './plantillas.service';
import { 
  CreatePlantillaDto, 
  TipoPlantilla, 
  FormatoPlantilla, 
  EstadoPlantilla,
  CategoriaPlantilla 
} from './dto/create-plantilla.dto';
import { 
  UpdatePlantillaDto,
  GenerarDocumentoDto,
  ValidarPlantillaDto,
  ClonarPlantillaDto,
  VersionarPlantillaDto
} from './dto/update-plantilla.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Plantillas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plantillas')
export class PlantillasController {
  constructor(private readonly plantillasService: PlantillasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva plantilla' })
  @ApiResponse({
    status: 201,
    description: 'Plantilla creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @Permissions('plantillas:crear')
  async create(
    @Body() createPlantillaDto: CreatePlantillaDto,
    @Request() req: any
  ) {
    return this.plantillasService.create(
      createPlantillaDto,
      req.user.empresaId,
      req.user.sub
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de plantillas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de plantillas obtenida exitosamente',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de elementos por página' })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPlantilla, isArray: true, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'formato', required: false, enum: FormatoPlantilla, isArray: true, description: 'Filtrar por formato' })
  @ApiQuery({ name: 'categoria', required: false, enum: CategoriaPlantilla, isArray: true, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoPlantilla, isArray: true, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'etiquetas', required: false, type: [String], description: 'Filtrar por etiquetas' })
  @ApiQuery({ name: 'soloPublicas', required: false, type: Boolean, description: 'Solo plantillas públicas' })
  @ApiQuery({ name: 'soloPropias', required: false, type: Boolean, description: 'Solo plantillas propias' })
  @ApiQuery({ name: 'buscar', required: false, type: String, description: 'Búsqueda en nombre y descripción' })
  @Permissions('plantillas:leer')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('tipo') tipo?: TipoPlantilla[],
    @Query('formato') formato?: FormatoPlantilla[],
    @Query('categoria') categoria?: CategoriaPlantilla[],
    @Query('estado') estado?: EstadoPlantilla[],
    @Query('etiquetas') etiquetas?: string[],
    @Query('soloPublicas') soloPublicas?: boolean,
    @Query('soloPropias') soloPropias?: boolean,
    @Query('buscar') buscar?: string,
    @Request() req?: any
  ) {
    const filtros: FiltrosPlantillas = {
      tipo: Array.isArray(tipo) ? tipo : tipo ? [tipo] : undefined,
      formato: Array.isArray(formato) ? formato : formato ? [formato] : undefined,
      categoria: Array.isArray(categoria) ? categoria : categoria ? [categoria] : undefined,
      estado: Array.isArray(estado) ? estado : estado ? [estado] : undefined,
      etiquetas: Array.isArray(etiquetas) ? etiquetas : etiquetas ? [etiquetas] : undefined,
      soloPublicas,
      soloPropias,
      buscar,
      creadoPorId: soloPropias ? req.user.sub : undefined
    };

    return this.plantillasService.findAll(
      req.user.empresaId,
      filtros,
      page,
      limit
    );
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de plantillas' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @Permissions('plantillas:estadisticas')
  async obtenerEstadisticas(@Request() req: any) {
    return this.plantillasService.obtenerEstadisticas(req.user.empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  @ApiResponse({
    status: 200,
    description: 'Plantilla encontrada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Permissions('plantillas:leer')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.plantillasService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar plantilla' })
  @ApiResponse({
    status: 200,
    description: 'Plantilla actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Permissions('plantillas:actualizar')
  async update(
    @Param('id') id: string,
    @Body() updatePlantillaDto: UpdatePlantillaDto,
    @Request() req: any
  ) {
    return this.plantillasService.update(id, updatePlantillaDto, req.user.empresaId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar plantilla' })
  @ApiResponse({
    status: 204,
    description: 'Plantilla eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Permissions('plantillas:eliminar')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.plantillasService.remove(id, req.user.empresaId);
  }

  @Post(':id/generar')
  @ApiOperation({ summary: 'Generar documento a partir de plantilla' })
  @ApiResponse({
    status: 200,
    description: 'Documento generado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Permissions('plantillas:usar')
  async generarDocumento(
    @Param('id') id: string,
    @Body() generarDto: GenerarDocumentoDto,
    @Request() req: any
  ) {
    return this.plantillasService.generarDocumento(id, generarDto, req.user.empresaId);
  }

  @Post(':id/generar/descargar')
  @ApiOperation({ summary: 'Generar y descargar documento' })
  @ApiResponse({
    status: 200,
    description: 'Documento descargado exitosamente',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Permissions('plantillas:usar')
  async generarYDescargar(
    @Param('id') id: string,
    @Body() generarDto: GenerarDocumentoDto,
    @Request() req: any,
    @Res() res: Response
  ) {
    const documento = await this.plantillasService.generarDocumento(id, generarDto, req.user.empresaId);

    // Configurar headers para descarga
    const extension = this.getExtensionPorFormato(documento.formato);
    const filename = `${documento.nombre}.${extension}`;
    
    res.set({
      'Content-Type': this.getContentTypePorFormato(documento.formato),
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return res.send(documento.contenido);
  }

  @Post(':id/validar')
  @ApiOperation({ summary: 'Validar plantilla' })
  @ApiResponse({
    status: 200,
    description: 'Validación completada',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Permissions('plantillas:validar')
  async validar(
    @Param('id') id: string,
    @Body() validarDto: ValidarPlantillaDto,
    @Request() req: any
  ) {
    return this.plantillasService.validar(id, validarDto, req.user.empresaId);
  }

  @Post(':id/clonar')
  @ApiOperation({ summary: 'Clonar plantilla' })
  @ApiResponse({
    status: 201,
    description: 'Plantilla clonada exitosamente',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla a clonar' })
  @Permissions('plantillas:crear')
  async clonar(
    @Param('id') id: string,
    @Body() clonarDto: ClonarPlantillaDto,
    @Request() req: any
  ) {
    return this.plantillasService.clonar(id, clonarDto, req.user.empresaId, req.user.sub);
  }

  @Post(':id/version')
  @ApiOperation({ summary: 'Crear nueva versión de plantilla' })
  @ApiResponse({
    status: 200,
    description: 'Nueva versión creada exitosamente',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Permissions('plantillas:versionar')
  async crearVersion(
    @Param('id') id: string,
    @Body() versionarDto: VersionarPlantillaDto,
    @Request() req: any
  ) {
    return this.plantillasService.crearVersion(id, versionarDto, req.user.empresaId);
  }

  // Endpoints específicos por tipo de plantilla

  @Get('tipos/contratos')
  @ApiOperation({ summary: 'Obtener plantillas de contratos' })
  @ApiResponse({
    status: 200,
    description: 'Plantillas de contratos obtenidas exitosamente',
  })
  @Permissions('plantillas:leer')
  async obtenerContratos(@Request() req: any) {
    const filtros: FiltrosPlantillas = {
      tipo: [TipoPlantilla.CONTRATO],
      estado: [EstadoPlantilla.ACTIVA]
    };

    const result = await this.plantillasService.findAll(req.user.empresaId, filtros, 1, 100);
    return result.data;
  }

  @Get('tipos/judiciales')
  @ApiOperation({ summary: 'Obtener plantillas judiciales' })
  @ApiResponse({
    status: 200,
    description: 'Plantillas judiciales obtenidas exitosamente',
  })
  @Permissions('plantillas:leer')
  async obtenerJudiciales(@Request() req: any) {
    const filtros: FiltrosPlantillas = {
      tipo: [
        TipoPlantilla.ESCRITOS_JUDICIALES,
        TipoPlantilla.DEMANDA,
        TipoPlantilla.CONTESTACION,
        TipoPlantilla.RECURSO,
        TipoPlantilla.ALEGATOS
      ],
      estado: [EstadoPlantilla.ACTIVA]
    };

    const result = await this.plantillasService.findAll(req.user.empresaId, filtros, 1, 100);
    return result.data;
  }

  @Get('categoria/:categoria')
  @ApiOperation({ summary: 'Obtener plantillas por categoría legal' })
  @ApiResponse({
    status: 200,
    description: 'Plantillas por categoría obtenidas exitosamente',
  })
  @ApiParam({ name: 'categoria', enum: CategoriaPlantilla, description: 'Categoría legal' })
  @Permissions('plantillas:leer')
  async obtenerPorCategoria(
    @Param('categoria') categoria: CategoriaPlantilla,
    @Request() req: any
  ) {
    const filtros: FiltrosPlantillas = {
      categoria: [categoria],
      estado: [EstadoPlantilla.ACTIVA]
    };

    const result = await this.plantillasService.findAll(req.user.empresaId, filtros, 1, 100);
    return result.data;
  }

  @Get('publicas/disponibles')
  @ApiOperation({ summary: 'Obtener plantillas públicas disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Plantillas públicas obtenidas exitosamente',
  })
  @Permissions('plantillas:leer')
  async obtenerPublicas(@Request() req: any) {
    const filtros: FiltrosPlantillas = {
      soloPublicas: true,
      estado: [EstadoPlantilla.ACTIVA]
    };

    const result = await this.plantillasService.findAll(req.user.empresaId, filtros, 1, 100);
    return result.data;
  }

  @Get('usuario/mis-plantillas')
  @ApiOperation({ summary: 'Obtener plantillas del usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Plantillas del usuario obtenidas exitosamente',
  })
  @Permissions('plantillas:leer')
  async obtenerMisPlantillas(@Request() req: any) {
    const filtros: FiltrosPlantillas = {
      soloPropias: true,
      creadoPorId: req.user.sub
    };

    return this.plantillasService.findAll(req.user.empresaId, filtros, 1, 100);
  }

  // Métodos auxiliares privados

  private getExtensionPorFormato(formato: string): string {
    const extensiones = {
      [FormatoPlantilla.DOCX]: 'docx',
      [FormatoPlantilla.PDF]: 'pdf',
      [FormatoPlantilla.HTML]: 'html',
      [FormatoPlantilla.TXT]: 'txt',
      [FormatoPlantilla.ODT]: 'odt',
      [FormatoPlantilla.RTF]: 'rtf'
    };

    return extensiones[formato] || 'txt';
  }

  private getContentTypePorFormato(formato: string): string {
    const contentTypes = {
      [FormatoPlantilla.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      [FormatoPlantilla.PDF]: 'application/pdf',
      [FormatoPlantilla.HTML]: 'text/html',
      [FormatoPlantilla.TXT]: 'text/plain',
      [FormatoPlantilla.ODT]: 'application/vnd.oasis.opendocument.text',
      [FormatoPlantilla.RTF]: 'application/rtf'
    };

    return contentTypes[formato] || 'text/plain';
  }
}
