import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindManyOptions,
  Like,
  Between,
  In,
  SelectQueryBuilder,
  Not,
} from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { 
  Documentacion, 
  EstadoDocumento, 
  TipoDocumento 
} from '../../entities/documentacion.entity';
import { Caso } from '../../entities/caso.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { FilterDocumentosDto } from './dto/filter-documentos.dto';

@Injectable()
export class DocumentosService {
  private readonly uploadPath = process.env.UPLOAD_PATH || './uploads/documentos';
  private readonly maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
  ];

  constructor(
    @InjectRepository(Documentacion)
    private documentosRepository: Repository<Documentacion>,
    @InjectRepository(Caso)
    private casosRepository: Repository<Caso>,
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
    @InjectRepository(Proyecto)
    private proyectosRepository: Repository<Proyecto>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  /**
   * Crear un nuevo documento
   */
  async create(
    createDocumentoDto: CreateDocumentoDto,
    empresaId: string,
    usuarioCreadorId: string,
    archivo?: Express.Multer.File,
  ): Promise<Documentacion> {
    // Validar tamaño del archivo
    if (createDocumentoDto.tamano > this.maxFileSize) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido (${this.maxFileSize / 1024 / 1024}MB)`,
      );
    }

    // Validar tipo MIME
    if (!this.allowedMimeTypes.includes(createDocumentoDto.tipoMime)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    // Validar asociaciones si se proporcionan
    await this.validateAssociations(createDocumentoDto, empresaId);

    // Generar código interno del documento
    const codigoInterno = await this.generateCodigoInterno(empresaId);

    // Crear estructura de directorios si no existe
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(this.uploadPath, String(year), month);
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      throw new InternalServerErrorException('Error al crear directorio de archivos');
    }

    // Validar o generar hash del archivo
    let hash = createDocumentoDto.hash;
    if (archivo) {
      hash = this.generateFileHash(archivo.buffer);
      if (hash !== createDocumentoDto.hash) {
        throw new BadRequestException('Hash del archivo no coincide');
      }
    }

    // Verificar duplicados por hash
    const duplicado = await this.documentosRepository.findOne({
      where: { hash, empresaId, activo: true },
    });

    if (duplicado) {
      throw new ConflictException(
        'Ya existe un documento con el mismo contenido',
      );
    }

    // Generar ruta final del archivo
    const extension = path.extname(createDocumentoDto.nombreArchivo);
    const nombreUnico = `${codigoInterno}${extension}`;
    const rutaFinal = path.join(uploadDir, nombreUnico);

    // Guardar archivo físico si se proporciona
    if (archivo) {
      try {
        await fs.writeFile(rutaFinal, archivo.buffer);
      } catch (error) {
        throw new InternalServerErrorException('Error al guardar el archivo');
      }
    }

    // Crear el documento
    const documento = this.documentosRepository.create({
      ...createDocumentoDto,
      empresaId,
      codigoInterno,
      usuarioCreadorId,
      hash,
      rutaArchivo: rutaFinal,
      estado: createDocumentoDto.estado || EstadoDocumento.BORRADOR,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      version: 1,
      configuracion: {
        requiereFirma: false,
        esPlantilla: false,
        permiteVersionado: true,
        retencionDias: 0,
        requiereAprobacion: false,
        acceso: {
          publico: false,
          equipoAsignado: [usuarioCreadorId],
          rolesPermitidos: [],
          clientesPermitidos: [],
        },
        ...createDocumentoDto.configuracion,
      },
      metadatos: {
        idioma: 'es',
        ...createDocumentoDto.metadatos,
      },
    });

    const documentoGuardado = await this.documentosRepository.save(documento);

    // Retornar el documento con relaciones
    return this.findOne(documentoGuardado.id, empresaId);
  }

  /**
   * Buscar documentos con filtros y paginación
   */
  async findAll(
    filters: FilterDocumentosDto,
    empresaId: string,
    usuarioId?: string,
  ): Promise<{
    documentos: Documentacion[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  }> {
    const queryBuilder = this.documentosRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.caso', 'caso')
      .leftJoinAndSelect('doc.cliente', 'cliente')
      .leftJoinAndSelect('doc.proyecto', 'proyecto')
      .leftJoinAndSelect('doc.usuarioCreador', 'usuarioCreador')
      .where('doc.empresaId = :empresaId', { empresaId });

    // Filtros de búsqueda
    this.applyFilters(queryBuilder, filters, usuarioId);

    // Ordenamiento
    const orderField = this.getOrderField(filters.ordenarPor);
    queryBuilder.orderBy(orderField, filters.direccion || 'DESC');

    // Paginación
    const pagina = filters.pagina || 1;
    const limite = Math.min(filters.limite || 20, 100);
    const offset = (pagina - 1) * limite;

    queryBuilder.skip(offset).take(limite);

    const [documentos, total] = await queryBuilder.getManyAndCount();

    return {
      documentos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Buscar documento por ID
   */
  async findOne(id: string, empresaId: string): Promise<Documentacion> {
    const documento = await this.documentosRepository.findOne({
      where: { id, empresaId },
      relations: [
        'caso',
        'cliente',
        'proyecto',
        'usuarioCreador',
        'versiones',
      ],
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Actualizar documento
   */
  async update(
    id: string,
    updateDocumentoDto: UpdateDocumentoDto,
    empresaId: string,
    usuarioId: string,
  ): Promise<Documentacion> {
    const documento = await this.findOne(id, empresaId);

    // Validar nuevas asociaciones si se proporcionan
    if (updateDocumentoDto.casoId || updateDocumentoDto.clienteId || updateDocumentoDto.proyectoId) {
      await this.validateAssociations(updateDocumentoDto, empresaId);
    }

    // Verificar permisos de edición
    if (!this.canEditDocument(documento, usuarioId)) {
      throw new ForbiddenException('Sin permisos para editar este documento');
    }

    // Registrar cambio de estado si aplica
    if (updateDocumentoDto.estado && updateDocumentoDto.estado !== documento.estado) {
      // Validar transición de estado
      this.validateStateTransition(documento.estado, updateDocumentoDto.estado);
      
      documento.fechaModificacion = new Date();
      
      // Si se está aprobando el documento
      if (updateDocumentoDto.estado === EstadoDocumento.PUBLICADO && updateDocumentoDto.aprobadoPor) {
        documento.aprobadoPor = updateDocumentoDto.aprobadoPor;
        documento.fechaAprobacion = new Date(updateDocumentoDto.fechaAprobacion || new Date());
      }
    }

    // Actualizar configuración
    if (updateDocumentoDto.configuracion) {
      documento.configuracion = {
        ...documento.configuracion,
        ...updateDocumentoDto.configuracion,
      };
    }

    // Actualizar metadatos
    if (updateDocumentoDto.metadatos) {
      documento.metadatos = {
        ...documento.metadatos,
        ...updateDocumentoDto.metadatos,
      };
    }

    Object.assign(documento, updateDocumentoDto);
    documento.fechaModificacion = new Date();

    const documentoActualizado = await this.documentosRepository.save(documento);
    return this.findOne(documentoActualizado.id, empresaId);
  }

  /**
   * Eliminar documento (soft delete)
   */
  async remove(id: string, empresaId: string): Promise<void> {
    const documento = await this.findOne(id, empresaId);

    documento.activo = false;
    documento.fechaModificacion = new Date();

    await this.documentosRepository.save(documento);
  }

  /**
   * Descargar documento
   */
  async download(id: string, empresaId: string, usuarioId: string): Promise<{
    buffer: Buffer;
    nombreArchivo: string;
    tipoMime: string;
  }> {
    const documento = await this.findOne(id, empresaId);

    // Verificar permisos de descarga
    if (!this.canAccessDocument(documento, usuarioId)) {
      throw new ForbiddenException('Sin permisos para acceder a este documento');
    }

    try {
      const buffer = await fs.readFile(documento.rutaArchivo);
      
      return {
        buffer,
        nombreArchivo: documento.nombreArchivo,
        tipoMime: documento.tipoMime,
      };
    } catch (error) {
      throw new NotFoundException('Archivo físico no encontrado');
    }
  }

  /**
   * Crear nueva versión de documento
   */
  async createVersion(
    documentoId: string,
    updateData: Partial<CreateDocumentoDto>,
    empresaId: string,
    usuarioId: string,
    archivo?: Express.Multer.File,
  ): Promise<Documentacion> {
    const documentoOriginal = await this.findOne(documentoId, empresaId);

    if (!documentoOriginal.configuracion?.permiteVersionado) {
      throw new BadRequestException('Este documento no permite versionado');
    }

    // Crear nueva versión basada en el original
    const nuevaVersion = {
      ...documentoOriginal,
      ...updateData,
      id: undefined,
      version: documentoOriginal.version + 1,
      documentoPadreId: documentoOriginal.id,
      estado: EstadoDocumento.BORRADOR,
    };

    return this.create(nuevaVersion, empresaId, usuarioId, archivo);
  }

  /**
   * Obtener estadísticas de documentos
   */
  async getEstadisticas(empresaId: string): Promise<{
    total: number;
    porTipo: Record<string, number>;
    porCategoria: Record<string, number>;
    porEstado: Record<string, number>;
    porMes: Record<string, number>;
    tamanoTotal: number;
    proximosVencer: number;
    sinFirmar: number;
    plantillas: number;
  }> {
    const documentos = await this.documentosRepository.find({
      where: { empresaId, activo: true },
    });

    const total = documentos.length;
    const porTipo = this.groupByField(documentos, 'tipo');
    const porCategoria = this.groupByField(documentos, 'categoria');
    const porEstado = this.groupByField(documentos, 'estado');
    
    const tamanoTotal = documentos.reduce((sum, doc) => sum + doc.tamano, 0);
    
    const hoy = new Date();
    const proximosMes = new Date();
    proximosMes.setMonth(proximosMes.getMonth() + 1);

    const proximosVencer = documentos.filter(
      doc =>
        doc.fechaVencimiento &&
        new Date(doc.fechaVencimiento) >= hoy &&
        new Date(doc.fechaVencimiento) <= proximosMes,
    ).length;

    const sinFirmar = documentos.filter(
      doc => doc.configuracion?.requiereFirma && !doc.firmado,
    ).length;

    const plantillas = documentos.filter(
      doc => doc.configuracion?.esPlantilla,
    ).length;

    // Agrupar por mes de creación
    const porMes = documentos.reduce((acc, doc) => {
      const mes = new Date(doc.fechaCreacion).toISOString().substr(0, 7);
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      porTipo,
      porCategoria,
      porEstado,
      porMes,
      tamanoTotal,
      proximosVencer,
      sinFirmar,
      plantillas,
    };
  }

  /**
   * Buscar documentos por contenido (texto completo)
   */
  async searchContent(
    query: string,
    empresaId: string,
    filters?: Partial<FilterDocumentosDto>,
  ): Promise<Documentacion[]> {
    const queryBuilder = this.documentosRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.caso', 'caso')
      .leftJoinAndSelect('doc.cliente', 'cliente')
      .where('doc.empresaId = :empresaId', { empresaId })
      .andWhere('doc.activo = true')
      .andWhere(
        '(doc.indiceContenido ILIKE :query OR doc.nombre ILIKE :query OR doc.descripcion ILIKE :query)',
        { query: `%${query}%` },
      );

    if (filters) {
      this.applyFilters(queryBuilder, filters);
    }

    return queryBuilder.getMany();
  }

  // Métodos privados

  private async validateAssociations(
    dto: Partial<CreateDocumentoDto>,
    empresaId: string,
  ): Promise<void> {
    if (dto.casoId) {
      const caso = await this.casosRepository.findOne({
        where: { id: dto.casoId, empresaId, activo: true },
      });
      if (!caso) {
        throw new NotFoundException('Caso no encontrado');
      }
    }

    if (dto.clienteId) {
      const cliente = await this.clientesRepository.findOne({
        where: { id: dto.clienteId, empresaId, activo: true },
      });
      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }
    }

    if (dto.proyectoId) {
      const proyecto = await this.proyectosRepository.findOne({
        where: { id: dto.proyectoId, empresaId, activo: true },
      });
      if (!proyecto) {
        throw new NotFoundException('Proyecto no encontrado');
      }
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Documentacion>,
    filters: FilterDocumentosDto,
    usuarioId?: string,
  ): void {
    if (filters.busqueda) {
      queryBuilder.andWhere(
        '(doc.nombre ILIKE :busqueda OR doc.descripcion ILIKE :busqueda OR doc.indiceContenido ILIKE :busqueda)',
        { busqueda: `%${filters.busqueda}%` },
      );
    }

    if (filters.tipo) {
      queryBuilder.andWhere('doc.tipo = :tipo', { tipo: filters.tipo });
    }

    if (filters.categoria) {
      queryBuilder.andWhere('doc.categoria = :categoria', {
        categoria: filters.categoria,
      });
    }

    if (filters.estado) {
      queryBuilder.andWhere('doc.estado = :estado', { estado: filters.estado });
    }

    if (filters.casoId) {
      queryBuilder.andWhere('doc.casoId = :casoId', { casoId: filters.casoId });
    }

    if (filters.clienteId) {
      queryBuilder.andWhere('doc.clienteId = :clienteId', {
        clienteId: filters.clienteId,
      });
    }

    if (filters.proyectoId) {
      queryBuilder.andWhere('doc.proyectoId = :proyectoId', {
        proyectoId: filters.proyectoId,
      });
    }

    if (filters.usuarioCreadorId) {
      queryBuilder.andWhere('doc.usuarioCreadorId = :usuarioCreadorId', {
        usuarioCreadorId: filters.usuarioCreadorId,
      });
    }

    if (filters.tipoMime) {
      queryBuilder.andWhere('doc.tipoMime = :tipoMime', {
        tipoMime: filters.tipoMime,
      });
    }

    if (filters.autor) {
      queryBuilder.andWhere("doc.metadatos->>'autor' ILIKE :autor", {
        autor: `%${filters.autor}%`,
      });
    }

    if (filters.fechaCreacionDesde) {
      queryBuilder.andWhere('doc.fechaCreacion >= :fechaCreacionDesde', {
        fechaCreacionDesde: filters.fechaCreacionDesde,
      });
    }

    if (filters.fechaCreacionHasta) {
      queryBuilder.andWhere('doc.fechaCreacion <= :fechaCreacionHasta', {
        fechaCreacionHasta: filters.fechaCreacionHasta,
      });
    }

    if (filters.confidencial !== undefined) {
      queryBuilder.andWhere('doc.confidencial = :confidencial', {
        confidencial: filters.confidencial,
      });
    }

    if (filters.activo !== undefined) {
      queryBuilder.andWhere('doc.activo = :activo', {
        activo: filters.activo,
      });
    }

    if (filters.firmado !== undefined) {
      queryBuilder.andWhere('doc.firmado = :firmado', {
        firmado: filters.firmado,
      });
    }

    if (filters.esPlantilla !== undefined) {
      queryBuilder.andWhere("doc.configuracion->>'esPlantilla' = :esPlantilla", {
        esPlantilla: filters.esPlantilla.toString(),
      });
    }

    if (filters.etiquetas && filters.etiquetas.length > 0) {
      queryBuilder.andWhere('doc.etiquetas && :etiquetas', {
        etiquetas: filters.etiquetas,
      });
    }

    if (filters.tamanoMinimo) {
      queryBuilder.andWhere('doc.tamano >= :tamanoMinimo', {
        tamanoMinimo: filters.tamanoMinimo,
      });
    }

    if (filters.tamanoMaximo) {
      queryBuilder.andWhere('doc.tamano <= :tamanoMaximo', {
        tamanoMaximo: filters.tamanoMaximo,
      });
    }
  }

  private getOrderField(ordenarPor?: string): string {
    const camposValidos = {
      fechaCreacion: 'doc.fechaCreacion',
      fechaModificacion: 'doc.fechaModificacion',
      fechaVencimiento: 'doc.fechaVencimiento',
      nombre: 'doc.nombre',
      tamano: 'doc.tamano',
      tipo: 'doc.tipo',
      categoria: 'doc.categoria',
      estado: 'doc.estado',
    };

    return camposValidos[ordenarPor] || 'doc.fechaCreacion';
  }

  private groupByField(documentos: Documentacion[], field: string): Record<string, number> {
    return documentos.reduce((acc, doc) => {
      const value = doc[field] || 'Sin definir';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async generateCodigoInterno(empresaId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DOC-${year}`;

    const ultimoDocumento = await this.documentosRepository
      .createQueryBuilder('doc')
      .where('doc.empresaId = :empresaId', { empresaId })
      .andWhere('doc.codigoInterno LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('doc.codigoInterno', 'DESC')
      .getOne();

    let numeroSecuencial = 1;
    if (ultimoDocumento && ultimoDocumento.codigoInterno) {
      const match = ultimoDocumento.codigoInterno.match(/-(\d+)$/);
      if (match) {
        numeroSecuencial = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${numeroSecuencial.toString().padStart(6, '0')}`;
  }

  private canEditDocument(documento: Documentacion, usuarioId: string): boolean {
    // El creador siempre puede editar
    if (documento.usuarioCreadorId === usuarioId) {
      return true;
    }

    // Verificar equipo asignado
    if (documento.configuracion?.acceso?.equipoAsignado?.includes(usuarioId)) {
      return true;
    }

    // Si el documento está publicado y no es plantilla, solo el creador puede editar
    if (documento.estado === EstadoDocumento.PUBLICADO && !documento.configuracion?.esPlantilla) {
      return false;
    }

    return true;
  }

  private canAccessDocument(documento: Documentacion, usuarioId: string): boolean {
    // El creador siempre puede acceder
    if (documento.usuarioCreadorId === usuarioId) {
      return true;
    }

    // Documentos públicos
    if (documento.configuracion?.acceso?.publico) {
      return true;
    }

    // Verificar equipo asignado
    if (documento.configuracion?.acceso?.equipoAsignado?.includes(usuarioId)) {
      return true;
    }

    return false;
  }

  private validateStateTransition(
    estadoActual: EstadoDocumento,
    nuevoEstado: EstadoDocumento,
  ): void {
    const transicionesValidas = {
      [EstadoDocumento.BORRADOR]: [
        EstadoDocumento.REVISION,
        EstadoDocumento.PUBLICADO,
        EstadoDocumento.ARCHIVADO,
      ],
      [EstadoDocumento.REVISION]: [
        EstadoDocumento.BORRADOR,
        EstadoDocumento.PUBLICADO,
        EstadoDocumento.RECHAZADO,
      ],
      [EstadoDocumento.PUBLICADO]: [
        EstadoDocumento.REVISION,
        EstadoDocumento.ARCHIVADO,
        EstadoDocumento.VENCIDO,
      ],
      [EstadoDocumento.RECHAZADO]: [
        EstadoDocumento.BORRADOR,
        EstadoDocumento.ARCHIVADO,
      ],
      [EstadoDocumento.ARCHIVADO]: [
        EstadoDocumento.PUBLICADO,
      ],
      [EstadoDocumento.VENCIDO]: [
        EstadoDocumento.REVISION,
        EstadoDocumento.ARCHIVADO,
      ],
    };

    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      throw new BadRequestException(
        `Transición de estado no válida: ${estadoActual} -> ${nuevoEstado}`,
      );
    }
  }
}
