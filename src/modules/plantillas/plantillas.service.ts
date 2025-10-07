import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
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

// Simulamos las entidades que necesitamos
interface Plantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPlantilla;
  formato: FormatoPlantilla;
  categoria?: CategoriaPlantilla;
  estado: EstadoPlantilla;
  contenido: string;
  encabezado?: string;
  piePagina?: string;
  variables?: any[];
  secciones?: any[];
  estilos?: string;
  configuracionFormato?: any;
  etiquetas?: string[];
  esPublica: boolean;
  permiteEdicion: boolean;
  requiereFirma: boolean;
  idioma?: string;
  version: string;
  notasVersion?: string;
  metadatos?: any;
  automatizacion?: any;
  numeroUsos: number;
  fechaUltimoUso?: Date;
  empresaId: string;
  creadoPorId: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface FiltrosPlantillas {
  tipo?: TipoPlantilla[];
  formato?: FormatoPlantilla[];
  categoria?: CategoriaPlantilla[];
  estado?: EstadoPlantilla[];
  etiquetas?: string[];
  soloPublicas?: boolean;
  soloPropias?: boolean;
  buscar?: string;
  creadoPorId?: string;
}

export interface EstadisticasPlantillas {
  totalPlantillas: number;
  plantillasActivas: number;
  plantillasPublicas: number;
  distribucionPorTipo: { [key: string]: number };
  distribucionPorFormato: { [key: string]: number };
  masUsadas: Array<{ id: string; nombre: string; usos: number }>;
  recientes: Array<{ id: string; nombre: string; fechaUso: Date }>;
}

@Injectable()
export class PlantillasService {
  private readonly logger = new Logger(PlantillasService.name);

  constructor(
    // @InjectRepository(Plantilla)
    // private plantillaRepository: Repository<Plantilla>,
  ) {}

  /**
   * Crear nueva plantilla
   */
  async create(createPlantillaDto: CreatePlantillaDto, empresaId: string, usuarioId: string): Promise<any> {
    try {
      this.logger.log(`Creando plantilla: ${createPlantillaDto.nombre}`);

      // Validar contenido de la plantilla
      await this.validarContenidoPlantilla(createPlantillaDto.contenido, createPlantillaDto.variables);

      const plantilla = {
        id: this.generateId(),
        nombre: createPlantillaDto.nombre,
        descripcion: createPlantillaDto.descripcion,
        tipo: createPlantillaDto.tipo,
        formato: createPlantillaDto.formato,
        categoria: createPlantillaDto.categoria,
        estado: EstadoPlantilla.ACTIVA,
        contenido: createPlantillaDto.contenido,
        encabezado: createPlantillaDto.encabezado,
        piePagina: createPlantillaDto.piePagina,
        variables: createPlantillaDto.variables || [],
        secciones: createPlantillaDto.secciones || [],
        estilos: createPlantillaDto.estilos,
        configuracionFormato: createPlantillaDto.configuracionFormato || this.getConfiguracionDefecto(),
        etiquetas: createPlantillaDto.etiquetas || [],
        esPublica: createPlantillaDto.esPublica || false,
        permiteEdicion: createPlantillaDto.permiteEdicion || false,
        requiereFirma: createPlantillaDto.requiereFirma || false,
        idioma: createPlantillaDto.idioma || 'es',
        version: createPlantillaDto.version || '1.0.0',
        notasVersion: createPlantillaDto.notasVersion,
        metadatos: createPlantillaDto.metadatos,
        automatizacion: createPlantillaDto.automatizacion,
        numeroUsos: 0,
        empresaId,
        creadoPorId: usuarioId,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

      // Simular guardado en base de datos
      // const savedPlantilla = await this.plantillaRepository.save(plantilla);

      this.logger.log(`Plantilla creada exitosamente: ${plantilla.id}`);
      return plantilla;

    } catch (error) {
      this.logger.error(`Error al crear plantilla: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al crear plantilla: ${error.message}`);
    }
  }

  /**
   * Obtener plantillas con filtros
   */
  async findAll(
    empresaId: string,
    filtros: FiltrosPlantillas = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      this.logger.log(`Obteniendo plantillas para empresa: ${empresaId}`);

      // Simular consulta con filtros
      let plantillas = await this.aplicarFiltros(empresaId, filtros);

      // Aplicar paginación
      const total = plantillas.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      plantillas = plantillas.slice(offset, offset + limit);

      return {
        data: plantillas,
        total,
        page,
        totalPages
      };

    } catch (error) {
      this.logger.error(`Error al obtener plantillas: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener plantillas: ${error.message}`);
    }
  }

  /**
   * Obtener plantilla por ID
   */
  async findOne(id: string, empresaId: string): Promise<any> {
    try {
      // Simular búsqueda en base de datos
      const plantilla = await this.buscarPorId(id, empresaId);

      if (!plantilla) {
        throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
      }

      return plantilla;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al obtener plantilla: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener plantilla: ${error.message}`);
    }
  }

  /**
   * Actualizar plantilla
   */
  async update(id: string, updatePlantillaDto: UpdatePlantillaDto, empresaId: string): Promise<any> {
    try {
      const plantilla = await this.findOne(id, empresaId);

      // Si se actualiza el contenido, validar
      if (updatePlantillaDto.contenido) {
        await this.validarContenidoPlantilla(
          updatePlantillaDto.contenido, 
          updatePlantillaDto.variables || plantilla.variables
        );
      }

      // Actualizar campos
      Object.assign(plantilla, {
        ...updatePlantillaDto,
        fechaActualizacion: new Date()
      });

      // Simular guardado
      // await this.plantillaRepository.save(plantilla);

      return plantilla;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar plantilla: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al actualizar plantilla: ${error.message}`);
    }
  }

  /**
   * Eliminar plantilla
   */
  async remove(id: string, empresaId: string): Promise<void> {
    try {
      const plantilla = await this.findOne(id, empresaId);

      // Simular eliminación
      // await this.plantillaRepository.remove(plantilla);

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar plantilla: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al eliminar plantilla: ${error.message}`);
    }
  }

  /**
   * Generar documento a partir de plantilla
   */
  async generarDocumento(
    id: string, 
    generarDto: GenerarDocumentoDto, 
    empresaId: string
  ): Promise<{
    contenido: string;
    formato: string;
    nombre: string;
  }> {
    try {
      const plantilla = await this.findOne(id, empresaId);

      if (plantilla.estado !== EstadoPlantilla.ACTIVA) {
        throw new BadRequestException('Solo se pueden usar plantillas activas');
      }

      // Procesar variables en el contenido
      let contenidoProcesado = plantilla.contenido;
      
      if (generarDto.variables) {
        contenidoProcesado = this.procesarVariables(contenidoProcesado, generarDto.variables);
      }

      // Procesar secciones
      if (generarDto.seccionesIncluir && plantilla.secciones) {
        contenidoProcesado = this.procesarSecciones(
          contenidoProcesado, 
          plantilla.secciones, 
          generarDto.seccionesIncluir
        );
      }

      // Aplicar encabezado y pie de página si se solicita
      if (generarDto.configuracion?.incluirEncabezado && plantilla.encabezado) {
        contenidoProcesado = plantilla.encabezado + '\n\n' + contenidoProcesado;
      }

      if (generarDto.configuracion?.incluirPiePagina && plantilla.piePagina) {
        contenidoProcesado = contenidoProcesado + '\n\n' + plantilla.piePagina;
      }

      // Incrementar contador de usos
      // await this.incrementarUso(id);

      const nombreDocumento = generarDto.nombreDocumento || 
        `${plantilla.nombre}_${new Date().toISOString().split('T')[0]}`;

      return {
        contenido: contenidoProcesado,
        formato: generarDto.configuracion?.formato || plantilla.formato,
        nombre: nombreDocumento
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al generar documento: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al generar documento: ${error.message}`);
    }
  }

  /**
   * Validar plantilla
   */
  async validar(id: string, validarDto: ValidarPlantillaDto, empresaId: string): Promise<{
    esValida: boolean;
    errores: string[];
    advertencias: string[];
  }> {
    try {
      const plantilla = await this.findOne(id, empresaId);

      const errores: string[] = [];
      const advertencias: string[] = [];

      // Validar variables si se solicita
      if (validarDto.validarVariables) {
        const erroresVariables = this.validarVariablesEnContenido(plantilla.contenido, plantilla.variables);
        errores.push(...erroresVariables);
      }

      // Validar estructura si se solicita
      if (validarDto.validarEstructura) {
        const erroresEstructura = this.validarEstructuraContenido(plantilla.contenido, plantilla.formato);
        errores.push(...erroresEstructura);
      }

      // Validar formato si se solicita
      if (validarDto.validarFormato) {
        const erroresFormato = this.validarFormatoSalida(plantilla.formato, plantilla.contenido);
        errores.push(...erroresFormato);
      }

      return {
        esValida: errores.length === 0,
        errores,
        advertencias
      };

    } catch (error) {
      this.logger.error(`Error al validar plantilla: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al validar plantilla: ${error.message}`);
    }
  }

  /**
   * Clonar plantilla
   */
  async clonar(id: string, clonarDto: ClonarPlantillaDto, empresaId: string, usuarioId: string): Promise<any> {
    try {
      const plantillaOriginal = await this.findOne(id, empresaId);

      const createDto: CreatePlantillaDto = {
        nombre: clonarDto.nuevoNombre,
        descripcion: clonarDto.nuevaDescripcion || plantillaOriginal.descripcion,
        tipo: plantillaOriginal.tipo,
        formato: plantillaOriginal.formato,
        categoria: plantillaOriginal.categoria,
        contenido: plantillaOriginal.contenido,
        encabezado: plantillaOriginal.encabezado,
        piePagina: plantillaOriginal.piePagina,
        variables: clonarDto.mantenerVariables ? plantillaOriginal.variables : [],
        secciones: plantillaOriginal.secciones,
        estilos: plantillaOriginal.estilos,
        configuracionFormato: clonarDto.mantenerConfiguracion ? plantillaOriginal.configuracionFormato : undefined,
        etiquetas: plantillaOriginal.etiquetas,
        esPublica: false,
        permiteEdicion: true,
        requiereFirma: plantillaOriginal.requiereFirma,
        idioma: plantillaOriginal.idioma,
        version: '1.0.0',
        notasVersion: `Clonada de: ${plantillaOriginal.nombre}`,
        automatizacion: clonarDto.mantenerConfiguracion ? plantillaOriginal.automatizacion : undefined
      };

      return this.create(createDto, empresaId, usuarioId);

    } catch (error) {
      this.logger.error(`Error al clonar plantilla: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al clonar plantilla: ${error.message}`);
    }
  }

  /**
   * Crear nueva versión
   */
  async crearVersion(id: string, versionarDto: VersionarPlantillaDto, empresaId: string): Promise<any> {
    try {
      const plantilla = await this.findOne(id, empresaId);

      // Actualizar versión
      const updateDto: UpdatePlantillaDto = {
        version: versionarDto.version,
        notasVersion: versionarDto.notasCambios
      };

      return this.update(id, updateDto, empresaId);

    } catch (error) {
      this.logger.error(`Error al versionar plantilla: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al versionar plantilla: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas
   */
  async obtenerEstadisticas(empresaId: string): Promise<EstadisticasPlantillas> {
    try {
      // Simular consultas estadísticas
      return {
        totalPlantillas: 45,
        plantillasActivas: 38,
        plantillasPublicas: 12,
        distribucionPorTipo: {
          [TipoPlantilla.DOCUMENTO]: 15,
          [TipoPlantilla.CONTRATO]: 12,
          [TipoPlantilla.CARTA]: 8,
          [TipoPlantilla.DEMANDA]: 6,
          [TipoPlantilla.INFORME]: 4
        },
        distribucionPorFormato: {
          [FormatoPlantilla.DOCX]: 25,
          [FormatoPlantilla.PDF]: 12,
          [FormatoPlantilla.HTML]: 6,
          [FormatoPlantilla.TXT]: 2
        },
        masUsadas: [
          { id: '1', nombre: 'Contrato de Servicios', usos: 45 },
          { id: '2', nombre: 'Carta de Cobranza', usos: 32 },
          { id: '3', nombre: 'Demanda Civil', usos: 28 }
        ],
        recientes: [
          { id: '4', nombre: 'Informe Legal', fechaUso: new Date() },
          { id: '5', nombre: 'Poder General', fechaUso: new Date() }
        ]
      };

    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Métodos privados auxiliares

  private generateId(): string {
    return `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getConfiguracionDefecto(): any {
    return {
      margenSuperior: 2.5,
      margenInferior: 2.5,
      margenIzquierdo: 2.5,
      margenDerecho: 2.5,
      tamañoFuente: 12,
      fuenteTexto: 'Times New Roman',
      interlineado: 1.15,
      orientacion: 'portrait',
      tamañoPapel: 'A4'
    };
  }

  private async validarContenidoPlantilla(contenido: string, variables?: any[]): Promise<void> {
    // Validar que las variables referenciadas existan
    const variablesEnContenido = this.extraerVariablesDeContenido(contenido);
    const variablesDefinidas = variables?.map(v => v.nombre) || [];

    const variablesFaltantes = variablesEnContenido.filter(v => !variablesDefinidas.includes(v));
    
    if (variablesFaltantes.length > 0) {
      throw new BadRequestException(
        `Variables no definidas encontradas en el contenido: ${variablesFaltantes.join(', ')}`
      );
    }
  }

  private extraerVariablesDeContenido(contenido: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(contenido)) !== null) {
      variables.push(match[1].trim());
    }

    return [...new Set(variables)];
  }

  private procesarVariables(contenido: string, variables: { [key: string]: any }): string {
    let resultado = contenido;

    Object.entries(variables).forEach(([nombre, valor]) => {
      const regex = new RegExp(`\\{\\{\\s*${nombre}\\s*\\}\\}`, 'g');
      resultado = resultado.replace(regex, String(valor || ''));
    });

    return resultado;
  }

  private procesarSecciones(contenido: string, secciones: any[], seccionesIncluir: string[]): string {
    let resultado = contenido;

    secciones.forEach(seccion => {
      if (seccionesIncluir.includes(seccion.nombre)) {
        // Incluir sección
        const marcador = `{{SECCION_${seccion.nombre.toUpperCase()}}}`;
        resultado = resultado.replace(marcador, seccion.contenido);
      } else {
        // Remover sección
        const marcador = `{{SECCION_${seccion.nombre.toUpperCase()}}}`;
        resultado = resultado.replace(marcador, '');
      }
    });

    return resultado;
  }

  private validarVariablesEnContenido(contenido: string, variables?: any[]): string[] {
    const errores: string[] = [];
    const variablesEnContenido = this.extraerVariablesDeContenido(contenido);
    const variablesDefinidas = variables?.map(v => v.nombre) || [];

    const variablesFaltantes = variablesEnContenido.filter(v => !variablesDefinidas.includes(v));
    
    if (variablesFaltantes.length > 0) {
      errores.push(`Variables no definidas: ${variablesFaltantes.join(', ')}`);
    }

    return errores;
  }

  private validarEstructuraContenido(contenido: string, formato: FormatoPlantilla): string[] {
    const errores: string[] = [];

    // Validaciones básicas según el formato
    if (formato === FormatoPlantilla.HTML) {
      // Validar HTML básico
      if (!contenido.includes('<') && !contenido.includes('>')) {
        errores.push('El contenido HTML debe contener etiquetas válidas');
      }
    }

    return errores;
  }

  private validarFormatoSalida(formato: FormatoPlantilla, contenido: string): string[] {
    const errores: string[] = [];

    // Validaciones específicas por formato
    switch (formato) {
      case FormatoPlantilla.HTML:
        if (contenido.length > 1000000) { // 1MB
          errores.push('El contenido HTML es demasiado extenso');
        }
        break;
      case FormatoPlantilla.PDF:
        // Validaciones específicas para PDF
        break;
    }

    return errores;
  }

  private async aplicarFiltros(empresaId: string, filtros: FiltrosPlantillas): Promise<any[]> {
    // Simular aplicación de filtros
    return [];
  }

  private async buscarPorId(id: string, empresaId: string): Promise<any> {
    // Simular búsqueda
    return null;
  }
}
