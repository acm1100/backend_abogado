import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Like,
  Not,
  IsNull,
} from 'typeorm';
import { 
  CreateGastoDto, 
  UpdateGastoDto, 
  CambiarEstadoGastoDto,
  AsignarGastoDto,
  ReembolsoGastoDto,
  FiltrosGastoDto,
  PaginacionGastoDto,
  EstadisticasGastoDto
} from './dto';
import { Gasto, EstadoGasto, TipoGasto, CategoriaGasto } from '../../entities/gasto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Documentacion } from '../../entities/documentacion.entity';

@Injectable()
export class GastosService {
  private readonly logger = new Logger(GastosService.name);

  constructor(
    @InjectRepository(Gasto)
    private readonly gastoRepository: Repository<Gasto>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Caso)
    private readonly casoRepository: Repository<Caso>,
    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
    @InjectRepository(Documentacion)
    private readonly documentacionRepository: Repository<Documentacion>,
  ) {}

  /**
   * Crear un nuevo gasto
   */
  async create(createGastoDto: CreateGastoDto, usuarioId: string, empresaId: string): Promise<Gasto> {
    const gasto = this.gastoRepository.create({
      concepto: createGastoDto.descripcion,
      descripcion: createGastoDto.observaciones,
      tipo: createGastoDto.tipo,
      categoria: createGastoDto.categoria,
      estado: createGastoDto.estado || EstadoGasto.PENDIENTE,
      fecha: new Date(createGastoDto.fechaGasto),
      monto: createGastoDto.monto,
      moneda: createGastoDto.moneda as any,
      metodoPago: createGastoDto.metodoPago,
      esFacturable: createGastoDto.facturable || false,
      esReembolsable: createGastoDto.reembolsable || false,
      observaciones: createGastoDto.observaciones,
      etiquetas: createGastoDto.etiquetas,
      metadatos: createGastoDto.configuracion,
      usuarioId,
      empresaId,
      clienteId: createGastoDto.clienteId,
      casoId: createGastoDto.casoId,
      // Datos del comprobante
      tipoComprobante: createGastoDto.comprobante?.tipo as any,
      numeroComprobante: createGastoDto.comprobante?.numero,
      fechaComprobante: createGastoDto.comprobante?.fechaEmision ? new Date(createGastoDto.comprobante.fechaEmision) : undefined,
      // Datos del proveedor
      nombreProveedor: createGastoDto.proveedor?.nombre,
      rucProveedor: createGastoDto.proveedor?.numeroDocumento,
    });

    return await this.gastoRepository.save(gasto);
  }

  /**
   * Obtener todos los gastos con filtros
   */
  async findAll(filtros: any, empresaId: string): Promise<any> {
    const query = this.gastoRepository.createQueryBuilder('gasto')
      .where('gasto.empresaId = :empresaId', { empresaId });

    if (filtros.estado) {
      query.andWhere('gasto.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.fechaDesde) {
      query.andWhere('gasto.fecha >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    }

    if (filtros.fechaHasta) {
      query.andWhere('gasto.fecha <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    }

    return query.getMany();
  }

  /**
   * Obtener un gasto por ID
   */
  async findOne(id: string, empresaId: string): Promise<Gasto> {
    const gasto = await this.gastoRepository.findOne({
      where: { id, empresaId }
    });

    if (!gasto) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return gasto;
  }

  /**
   * Actualizar un gasto
   */
  async update(id: string, updateGastoDto: UpdateGastoDto, usuarioId: string, empresaId: string): Promise<Gasto> {
    const gasto = await this.findOne(id, empresaId);
    
    Object.assign(gasto, updateGastoDto);
    return this.gastoRepository.save(gasto);
  }

  /**
   * Cambiar estado de un gasto
   */
  async cambiarEstado(id: string, cambiarEstadoDto: CambiarEstadoGastoDto, usuarioId: string, empresaId: string): Promise<Gasto> {
    const gasto = await this.findOne(id, empresaId);
    
    gasto.estado = cambiarEstadoDto.estado;
    return this.gastoRepository.save(gasto);
  }

  /**
   * Asignar gasto
   */
  async asignar(id: string, asignarGastoDto: AsignarGastoDto, usuarioId: string, empresaId: string): Promise<Gasto> {
    const gasto = await this.findOne(id, empresaId);
    
    Object.assign(gasto, asignarGastoDto);
    return this.gastoRepository.save(gasto);
  }

  /**
   * Procesar reembolso
   */
  async procesarReembolso(id: string, reembolsoDto: ReembolsoGastoDto, usuarioId: string, empresaId: string): Promise<Gasto> {
    const gasto = await this.findOne(id, empresaId);
    
    gasto.estado = EstadoGasto.REEMBOLSADO;
    return this.gastoRepository.save(gasto);
  }

  /**
   * Eliminar gasto
   */
  async remove(id: string, usuarioId: string, empresaId: string): Promise<void> {
    const gasto = await this.findOne(id, empresaId);
    await this.gastoRepository.remove(gasto);
  }

  /**
   * Obtener estadísticas
   */
  async obtenerEstadisticas(filtros: any, empresaId: string): Promise<any> {
    return {
      totalGastos: await this.gastoRepository.count({ where: { empresaId } }),
      gastosPendientes: await this.gastoRepository.count({ where: { empresaId, estado: EstadoGasto.PENDIENTE } }),
      gastosAprobados: await this.gastoRepository.count({ where: { empresaId, estado: EstadoGasto.APROBADO } }),
    };
  }

  /**
   * Obtener gastos por aprobar
   */
  async obtenerGastosPorAprobar(empresaId: string, usuarioId: string): Promise<Gasto[]> {
    return this.gastoRepository.find({
      where: { 
        empresaId, 
        estado: EstadoGasto.PENDIENTE_APROBACION 
      }
    });
  }
}
