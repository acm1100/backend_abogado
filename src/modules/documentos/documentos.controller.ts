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
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { FilterDocumentosDto } from './dto/filter-documentos.dto';

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('crear_documentos')
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir nuevo documento',
    description: 'Permite subir un nuevo documento con archivo adjunto',
  })
  @ApiBody({
    description: 'Datos del documento y archivo',
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir',
        },
        datos: {
          type: 'string',
          description: 'JSON con los datos del documento (CreateDocumentoDto)',
        },
      },
      required: ['archivo', 'datos'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento subido exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o archivo no permitido',
  })
  @ApiResponse({
    status: 413,
    description: 'Archivo demasiado grande',
  })
  async create(
    @UploadedFile() archivo: Express.Multer.File,
    @Body('datos') datos: string,
    @Request() req,
  ) {
    let createDocumentoDto: CreateDocumentoDto;
    
    try {
      createDocumentoDto = JSON.parse(datos);
    } catch (error) {
      throw new Error('Formato JSON inválido en datos');
    }

    return this.documentosService.create(
      createDocumentoDto,
      req.user.empresaId,
      req.user.userId,
      archivo,
    );
  }

  @Get()
  @Permissions('ver_documentos')
  @ApiOperation({
    summary: 'Listar documentos',
    description: 'Obtiene una lista paginada de documentos con filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos obtenida exitosamente',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    description: 'Buscar por nombre, descripción o contenido',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar por tipo de documento',
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    description: 'Filtrar por categoría',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado del documento',
  })
  @ApiQuery({
    name: 'casoId',
    required: false,
    description: 'Filtrar por caso',
  })
  @ApiQuery({
    name: 'clienteId',
    required: false,
    description: 'Filtrar por cliente',
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
  async findAll(@Query() filters: FilterDocumentosDto, @Request() req) {
    return this.documentosService.findAll(
      filters,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get('estadisticas')
  @Permissions('ver_reportes_documentos')
  @ApiOperation({
    summary: 'Obtener estadísticas de documentos',
    description: 'Proporciona métricas y estadísticas sobre los documentos',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getEstadisticas(@Request() req) {
    return this.documentosService.getEstadisticas(req.user.empresaId);
  }

  @Get('buscar-contenido')
  @Permissions('ver_documentos')
  @ApiOperation({
    summary: 'Buscar documentos por contenido',
    description: 'Realiza búsqueda de texto completo en el contenido de los documentos',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Texto a buscar en el contenido',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda obtenidos exitosamente',
  })
  async searchContent(
    @Query('q') query: string,
    @Query() filters: FilterDocumentosDto,
    @Request() req,
  ) {
    return this.documentosService.searchContent(
      query,
      req.user.empresaId,
      filters,
    );
  }

  @Get('caso/:casoId')
  @Permissions('ver_documentos')
  @ApiOperation({
    summary: 'Listar documentos por caso',
    description: 'Obtiene todos los documentos asociados a un caso específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentos del caso obtenidos exitosamente',
  })
  async findByCaso(
    @Param('casoId', ParseUUIDPipe) casoId: string,
    @Request() req,
  ) {
    const filters: FilterDocumentosDto = { casoId };
    return this.documentosService.findAll(
      filters,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get('cliente/:clienteId')
  @Permissions('ver_documentos')
  @ApiOperation({
    summary: 'Listar documentos por cliente',
    description: 'Obtiene todos los documentos asociados a un cliente específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentos del cliente obtenidos exitosamente',
  })
  async findByCliente(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Request() req,
  ) {
    const filters: FilterDocumentosDto = { clienteId };
    return this.documentosService.findAll(
      filters,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Get(':id')
  @Permissions('ver_documentos')
  @ApiOperation({
    summary: 'Obtener documento por ID',
    description: 'Recupera un documento específico con todos sus detalles',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento encontrado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento no encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.documentosService.findOne(id, req.user.empresaId);
  }

  @Get(':id/descargar')
  @Permissions('descargar_documentos')
  @ApiOperation({
    summary: 'Descargar documento',
    description: 'Descarga el archivo físico del documento',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo descargado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento o archivo no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para descargar este documento',
  })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, nombreArchivo, tipoMime } = await this.documentosService.download(
      id,
      req.user.empresaId,
      req.user.userId,
    );

    res.set({
      'Content-Type': tipoMime,
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post(':id/version')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('crear_documentos')
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear nueva versión de documento',
    description: 'Crea una nueva versión de un documento existente',
  })
  @ApiResponse({
    status: 201,
    description: 'Nueva versión creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'El documento no permite versionado',
  })
  async createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() archivo: Express.Multer.File,
    @Body('datos') datos: string,
    @Request() req,
  ) {
    let updateData;
    
    try {
      updateData = JSON.parse(datos || '{}');
    } catch (error) {
      throw new Error('Formato JSON inválido en datos');
    }

    return this.documentosService.createVersion(
      id,
      updateData,
      req.user.empresaId,
      req.user.userId,
      archivo,
    );
  }

  @Patch(':id')
  @Permissions('editar_documentos')
  @ApiOperation({
    summary: 'Actualizar documento',
    description: 'Modifica los metadatos de un documento existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Documento actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para editar este documento',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentoDto: UpdateDocumentoDto,
    @Request() req,
  ) {
    return this.documentosService.update(
      id,
      updateDocumentoDto,
      req.user.empresaId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('eliminar_documentos')
  @ApiOperation({
    summary: 'Eliminar documento',
    description: 'Desactiva un documento (eliminación lógica)',
  })
  @ApiResponse({
    status: 204,
    description: 'Documento desactivado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento no encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.documentosService.remove(id, req.user.empresaId);
  }
}
