import { BaseEntity } from './base.entity';
import { Entity, Column, ManyToOne, OneToMany, ManyToMany, JoinColumn, JoinTable, Index } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Cliente } from './cliente.entity';
import { Caso } from './caso.entity';
import { Empresa } from './empresa.entity';

export enum TipoProyecto {
  CONSULTORIA = 'consultoria',
  LITIGIO = 'litigio',
  TRANSACCIONAL = 'transaccional',
  COMPLIANCE = 'compliance',
  CORPORATIVO = 'corporativo',
  INMOBILIARIO = 'inmobiliario',
  LABORAL = 'laboral',
  TRIBUTARIO = 'tributario',
  PENAL = 'penal',
  ADMINISTRATIVO = 'administrativo',
  OTROS = 'otros'
}

export enum EstadoProyecto {
  PLANIFICACION = 'planificacion',
  EN_PROGRESO = 'en_progreso',
  EN_REVISION = 'en_revision',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  FACTURADO = 'facturado'
}

export enum PrioridadProyecto {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
  URGENTE = 'urgente'
}

export enum MetodologiaProyecto {
  TRADICIONAL = 'tradicional',
  AGIL = 'agil',
  KANBAN = 'kanban',
  SCRUM = 'scrum',
  PERSONALIZADA = 'personalizada'
}

export enum TipoFacturacion {
  HORA_FIJA = 'hora_fija',
  MONTO_FIJO = 'monto_fijo',
  CONTINGENCIA = 'contingencia',
  MIXTO = 'mixto',
  NO_FACTURABLE = 'no_facturable'
}

@Entity('proyectos')
@Index(['empresaId', 'estado'])
@Index(['empresaId', 'fechaInicio'])
@Index(['empresaId', 'fechaVencimiento'])
@Index(['clienteId'])
@Index(['responsableId'])
@Index(['codigo'], { unique: true })
export class Proyecto extends BaseEntity {
  @Column({ length: 20, unique: true })
  codigo: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({
    type: 'enum',
    enum: TipoProyecto,
    default: TipoProyecto.OTROS
  })
  tipo: TipoProyecto;

  @Column({
    type: 'enum',
    enum: EstadoProyecto,
    default: EstadoProyecto.PLANIFICACION
  })
  estado: EstadoProyecto;

  @Column({
    type: 'enum',
    enum: PrioridadProyecto,
    default: PrioridadProyecto.MEDIA
  })
  prioridad: PrioridadProyecto;

  @Column({
    type: 'enum',
    enum: MetodologiaProyecto,
    default: MetodologiaProyecto.TRADICIONAL
  })
  metodologia: MetodologiaProyecto;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento?: Date;

  @Column({ type: 'date', nullable: true })
  fechaFinalizacion?: Date;

  @Column({ type: 'int', nullable: true })
  duracionEstimadaDias?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porcentajeCompletado: number;

  @Column({
    type: 'enum',
    enum: TipoFacturacion,
    default: TipoFacturacion.HORA_FIJA
  })
  tipoFacturacion: TipoFacturacion;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  presupuestoEstimado?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  presupuestoAprobado?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoReal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ingresoFacturado: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  tarifaHora?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentajeContingencia?: number;

  @Column({ type: 'int', default: 0 })
  horasEstimadas: number;

  @Column({ type: 'int', default: 0 })
  horasReales: number;

  @Column({ type: 'boolean', default: true })
  esFacturable: boolean;

  @Column({ type: 'boolean', default: false })
  requiereAprobacion: boolean;

  @Column({ type: 'json', nullable: true })
  objetivos?: string[];

  @Column({ type: 'json', nullable: true })
  entregables?: any[];

  @Column({ type: 'json', nullable: true })
  riesgos?: any[];

  @Column({ type: 'json', nullable: true })
  restricciones?: string[];

  @Column({ type: 'json', nullable: true })
  criteriosAceptacion?: string[];

  @Column({ type: 'text', nullable: true })
  alcance?: string;

  @Column({ type: 'text', nullable: true })
  exclusiones?: string;

  @Column({ type: 'json', nullable: true })
  documentosReferencia?: string[];

  @Column({ type: 'json', nullable: true })
  etiquetas?: string[];

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({ length: 100, nullable: true })
  icono?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'json', nullable: true })
  configuracionNotificaciones?: any;

  @Column({ type: 'json', nullable: true })
  metadatos?: any;

  // Campos de seguimiento
  @Column({ type: 'date', nullable: true })
  fechaUltimaActividad?: Date;

  @Column({ type: 'int', default: 0 })
  numeroTareasCompletadas: number;

  @Column({ type: 'int', default: 0 })
  numeroTareasTotales: number;

  @Column({ type: 'int', default: 0 })
  numeroCasosAsociados: number;

  @Column({ type: 'int', default: 0 })
  numeroDocumentosGenerados: number;

  // Relaciones
  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Cliente, { nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'cliente_id' })
  clienteId: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;

  @Column({ name: 'responsable_id' })
  responsableId: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: Usuario;

  @Column({ name: 'creado_por_id' })
  creadoPorId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'aprobado_por_id' })
  aprobadoPor?: Usuario;

  @Column({ name: 'aprobado_por_id', nullable: true })
  aprobadoPorId?: string;

  @ManyToMany(() => Usuario, { cascade: false })
  @JoinTable({
    name: 'proyecto_miembros',
    joinColumn: { name: 'proyecto_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'usuario_id', referencedColumnName: 'id' }
  })
  miembros: Usuario[];

  @OneToMany(() => Caso, caso => caso.proyecto)
  casos: Caso[];

  @OneToMany(() => TareaProyecto, tarea => tarea.proyecto, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  tareas: TareaProyecto[];

  @OneToMany(() => HitoProyecto, hito => hito.proyecto, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  hitos: HitoProyecto[];
}

@Entity('tareas_proyecto')
@Index(['proyectoId', 'estado'])
@Index(['proyectoId', 'fechaVencimiento'])
@Index(['asignadoAId', 'estado'])
export class TareaProyecto extends BaseEntity {
  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({
    type: 'enum',
    enum: EstadoProyecto,
    default: EstadoProyecto.PLANIFICACION
  })
  estado: EstadoProyecto;

  @Column({
    type: 'enum',
    enum: PrioridadProyecto,
    default: PrioridadProyecto.MEDIA
  })
  prioridad: PrioridadProyecto;

  @Column({ type: 'date', nullable: true })
  fechaInicio?: Date;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento?: Date;

  @Column({ type: 'date', nullable: true })
  fechaCompletado?: Date;

  @Column({ type: 'int', nullable: true })
  horasEstimadas?: number;

  @Column({ type: 'int', default: 0 })
  horasReales: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porcentajeCompletado: number;

  @Column({ type: 'json', nullable: true })
  dependencias?: string[];

  @Column({ type: 'json', nullable: true })
  etiquetas?: string[];

  @Column({ type: 'json', nullable: true })
  archivosAdjuntos?: string[];

  @Column({ type: 'text', nullable: true })
  comentarios?: string;

  // Relaciones
  @ManyToOne(() => Proyecto, proyecto => proyecto.tareas, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @Column({ name: 'proyecto_id' })
  proyectoId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'asignado_a_id' })
  asignadoA?: Usuario;

  @Column({ name: 'asignado_a_id', nullable: true })
  asignadoAId?: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: Usuario;

  @Column({ name: 'creado_por_id' })
  creadoPorId: string;
}

@Entity('hitos_proyecto')
@Index(['proyectoId', 'fecha'])
export class HitoProyecto extends BaseEntity {
  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'boolean', default: false })
  esCompletado: boolean;

  @Column({ type: 'date', nullable: true })
  fechaCompletado?: Date;

  @Column({ type: 'json', nullable: true })
  criteriosCompletitud?: string[];

  @Column({ type: 'json', nullable: true })
  entregables?: string[];

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  // Relaciones
  @ManyToOne(() => Proyecto, proyecto => proyecto.hitos, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: Proyecto;

  @Column({ name: 'proyecto_id' })
  proyectoId: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: Usuario;

  @Column({ name: 'creado_por_id' })
  creadoPorId: string;
}
