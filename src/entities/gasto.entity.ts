import { BaseEntity } from './base.entity';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Cliente } from './cliente.entity';
import { Caso } from './caso.entity';
import { Empresa } from './empresa.entity';

export enum TipoGasto {
  OPERATIVO = 'operativo',
  MATERIAL_OFICINA = 'material_oficina',
  TRANSPORTE = 'transporte',
  COMUNICACIONES = 'comunicaciones',
  DOCUMENTACION = 'documentacion',
  TASAS_JUDICIALES = 'tasas_judiciales',
  HONORARIOS_TERCEROS = 'honorarios_terceros',
  VIATICOS = 'viaticos',
  SERVICIOS_PROFESIONALES = 'servicios_profesionales',
  TECNOLOGIA = 'tecnologia',
  MARKETING = 'marketing',
  CAPACITACION = 'capacitacion',
  OTROS = 'otros'
}

export enum EstadoGasto {
  BORRADOR = 'borrador',
  PENDIENTE = 'pendiente',
  PENDIENTE_APROBACION = 'pendiente_aprobacion',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  PAGADO = 'pagado',
  REEMBOLSADO = 'reembolsado',
  CANCELADO = 'cancelado'
}

export enum TipoComprobante {
  FACTURA = 'factura',
  BOLETA = 'boleta',
  RECIBO_HONORARIOS = 'recibo_honorarios',
  NOTA_DEBITO = 'nota_debito',
  NOTA_CREDITO = 'nota_credito',
  COMPROBANTE_RETENCION = 'comprobante_retencion',
  TICKET = 'ticket',
  RECIBO = 'recibo',
  OTROS = 'otros'
}

export enum MonedaGasto {
  PEN = 'PEN',
  USD = 'USD',
  EUR = 'EUR'
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  TARJETA_CREDITO = 'tarjeta_credito',
  TARJETA_DEBITO = 'tarjeta_debito',
  CHEQUE = 'cheque',
  DEPOSITO = 'deposito',
  OTROS = 'otros'
}

export enum CategoriaGasto {
  OPERATIVO = 'operativo',
  ADMINISTRATIVO = 'administrativo',
  LEGAL = 'legal',
  MARKETING = 'marketing',
  TECNOLOGIA = 'tecnologia',
  RECURSOS_HUMANOS = 'recursos_humanos',
  MATERIALES_OFICINA = 'materiales_oficina',
  OTROS = 'otros'
}

// Alias para compatibilidad
export const MetodoPagoGasto = MetodoPago;

@Entity('gastos')
@Index(['empresaId', 'fecha'])
@Index(['empresaId', 'tipo'])
@Index(['empresaId', 'estado'])
@Index(['usuarioId', 'fecha'])
@Index(['casoId'])
@Index(['clienteId'])
@Index(['numeroComprobante'])
export class Gasto extends BaseEntity {
  @Column({ length: 200 })
  concepto: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({
    type: 'enum',
    enum: TipoGasto,
    default: TipoGasto.OTROS
  })
  tipo: TipoGasto;

  @Column({
    type: 'enum',
    enum: CategoriaGasto,
    default: CategoriaGasto.OTROS
  })
  categoria: CategoriaGasto;

  @Column({
    type: 'enum',
    enum: EstadoGasto,
    default: EstadoGasto.BORRADOR
  })
  estado: EstadoGasto;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({
    type: 'enum',
    enum: MonedaGasto,
    default: MonedaGasto.PEN
  })
  moneda: MonedaGasto;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 1 })
  tipoCambio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoSoles?: number;

  @Column({
    type: 'enum',
    enum: TipoComprobante,
    nullable: true
  })
  tipoComprobante?: TipoComprobante;

  @Column({ length: 50, nullable: true })
  numeroComprobante?: string;

  @Column({ length: 11, nullable: true })
  rucProveedor?: string;

  @Column({ length: 200, nullable: true })
  nombreProveedor?: string;

  @Column({ type: 'date', nullable: true })
  fechaComprobante?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  igv?: number;

  @Column({ type: 'boolean', default: false })
  incluirIgv: boolean;

  @Column({ type: 'boolean', default: false })
  esFacturable: boolean;

  @Column({ type: 'boolean', default: false })
  esReembolsable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoReembolso?: number;

  @Column({
    type: 'enum',
    enum: MetodoPago,
    nullable: true
  })
  metodoPago?: MetodoPago;

  @Column({ length: 100, nullable: true })
  referenciaPago?: string;

  @Column({ type: 'json', nullable: true })
  archivosComprobante?: string[];

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'date', nullable: true })
  fechaAprobacion?: Date;

  @Column({ type: 'text', nullable: true })
  motivoRechazo?: string;

  @Column({ type: 'date', nullable: true })
  fechaPago?: Date;

  @Column({ type: 'date', nullable: true })
  fechaReembolso?: Date;

  @Column({ length: 100, nullable: true })
  numeroOperacionPago?: string;

  @Column({ type: 'json', nullable: true })
  centrosCosto?: string[];

  @Column({ type: 'json', nullable: true })
  etiquetas?: string[];

  @Column({ type: 'boolean', default: false })
  esRecurrente: boolean;

  @Column({ type: 'int', nullable: true })
  frecuenciaRecurrenciaDias?: number;

  @Column({ type: 'date', nullable: true })
  proximaFechaRecurrencia?: Date;

  @Column({ type: 'json', nullable: true })
  metadatos?: any;

  // Relaciones
  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente?: Cliente;

  @Column({ name: 'cliente_id', nullable: true })
  clienteId?: string;

  @ManyToOne(() => Caso, { nullable: true })
  @JoinColumn({ name: 'caso_id' })
  caso?: Caso;

  @Column({ name: 'caso_id', nullable: true })
  casoId?: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'aprobado_por_id' })
  aprobadoPor?: Usuario;

  @Column({ name: 'aprobado_por_id', nullable: true })
  aprobadoPorId?: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'pagado_por_id' })
  pagadoPor?: Usuario;

  @Column({ name: 'pagado_por_id', nullable: true })
  pagadoPorId?: string;
}
