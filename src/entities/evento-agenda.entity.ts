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
import { Caso } from './caso.entity';
import { Usuario } from './usuario.entity';
import { Empresa } from './empresa.entity';

export enum TipoEventoAgenda {
  AUDIENCIA = 'audiencia',
  REUNION = 'reunion',
  CITA = 'cita',
  VENCIMIENTO = 'vencimiento',
  RECORDATORIO = 'recordatorio',
  OTRO = 'otro',
}

export enum EstadoEventoAgenda {
  PROGRAMADO = 'programado',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

@Entity('eventos_agenda')
@Index(['empresaId', 'fechaInicio'])
@Index(['empresaId', 'casoId'])
@Index(['empresaId', 'usuarioId'])
export class EventoAgenda extends BaseEntity {

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: TipoEventoAgenda,
    default: TipoEventoAgenda.OTRO,
  })
  tipo: TipoEventoAgenda;

  @Column({
    type: 'enum',
    enum: EstadoEventoAgenda,
    default: EstadoEventoAgenda.PROGRAMADO,
  })
  estado: EstadoEventoAgenda;

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp' })
  fechaFin: Date;

  @Column({ type: 'boolean', default: false })
  esTodoDia: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ubicacion: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

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
  casoId: string;

  @ManyToOne(() => Caso, { nullable: true })
  @JoinColumn({ name: 'casoId' })
  caso: Caso;

  @Column({ type: 'uuid' })
  @Index()
  usuarioId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  // Métodos auxiliares
  get duracion(): number {
    return this.fechaFin.getTime() - this.fechaInicio.getTime();
  }

  get duracionEnHoras(): number {
    return this.duracion / (1000 * 60 * 60);
  }

  get esProximo(): boolean {
    const ahora = new Date();
    const unaHora = 60 * 60 * 1000;
    return this.fechaInicio.getTime() - ahora.getTime() <= unaHora && this.fechaInicio > ahora;
  }
}