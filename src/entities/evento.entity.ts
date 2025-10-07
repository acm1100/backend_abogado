import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Usuario } from './usuario.entity';
import { Caso } from './caso.entity';
import { Cliente } from './cliente.entity';
import { Empresa } from './empresa.entity';

export enum TipoEvento {
  AUDIENCIA = 'audiencia',
  REUNION = 'reunion',
  CITA = 'cita',
  VENCIMIENTO = 'vencimiento',
  RECORDATORIO = 'recordatorio',
  TAREA = 'tarea',
  LLAMADA = 'llamada',
  OTRO = 'otro',
}

export enum EstadoEvento {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  REPROGRAMADO = 'reprogramado',
}

export enum PrioridadEvento {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

@Entity('eventos')
@Index(['empresaId', 'fechaInicio'])
@Index(['empresaId', 'responsableId'])
@Index(['empresaId', 'casoId'])
@Index(['empresaId', 'clienteId'])
export class Evento extends BaseEntity {

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: TipoEvento,
    default: TipoEvento.OTRO,
  })
  tipo: TipoEvento;

  @Column({
    type: 'enum',
    enum: EstadoEvento,
    default: EstadoEvento.PENDIENTE,
  })
  estado: EstadoEvento;

  @Column({
    type: 'enum',
    enum: PrioridadEvento,
    default: PrioridadEvento.NORMAL,
  })
  prioridad: PrioridadEvento;

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp' })
  fechaFin: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFinalizacion: Date;

  @Column({ type: 'boolean', default: false })
  esTodoDia: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ubicacion: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'boolean', default: true })
  recordatorioActivo: boolean;

  @Column({ type: 'int', default: 15 })
  minutosRecordatorio: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'json', nullable: true })
  metadatos: Record<string, any>;

  // Relaciones
  @Column({ type: 'uuid' })
  @Index()
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  responsableId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'responsableId' })
  responsable: Usuario;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  casoId: string;

  @ManyToOne(() => Caso, { nullable: true })
  @JoinColumn({ name: 'casoId' })
  caso: Caso;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  clienteId: string;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  creadoPorId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'creadoPorId' })
  creadoPor: Usuario;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  modificadoPorId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'modificadoPorId' })
  modificadoPor: Usuario;



  // Métodos auxiliares
  get duracionEnMinutos(): number {
    if (!this.fechaInicio || !this.fechaFin) return 0;
    return Math.round((this.fechaFin.getTime() - this.fechaInicio.getTime()) / (1000 * 60));
  }

  get esVencido(): boolean {
    return this.fechaFin < new Date() && this.estado !== EstadoEvento.COMPLETADO;
  }

  get esProximo(): boolean {
    const ahora = new Date();
    const unDia = 24 * 60 * 60 * 1000;
    return this.fechaInicio.getTime() - ahora.getTime() <= unDia && this.fechaInicio > ahora;
  }

  get estadoVisualizacion(): string {
    if (this.esVencido) return 'vencido';
    if (this.esProximo) return 'proximo';
    if (this.estado === EstadoEvento.COMPLETADO) return 'completado';
    return this.estado;
  }
}
