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
  MoreThan,
  LessThan,
} from 'typeorm';
import { 
  Facturacion, 
  EstadoFactura, 
  TipoFactura,
  MonedaFactura,
  MetodoPago 
} from '../../entities/facturacion.entity';
import { Cliente, EstadoCliente } from '../../entities/cliente.entity';
import { Caso, EstadoCaso } from '../../entities/caso.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { CreateFacturacionDto, DetalleFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { FilterFacturacionDto } from './dto/filter-facturacion.dto';

@Injectable()
export class FacturacionService {
  private readonly IGV_RATE = 0.18; // 18% IGV en Perú
  private readonly DETRACCION_RATES = {
    'SERVICIOS_LEGALES': 0.04, // 4%
    'CONSULTORIA': 0.04,
    'OTROS_SERVICIOS': 0.10,
  };

  constructor(
    @InjectRepository(Facturacion)
    private facturacionRepository: Repository<Facturacion>,
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
    @InjectRepository(Caso)
    private casosRepository: Repository<Caso>,
    @InjectRepository(Proyecto)
    private proyectosRepository: Repository<Proyecto>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  /**
   * Crear una nueva factura
   */
  async create(
    createFacturacionDto: CreateFacturacionDto,
    empresaId: string,
    usuarioCreadorId: string,
  ): Promise<Facturacion> {
    // Validar que el cliente exista y pertenezca a la empresa
    const cliente = await this.clientesRepository.findOne({
      where: {
        id: createFacturacionDto.clienteId,
        empresaId,
        estado: EstadoCliente.ACTIVO,
      },
    });

    if (!cliente) {
      throw new NotFoundException(
        'Cliente no encontrado o no pertenece a la empresa',
      );
    }

    // Validar asociaciones opcionales
    await this.validateAssociations(createFacturacionDto, empresaId);

    // Calcular totales de los detalles
    const detallesCalculados = this.calculateDetalles(createFacturacionDto.detalles);
    
    // Calcular totales de la factura
    const totales = this.calculateTotales(
      detallesCalculados, 
      createFacturacionDto.descuentoGlobal || 0,
      createFacturacionDto.detraccion || 0,
    );

    // Generar números internos
    const numeroInterno = await this.generateNumeroInterno(empresaId, createFacturacionDto.tipo);
    
    // Validar fechas
    this.validateFechas(createFacturacionDto.fechaEmision, createFacturacionDto.fechaVencimiento);

    // Buscar el usuario creador
    const creador = await this.usuariosRepository.findOne({
      where: { id: usuarioCreadorId }
    });

    // Crear la factura
    const factura = this.facturacionRepository.create({
      tipoFactura: createFacturacionDto.tipo,
      estado: createFacturacionDto.estado || EstadoFactura.BORRADOR,
      moneda: createFacturacionDto.moneda as MonedaFactura || MonedaFactura.PEN,
      fechaEmision: new Date(createFacturacionDto.fechaEmision),
      fechaVencimiento: new Date(createFacturacionDto.fechaVencimiento),
      observaciones: createFacturacionDto.observaciones,
      
      // IDs
      empresaId,
      numeroInterno,
      
      // Totales calculados
      subtotal: totales.subtotal,
      descuento: totales.montoDescuento || 0,
      igv: totales.montoIGV || 0,
      total: totales.montoTotal,
      
      // Relaciones
      creador,
      
      configuracion: {
        facturacionElectronica: {
          habilitada: true,
          codigoEstablecimiento: '0000',
          puntoEmision: '001',
          ...createFacturacionDto.configuracion?.facturacionElectronica,
        },
        recordatorios: {
          previoVencimiento: 3, // 3 días antes
          despuesVencimiento: [7, 15, 30], // días después
          ...createFacturacionDto.configuracion?.recordatorios,
        },
        exportacion: {
          formatosPDF: true,
          formatosXML: true,
          incluirQR: true,
          ...createFacturacionDto.configuracion?.exportacion,
        },
        ...createFacturacionDto.configuracion,
      },
    });

    const facturaGuardada = await this.facturacionRepository.save(factura) as Facturacion;

    // Enviar por email si está configurado
    if (createFacturacionDto.enviarEmail) {
      // Aquí se implementaría el envío de email

    }

    // Retornar la factura con relaciones
    return this.findOne(facturaGuardada.id, empresaId);
  }

  /**
   * Buscar facturas con filtros y paginación
   */
  async findAll(
    filters: FilterFacturacionDto,
    empresaId: string,
    usuarioId?: string,
  ): Promise<{
    facturas: Facturacion[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
    totales: {
      montoTotal: number;
      montoPagado: number;
      montoPendiente: number;
      facturasPagadas: number;
      facturasVencidas: number;
    };
  }> {
    const queryBuilder = this.facturacionRepository
      .createQueryBuilder('factura')
      .leftJoinAndSelect('factura.cliente', 'cliente')
      .leftJoinAndSelect('factura.caso', 'caso')
      .leftJoinAndSelect('factura.proyecto', 'proyecto')
      .leftJoinAndSelect('factura.usuarioCreador', 'usuarioCreador')
      .where('factura.empresaId = :empresaId', { empresaId });

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

    const [facturas, total] = await queryBuilder.getManyAndCount();

    // Calcular totales para el resumen
    const totales = await this.calculateResumenTotales(filters, empresaId);

    return {
      facturas,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      totales,
    };
  }

  /**
   * Buscar factura por ID
   */
  async findOne(id: string, empresaId: string): Promise<Facturacion> {
    const factura = await this.facturacionRepository.findOne({
      where: { id, empresaId },
      relations: [
        'cliente',
        'caso',
        'proyecto',
        'usuarioCreador',
      ],
    });

    if (!factura) {
      throw new NotFoundException('Factura no encontrada');
    }

    return factura;
  }

  /**
   * Actualizar factura
   */
  async update(
    id: string,
    updateFacturacionDto: UpdateFacturacionDto,
    empresaId: string,
    usuarioId: string,
  ): Promise<Facturacion> {
    const factura = await this.findOne(id, empresaId);

    // Verificar que se puede editar (solo borradores o emitidas no pagadas)
    if (!this.canEditFactura(factura)) {
      throw new BadRequestException('No se puede editar esta factura en su estado actual');
    }

    // Validar nuevas asociaciones si se proporcionan
    if (updateFacturacionDto.clienteId || updateFacturacionDto.casoId || updateFacturacionDto.proyectoId) {
      await this.validateAssociations(updateFacturacionDto, empresaId);
    }

    // Recalcular totales si se modificaron los detalles
    if (updateFacturacionDto.detalles) {
      const detallesCalculados = this.calculateDetalles(updateFacturacionDto.detalles);
      const totales = this.calculateTotales(
        detallesCalculados,
        updateFacturacionDto.descuentoGlobal || factura.descuentoGlobal || 0,
        updateFacturacionDto.detraccion || factura.detraccion || 0,
      );

      updateFacturacionDto.detalles = detallesCalculados;
      Object.assign(updateFacturacionDto, {
        subtotal: totales.subtotal,
        montoDescuento: totales.montoDescuento,
        baseImponible: totales.baseImponible,
        montoIGV: totales.montoIGV,
        montoDetraccion: totales.montoDetraccion,
        montoTotal: totales.montoTotal,
      });
    }

    // Registrar cambio de estado si aplica
    if (updateFacturacionDto.estado && updateFacturacionDto.estado !== factura.estado) {
      this.validateStateTransition(factura.estado, updateFacturacionDto.estado);
      
      // Procesar según el nuevo estado
      await this.processStateChange(factura, updateFacturacionDto.estado, updateFacturacionDto);
    }

    // Actualizar configuración
    if (updateFacturacionDto.configuracion) {
      factura.configuracion = {
        ...factura.configuracion,
        ...updateFacturacionDto.configuracion,
      };
    }

    Object.assign(factura, updateFacturacionDto);
    factura.fechaModificacion = new Date();

    const facturaActualizada = await this.facturacionRepository.save(factura);
    return this.findOne(facturaActualizada.id, empresaId);
  }

  /**
   * Anular factura
   */
  async anular(
    id: string,
    motivo: string,
    empresaId: string,
    usuarioId: string,
  ): Promise<Facturacion> {
    const factura = await this.findOne(id, empresaId);

    if (factura.anulada) {
      throw new BadRequestException('La factura ya está anulada');
    }

    if (factura.estado === EstadoFactura.PAGADA) {
      throw new BadRequestException('No se puede anular una factura pagada');
    }

    factura.anulada = true;
    factura.motivoAnulacion = motivo;
    factura.fechaAnulacion = new Date();
    factura.anuladaPor = usuarioId;
    factura.estado = EstadoFactura.ANULADA;
    factura.fechaModificacion = new Date();

    await this.facturacionRepository.save(factura);
    return this.findOne(id, empresaId);
  }

  /**
   * Registrar pago
   */
  async registrarPago(
    id: string,
    montoPagado: number,
    metodoPago: MetodoPago,
    referencia: string,
    empresaId: string,
    usuarioId: string,
  ): Promise<Facturacion> {
    const factura = await this.findOne(id, empresaId);

    if (factura.anulada) {
      throw new BadRequestException('No se puede registrar pago en una factura anulada');
    }

    if (factura.estado === EstadoFactura.PAGADA) {
      throw new BadRequestException('La factura ya está pagada');
    }

    const totalPagadoAnterior = factura.montoPagado || 0;
    const nuevoTotalPagado = totalPagadoAnterior + montoPagado;

    if (nuevoTotalPagado > factura.montoTotal) {
      throw new BadRequestException('El monto pagado excede el total de la factura');
    }

    factura.montoPagado = nuevoTotalPagado;
    factura.metodoPagoUtilizado = metodoPago;
    factura.referenciaPago = referencia;
    factura.fechaPago = new Date();

    // Cambiar estado según el monto pagado
    if (nuevoTotalPagado >= factura.montoTotal) {
      factura.estado = EstadoFactura.PAGADA;
    } else if (nuevoTotalPagado > 0) {
      factura.estado = EstadoFactura.PAGO_PARCIAL;
    }

    factura.fechaModificacion = new Date();

    await this.facturacionRepository.save(factura);
    return this.findOne(id, empresaId);
  }

  /**
   * Obtener estadísticas de facturación
   */
  async getEstadisticas(
    empresaId: string,
    filtros?: {
      fechaDesde?: string;
      fechaHasta?: string;
      clienteId?: string;
    },
  ): Promise<{
    resumen: {
      totalFacturas: number;
      montoTotal: number;
      montoPagado: number;
      montoPendiente: number;
      promedioFactura: number;
    };
    porEstado: Record<string, { cantidad: number; monto: number }>;
    porTipo: Record<string, { cantidad: number; monto: number }>;
    porMoneda: Record<string, { cantidad: number; monto: number }>;
    porMes: Record<string, { cantidad: number; monto: number }>;
    vencimiento: {
      vencidas: { cantidad: number; monto: number };
      porVencer: { cantidad: number; monto: number };
      vigentes: { cantidad: number; monto: number };
    };
    clientes: Array<{
      clienteId: string;
      clienteNombre: string;
      cantidad: number;
      monto: number;
    }>;
  }> {
    const queryBuilder = this.facturacionRepository
      .createQueryBuilder('factura')
      .leftJoinAndSelect('factura.cliente', 'cliente')
      .where('factura.empresaId = :empresaId', { empresaId })
      .andWhere('factura.activo = true')
      .andWhere('factura.anulada = false');

    // Aplicar filtros de fecha
    if (filtros?.fechaDesde) {
      queryBuilder.andWhere('factura.fechaEmision >= :fechaDesde', {
        fechaDesde: filtros.fechaDesde,
      });
    }

    if (filtros?.fechaHasta) {
      queryBuilder.andWhere('factura.fechaEmision <= :fechaHasta', {
        fechaHasta: filtros.fechaHasta,
      });
    }

    if (filtros?.clienteId) {
      queryBuilder.andWhere('factura.clienteId = :clienteId', {
        clienteId: filtros.clienteId,
      });
    }

    const facturas = await queryBuilder.getMany();

    return this.processEstadisticas(facturas);
  }

  /**
   * Generar reporte de facturación
   */
  async generarReporte(
    tipo: 'PDF' | 'EXCEL',
    filtros: FilterFacturacionDto,
    empresaId: string,
  ): Promise<Buffer> {
    const { facturas } = await this.findAll(filtros, empresaId);

    if (tipo === 'PDF') {
      return this.generatePDFReport(facturas);
    } else {
      return this.generateExcelReport(facturas);
    }
  }

  // Métodos privados

  private async validateAssociations(
    dto: Partial<CreateFacturacionDto>,
    empresaId: string,
  ): Promise<void> {
    if (dto.casoId) {
      const caso = await this.casosRepository.findOne({
        where: { id: dto.casoId, empresaId, estado: EstadoCaso.ACTIVO },
      });
      if (!caso) {
        throw new NotFoundException('Caso no encontrado');
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

  private calculateDetalles(detalles: DetalleFacturacionDto[]): DetalleFacturacionDto[] {
    return detalles.map(detalle => {
      const subtotal = detalle.cantidad * detalle.precioUnitario;
      const montoDescuento = subtotal * ((detalle.descuento || 0) / 100);
      const baseImponible = subtotal - montoDescuento;
      const montoImpuesto = baseImponible * ((detalle.tasaImpuesto || 18) / 100);
      const total = baseImponible + montoImpuesto;

      return {
        ...detalle,
        subtotal,
        montoDescuento,
        baseImponible,
        montoImpuesto,
        total,
      };
    });
  }

  private calculateTotales(
    detalles: DetalleFacturacionDto[],
    descuentoGlobal: number,
    detraccion: number,
  ): {
    subtotal: number;
    montoDescuento: number;
    baseImponible: number;
    montoIGV: number;
    montoDetraccion: number;
    montoTotal: number;
  } {
    const subtotal = detalles.reduce((sum, detalle) => sum + (detalle.subtotal || 0), 0);
    const montoDescuentoDetalles = detalles.reduce((sum, detalle) => sum + (detalle.montoDescuento || 0), 0);
    const montoDescuentoGlobal = subtotal * (descuentoGlobal / 100);
    const montoDescuento = montoDescuentoDetalles + montoDescuentoGlobal;
    
    const baseImponible = subtotal - montoDescuento;
    const montoIGV = detalles.reduce((sum, detalle) => sum + (detalle.montoImpuesto || 0), 0);
    const montoDetraccion = baseImponible * (detraccion / 100);
    const montoTotal = baseImponible + montoIGV;

    return {
      subtotal,
      montoDescuento,
      baseImponible,
      montoIGV,
      montoDetraccion,
      montoTotal,
    };
  }

  private async generateNumeroInterno(
    empresaId: string,
    tipo: TipoFactura,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = this.getTipoPrefix(tipo);
    const serie = `${prefix}${year}`;

    const ultimaFactura = await this.facturacionRepository
      .createQueryBuilder('factura')
      .where('factura.empresaId = :empresaId', { empresaId })
      .andWhere('factura.numeroInterno LIKE :serie', { serie: `${serie}%` })
      .orderBy('factura.numeroInterno', 'DESC')
      .getOne();

    let numeroSecuencial = 1;
    if (ultimaFactura && ultimaFactura.numeroInterno) {
      const match = ultimaFactura.numeroInterno.match(/-(\d+)$/);
      if (match) {
        numeroSecuencial = parseInt(match[1]) + 1;
      }
    }

    return `${serie}-${numeroSecuencial.toString().padStart(8, '0')}`;
  }

  private getTipoPrefix(tipo: TipoFactura): string {
    const prefixes = {
      [TipoFactura.FACTURA]: 'F',
      [TipoFactura.BOLETA]: 'B',
      [TipoFactura.NOTA_CREDITO]: 'NC',
      [TipoFactura.NOTA_DEBITO]: 'ND',
      [TipoFactura.RECIBO_HONORARIOS]: 'RH',
    };
    return prefixes[tipo] || 'F';
  }

  private validateFechas(fechaEmision: string, fechaVencimiento: string): void {
    const emision = new Date(fechaEmision);
    const vencimiento = new Date(fechaVencimiento);

    if (vencimiento <= emision) {
      throw new BadRequestException('La fecha de vencimiento debe ser posterior a la de emisión');
    }
  }

  private canEditFactura(factura: Facturacion): boolean {
    if (factura.anulada) return false;
    
    const estadosEditables = [
      EstadoFactura.BORRADOR,
      EstadoFactura.EMITIDA,
    ];

    return estadosEditables.includes(factura.estado);
  }

  private validateStateTransition(
    estadoActual: EstadoFactura,
    nuevoEstado: EstadoFactura,
  ): void {
    const transicionesValidas = {
      [EstadoFactura.BORRADOR]: [
        EstadoFactura.EMITIDA,
        EstadoFactura.ANULADA,
      ],
      [EstadoFactura.EMITIDA]: [
        EstadoFactura.ENVIADA,
        EstadoFactura.VENCIDA,
        EstadoFactura.PAGO_PARCIAL,
        EstadoFactura.PAGADA,
        EstadoFactura.ANULADA,
      ],
      [EstadoFactura.ENVIADA]: [
        EstadoFactura.VENCIDA,
        EstadoFactura.PAGO_PARCIAL,
        EstadoFactura.PAGADA,
      ],
      [EstadoFactura.VENCIDA]: [
        EstadoFactura.PAGO_PARCIAL,
        EstadoFactura.PAGADA,
      ],
      [EstadoFactura.PAGO_PARCIAL]: [
        EstadoFactura.PAGADA,
      ],
    };

    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      throw new BadRequestException(
        `Transición de estado no válida: ${estadoActual} -> ${nuevoEstado}`,
      );
    }
  }

  private async processStateChange(
    factura: Facturacion,
    nuevoEstado: EstadoFactura,
    updateDto: UpdateFacturacionDto,
  ): Promise<void> {
    switch (nuevoEstado) {
      case EstadoFactura.EMITIDA:
        // Generar número SUNAT si está habilitada la facturación electrónica
        if (factura.configuracion?.facturacionElectronica?.habilitada) {

        }
        break;

      case EstadoFactura.ENVIADA:
        factura.fechaEnvio = new Date();
        break;

      case EstadoFactura.PAGADA:
        if (!factura.fechaPago) {
          factura.fechaPago = new Date();
        }
        break;
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Facturacion>,
    filters: FilterFacturacionDto,
    usuarioId?: string,
  ): void {
    if (filters.busqueda) {
      queryBuilder.andWhere(
        "(factura.numeroInterno ILIKE :busqueda OR factura.receptor->>'nombre' ILIKE :busqueda OR factura.observaciones ILIKE :busqueda)",
        { busqueda: `%${filters.busqueda}%` },
      );
    }

    if (filters.tipo) {
      queryBuilder.andWhere('factura.tipo = :tipo', { tipo: filters.tipo });
    }

    if (filters.estado) {
      queryBuilder.andWhere('factura.estado = :estado', { estado: filters.estado });
    }

    if (filters.clienteId) {
      queryBuilder.andWhere('factura.clienteId = :clienteId', {
        clienteId: filters.clienteId,
      });
    }

    if (filters.casoId) {
      queryBuilder.andWhere('factura.casoId = :casoId', { casoId: filters.casoId });
    }

    if (filters.moneda) {
      queryBuilder.andWhere('factura.moneda = :moneda', { moneda: filters.moneda });
    }

    if (filters.fechaEmisionDesde) {
      queryBuilder.andWhere('factura.fechaEmision >= :fechaEmisionDesde', {
        fechaEmisionDesde: filters.fechaEmisionDesde,
      });
    }

    if (filters.fechaEmisionHasta) {
      queryBuilder.andWhere('factura.fechaEmision <= :fechaEmisionHasta', {
        fechaEmisionHasta: filters.fechaEmisionHasta,
      });
    }

    if (filters.vencidas) {
      const hoy = new Date().toISOString().split('T')[0];
      queryBuilder.andWhere('factura.fechaVencimiento < :hoy', { hoy });
      queryBuilder.andWhere('factura.estado != :pagada', { pagada: EstadoFactura.PAGADA });
    }

    if (filters.pagadas) {
      queryBuilder.andWhere('factura.estado = :pagada', { pagada: EstadoFactura.PAGADA });
    }

    if (filters.anuladas !== undefined) {
      queryBuilder.andWhere('factura.anulada = :anuladas', {
        anuladas: filters.anuladas,
      });
    }

    if (filters.activo !== undefined) {
      queryBuilder.andWhere('factura.activo = :activo', {
        activo: filters.activo,
      });
    }
  }

  private getOrderField(ordenarPor?: string): string {
    const camposValidos = {
      fechaEmision: 'factura.fechaEmision',
      fechaVencimiento: 'factura.fechaVencimiento',
      fechaPago: 'factura.fechaPago',
      fechaCreacion: 'factura.fechaCreacion',
      numeroInterno: 'factura.numeroInterno',
      montoTotal: 'factura.montoTotal',
      estado: 'factura.estado',
      receptor: "factura.receptor->>'nombre'",
    };

    return camposValidos[ordenarPor] || 'factura.fechaEmision';
  }

  private async calculateResumenTotales(
    filters: FilterFacturacionDto,
    empresaId: string,
  ): Promise<{
    montoTotal: number;
    montoPagado: number;
    montoPendiente: number;
    facturasPagadas: number;
    facturasVencidas: number;
  }> {
    const queryBuilder = this.facturacionRepository
      .createQueryBuilder('factura')
      .where('factura.empresaId = :empresaId', { empresaId });

    this.applyFilters(queryBuilder, filters);

    const facturas = await queryBuilder.getMany();

    const montoTotal = facturas.reduce((sum, f) => sum + f.montoTotal, 0);
    const montoPagado = facturas.reduce((sum, f) => sum + (f.montoPagado || 0), 0);
    const montoPendiente = montoTotal - montoPagado;
    const facturasPagadas = facturas.filter(f => f.estado === EstadoFactura.PAGADA).length;
    
    const hoy = new Date();
    const facturasVencidas = facturas.filter(
      f => new Date(f.fechaVencimiento) < hoy && f.estado !== EstadoFactura.PAGADA,
    ).length;

    return {
      montoTotal,
      montoPagado,
      montoPendiente,
      facturasPagadas,
      facturasVencidas,
    };
  }

  private processEstadisticas(facturas: Facturacion[]): any {
    // Implementación de procesamiento de estadísticas
    // Esta sería una función compleja que agrupa y calcula todas las métricas
    const montoTotal = facturas.reduce((sum, f) => sum + f.montoTotal, 0);
    const montoPagado = facturas.reduce((sum, f) => sum + (f.montoPagado || 0), 0);
    
    return {
      resumen: {
        totalFacturas: facturas.length,
        montoTotal,
        montoPagado,
        montoPendiente: montoTotal - montoPagado,
        promedioFactura: facturas.length > 0 ? montoTotal / facturas.length : 0,
      },
      porEstado: this.groupByEstado(facturas),
      porTipo: this.groupByTipo(facturas),
      porMoneda: this.groupByMoneda(facturas),
      porMes: this.groupByMes(facturas),
      vencimiento: this.groupByVencimiento(facturas),
      clientes: this.groupByCliente(facturas),
    };
  }

  private groupByEstado(facturas: Facturacion[]): Record<string, { cantidad: number; monto: number }> {
    return facturas.reduce((acc, factura) => {
      const estado = factura.estado;
      if (!acc[estado]) {
        acc[estado] = { cantidad: 0, monto: 0 };
      }
      acc[estado].cantidad++;
      acc[estado].monto += factura.montoTotal;
      return acc;
    }, {});
  }

  private groupByTipo(facturas: Facturacion[]): Record<string, { cantidad: number; monto: number }> {
    return facturas.reduce((acc, factura) => {
      const tipo = factura.tipo;
      if (!acc[tipo]) {
        acc[tipo] = { cantidad: 0, monto: 0 };
      }
      acc[tipo].cantidad++;
      acc[tipo].monto += factura.montoTotal;
      return acc;
    }, {});
  }

  private groupByMoneda(facturas: Facturacion[]): Record<string, { cantidad: number; monto: number }> {
    return facturas.reduce((acc, factura) => {
      const moneda = factura.moneda;
      if (!acc[moneda]) {
        acc[moneda] = { cantidad: 0, monto: 0 };
      }
      acc[moneda].cantidad++;
      acc[moneda].monto += factura.montoTotal;
      return acc;
    }, {});
  }

  private groupByMes(facturas: Facturacion[]): Record<string, { cantidad: number; monto: number }> {
    return facturas.reduce((acc, factura) => {
      const mes = new Date(factura.fechaEmision).toISOString().substr(0, 7);
      if (!acc[mes]) {
        acc[mes] = { cantidad: 0, monto: 0 };
      }
      acc[mes].cantidad++;
      acc[mes].monto += factura.montoTotal;
      return acc;
    }, {});
  }

  private groupByVencimiento(facturas: Facturacion[]): {
    vencidas: { cantidad: number; monto: number };
    porVencer: { cantidad: number; monto: number };
    vigentes: { cantidad: number; monto: number };
  } {
    const hoy = new Date();
    const proximosMes = new Date();
    proximosMes.setMonth(proximosMes.getMonth() + 1);

    const vencidas = facturas.filter(f => 
      new Date(f.fechaVencimiento) < hoy && f.estado !== EstadoFactura.PAGADA
    );
    const porVencer = facturas.filter(f => 
      new Date(f.fechaVencimiento) >= hoy && 
      new Date(f.fechaVencimiento) <= proximosMes &&
      f.estado !== EstadoFactura.PAGADA
    );
    const vigentes = facturas.filter(f => 
      new Date(f.fechaVencimiento) > proximosMes &&
      f.estado !== EstadoFactura.PAGADA
    );

    return {
      vencidas: {
        cantidad: vencidas.length,
        monto: vencidas.reduce((sum, f) => sum + f.montoTotal, 0),
      },
      porVencer: {
        cantidad: porVencer.length,
        monto: porVencer.reduce((sum, f) => sum + f.montoTotal, 0),
      },
      vigentes: {
        cantidad: vigentes.length,
        monto: vigentes.reduce((sum, f) => sum + f.montoTotal, 0),
      },
    };
  }

  private groupByCliente(facturas: Facturacion[]): Array<{
    clienteId: string;
    clienteNombre: string;
    cantidad: number;
    monto: number;
  }> {
    const clientesMap = facturas.reduce((acc, factura) => {
      const clienteId = factura.clienteId;
      if (!acc[clienteId]) {
        acc[clienteId] = {
          clienteId,
          clienteNombre: factura.cliente?.nombres || 'Cliente sin nombre',
          cantidad: 0,
          monto: 0,
        };
      }
      acc[clienteId].cantidad++;
      acc[clienteId].monto += factura.total;
      return acc;
    }, {});

    return (Object.values(clientesMap) as { clienteId: string; clienteNombre: string; cantidad: number; monto: number; }[])
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10); // Top 10 clientes
  }

  private generatePDFReport(facturas: Facturacion[]): Buffer {
    // Implementación de generación de PDF
    // Esto requeriría una librería como puppeteer o jsPDF
    throw new Error('Generación de PDF no implementada');
  }

  private generateExcelReport(facturas: Facturacion[]): Buffer {
    // Implementación de generación de Excel
    // Esto requeriría una librería como exceljs
    throw new Error('Generación de Excel no implementada');
  }
}
