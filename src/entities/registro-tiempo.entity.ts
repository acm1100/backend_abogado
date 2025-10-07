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
import { Proyecto } from './proyecto.entity';
import { Empresa } from './empresa.entity';

export enum EstadoRegistroTiempo {
  BORRADOR = 'borrador',
  PENDIENTE_APROBACION = 'pendiente_aprobacion',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  FACTURADO = 'facturado',
}

export enum TipoActividad {
  REUNION = 'reunion',
  INVESTIGACION = 'investigacion',
  REDACCION = 'redaccion',
  REVISION = 'revision',
  LLAMADA = 'llamada',
  AUDIENCIA = 'audiencia',
  VIAJE = 'viaje',
  ADMINISTRACION = 'administracion',
  OTROS = 'otros',
}

@Entity('registros_tiempo')
@Index(['empresaId', 'fecha'])
@Index(['empresaId', 'usuarioId'])
@Index(['empresaId', 'casoId'])
@Index(['empresaId', 'proyectoId'])
export class RegistroTiempo extends BaseEntity {

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  horaInicio: string;

  @Column({ type: 'time' })
  horaFin: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  horas: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  duracionHoras: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  horasFacturables: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: TipoActividad,
    default: TipoActividad.OTROS,
  })
  tipoActividad: TipoActividad;

  @Column({
    type: 'enum',
    enum: EstadoRegistroTiempo,
    default: EstadoRegistroTiempo.BORRADOR,
  })
  estado: EstadoRegistroTiempo;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tarifaHora: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoTotal: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  moneda: string;

  @Column({ type: 'boolean', default: true })
  esFacturable: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'json', nullable: true })
  metadatos: Record<string, any>;

  // Relaciones
  @Column({ type: 'uuid' })
  @Index()
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  @Index()
  usuarioId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

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
  proyectoId: string;

  @ManyToOne(() => Proyecto, { nullable: true })
  @JoinColumn({ name: 'proyectoId' })
  proyecto: Proyecto;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  aprobadoPorId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'aprobadoPorId' })
  aprobadoPor: Usuario;

  @Column({ type: 'timestamp', nullable: true })
  fechaAprobacion: Date;

  @Column({ type: 'text', nullable: true })
  motivoRechazo: string;

  // Métodos auxiliares
  get duracionEnMinutos(): number {
    if (!this.horaInicio || !this.horaFin) return 0;
    const [horaI, minI] = this.horaInicio.split(':').map(Number);
    const [horaF, minF] = this.horaFin.split(':').map(Number);
    const inicioMin = horaI * 60 + minI;
    const finMin = horaF * 60 + minF;
    return finMin - inicioMin;
  }

  get esValidoParaFacturacion(): boolean {
    return this.esFacturable && this.estado === EstadoRegistroTiempo.APROBADO;
  }

  get montoCalculado(): number {
    if (!this.tarifaHora || !this.horasFacturables) return 0;
    return this.tarifaHora * this.horasFacturables;
  }
}