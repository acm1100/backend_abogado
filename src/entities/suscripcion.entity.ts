import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { Empresa } from './empresa.entity';

export enum EstadoSuscripcion {
  ACTIVA = 'activa',
  EXPIRADA = 'expirada',
  SUSPENDIDA = 'suspendida',
  CANCELADA = 'cancelada',
}

/**
 * Entidad para el control de suscripciones de las empresas
 * Maneja los diferentes planes y estados de pago
 */
@Entity('suscripciones')
@Index('idx_suscripciones_empresa', ['empresaId'])
@Index('idx_suscripciones_estado', ['estado'])
@Index('idx_suscripciones_fechas', ['fechaInicio', 'fechaFin'])
export class Suscripcion extends BaseEntity {
  @ApiProperty({
    description: 'ID de la empresa',
    format: 'uuid',
  })
  @Column({
    name: 'empresa_id',
    type: 'uuid',
    nullable: false,
  })
  empresaId: string;

  @ApiProperty({
    description: 'Tipo de suscripción',
    example: 'mensual',
    enum: ['mensual', 'trimestral', 'anual', 'personalizado'],
  })
  @Column({
    name: 'tipo_suscripcion',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Tipo de plan de suscripción',
  })
  tipoSuscripcion: string;

  @ApiProperty({
    description: 'Fecha de inicio de la suscripción',
    type: 'string',
    format: 'date-time',
  })
  @Column({
    name: 'fecha_inicio',
    type: 'timestamp',
    nullable: false,
    comment: 'Fecha de inicio de vigencia',
  })
  fechaInicio: Date;

  @ApiProperty({
    description: 'Fecha de fin de la suscripción',
    type: 'string',
    format: 'date-time',
  })
  @Column({
    name: 'fecha_fin',
    type: 'timestamp',
    nullable: false,
    comment: 'Fecha de fin de vigencia',
  })
  fechaFin: Date;

  @ApiProperty({
    description: 'Monto de la suscripción',
    example: 299.99,
    type: 'number',
  })
  @Column({
    name: 'monto',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    comment: 'Monto de la suscripción',
  })
  monto: number;

  @ApiProperty({
    description: 'Moneda del monto',
    example: 'PEN',
    default: 'PEN',
  })
  @Column({
    name: 'moneda',
    type: 'varchar',
    length: 3,
    default: 'PEN',
    comment: 'Código de moneda ISO 4217',
  })
  moneda: string;

  @ApiProperty({
    description: 'Estado de la suscripción',
    enum: EstadoSuscripcion,
    example: EstadoSuscripcion.ACTIVA,
  })
  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoSuscripcion,
    default: EstadoSuscripcion.ACTIVA,
    comment: 'Estado actual de la suscripción',
  })
  estado: EstadoSuscripcion;

  @ApiProperty({
    description: 'Método de pago utilizado',
    example: 'transferencia',
    required: false,
  })
  @Column({
    name: 'metodo_pago',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Método de pago utilizado',
  })
  metodoPago?: string;

  @ApiProperty({
    description: 'Número de factura asociada',
    example: 'F001-00000123',
    required: false,
  })
  @Column({
    name: 'numero_factura',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Número de factura del pago',
  })
  numeroFactura?: string;

  @ApiProperty({
    description: 'Notas adicionales',
    required: false,
  })
  @Column({
    name: 'notas',
    type: 'text',
    nullable: true,
    comment: 'Notas adicionales sobre la suscripción',
  })
  notas?: string;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Empresa a la que pertenece la suscripción',
    type: () => Empresa,
  })
  @ManyToOne(() => Empresa, (empresa) => empresa.suscripciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Verifica si la suscripción está activa y vigente
   */
  get estaActiva(): boolean {
    const ahora = new Date();
    return this.estado === EstadoSuscripcion.ACTIVA && 
           this.fechaInicio <= ahora && 
           this.fechaFin > ahora;
  }

  /**
   * Verifica si la suscripción está próxima a vencer (30 días)
   */
  get proximaAVencer(): boolean {
    const ahora = new Date();
    const treintaDias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.fechaFin <= treintaDias && this.fechaFin > ahora;
  }

  /**
   * Días restantes hasta el vencimiento
   */
  get diasRestantes(): number {
    const ahora = new Date();
    const diferencia = this.fechaFin.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
}
