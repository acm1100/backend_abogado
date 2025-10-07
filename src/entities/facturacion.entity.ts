import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Usuario } from './usuario.entity';
import { Cliente } from './cliente.entity';
import { Caso } from './caso.entity';
import { Proyecto } from './proyecto.entity';
import { Empresa } from './empresa.entity';

export enum TipoFactura {
  FACTURA = 'FACTURA',
  BOLETA = 'BOLETA',
  NOTA_CREDITO = 'NOTA_CREDITO',
  NOTA_DEBITO = 'NOTA_DEBITO',
  RECIBO_HONORARIOS = 'RECIBO_HONORARIOS',
  FACTURA_ELECTRONICA = 'FACTURA_ELECTRONICA'
}

export enum EstadoFactura {
  BORRADOR = 'BORRADOR',
  EMITIDA = 'EMITIDA',
  ENVIADA = 'ENVIADA',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  ANULADA = 'ANULADA',
  RECHAZADA = 'RECHAZADA'
}

export enum MonedaFactura {
  PEN = 'PEN',
  USD = 'USD',
  EUR = 'EUR'
}

export enum TipoServicio {
  ASESORIA_LEGAL = 'ASESORIA_LEGAL',
  REPRESENTACION_JUDICIAL = 'REPRESENTACION_JUDICIAL',
  REDACCION_CONTRATOS = 'REDACCION_CONTRATOS',
  CONSTITUCION_EMPRESAS = 'CONSTITUCION_EMPRESAS',
  GESTION_TRIBUTARIA = 'GESTION_TRIBUTARIA',
  CONSULTA_LEGAL = 'CONSULTA_LEGAL',
  OTRO = 'OTRO'
}

@Entity('facturacion')
export class Facturacion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  numeroFactura: string;

  @Column({ type: 'varchar', length: 10 })
  serie: string;

  @Column({ type: 'integer' })
  numero: number;

  @Column({ type: 'enum', enum: TipoFactura })
  tipoFactura: TipoFactura;

  @Column({ type: 'enum', enum: EstadoFactura, default: EstadoFactura.BORRADOR })
  estado: EstadoFactura;

  @Column({ type: 'enum', enum: MonedaFactura, default: MonedaFactura.PEN })
  moneda: MonedaFactura;

  @Column({ type: 'date' })
  fechaEmision: Date;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

  @Column({ type: 'date', nullable: true })
  fechaPago: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  igv: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 18.00 })
  porcentajeIgv: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porcentajeDescuento: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'text', nullable: true })
  condicionesPago: string;

  @Column({ type: 'jsonb', nullable: true })
  datosCliente: {
    razonSocial: string;
    numeroDocumento: string;
    tipoDocumento: 'RUC' | 'DNI';
    direccion: string;
    telefono?: string;
    email?: string;
  };

  @Column({ type: 'jsonb' })
  detalleItems: Array<{
    codigo?: string;
    descripcion: string;
    cantidad: number;
    unidadMedida: string;
    precioUnitario: number;
    tipoServicio: TipoServicio;
    descuento?: number;
    subtotal: number;
    // Referencias opcionales
    casoId?: string;
    proyectoId?: string;
    horasTrabajadas?: number;
    fechaServicio?: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  datosSUNAT: {
    cdr?: string; // Comprobante de Recepción
    estadoSUNAT?: 'ACEPTADO' | 'RECHAZADO' | 'PENDIENTE';
    codigoRespuesta?: string;
    mensajeRespuesta?: string;
    fechaEnvio?: Date;
    hashCPE?: string;
    xmlFirmado?: string;
    pdfGenerado?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  configuracionFacturacion: {
    incluyeIgv: boolean;
    aplicaRetencion: boolean;
    porcentajeRetencion?: number;
    codigoMoneda: string;
    tipoOperacion: string;
    formaPago: 'CONTADO' | 'CREDITO';
    metodoPago?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  tracking: {
    fechaEnvioCliente?: Date;
    fechaVisualizacion?: Date;
    recordatoriosEnviados: number;
    ultimoRecordatorio?: Date;
    gestorCobranza?: string;
    estadoCobranza?: 'NORMAL' | 'GESTION' | 'JUDICIAL';
  };

  @Column({ type: 'uuid' })
  empresaId: string;

  @Column({ type: 'uuid' })
  clienteId: string;

  @Column({ type: 'uuid', nullable: true })
  casoId: string;

  @Column({ type: 'uuid', nullable: true })
  proyectoId: string;

  @Column({ type: 'uuid' })
  creadoPor: string;

  @Column({ type: 'uuid', nullable: true })
  aprobadoPor: string;

  @Column({ type: 'uuid', nullable: true })
  facturaRelacionadaId: string; // Para notas de crédito/débito

  // Relaciones
  @ManyToOne(() => Empresa, empresa => empresa.facturas)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @ManyToOne(() => Cliente, cliente => cliente.facturas)
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @ManyToOne(() => Caso, caso => caso.facturas, { nullable: true })
  @JoinColumn({ name: 'casoId' })
  caso: Caso;

  @ManyToOne(() => Proyecto, proyecto => proyecto.facturas, { nullable: true })
  @JoinColumn({ name: 'proyectoId' })
  proyecto: Proyecto;

  @ManyToOne(() => Usuario, usuario => usuario.facturasCreadas)
  @JoinColumn({ name: 'creadoPor' })
  creador: Usuario;

  @ManyToOne(() => Usuario, usuario => usuario.facturasAprobadas, { nullable: true })
  @JoinColumn({ name: 'aprobadoPor' })
  aprobador: Usuario;

  @ManyToOne(() => Facturacion, factura => factura.notasRelacionadas, { nullable: true })
  @JoinColumn({ name: 'facturaRelacionadaId' })
  facturaRelacionada: Facturacion;

  @OneToMany(() => Facturacion, factura => factura.facturaRelacionada)
  notasRelacionadas: Facturacion[];

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
