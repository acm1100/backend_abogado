import { BaseEntity } from './base.entity';
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Caso } from './caso.entity';
import { Proyecto } from './proyecto.entity';
import { Empresa } from './empresa.entity';

export enum TipoFlujo {
  PROCESO_LEGAL = 'proceso_legal',
  PROCESO_ADMINISTRATIVO = 'proceso_administrativo',
  PROCESO_CORPORATIVO = 'proceso_corporativo',
  WORKFLOW_PERSONALIZADO = 'workflow_personalizado',
  TEMPLATE_STANDAR = 'template_standar'
}

export enum EstadoFlujo {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  EN_DESARROLLO = 'en_desarrollo',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado'
}

export enum TipoTarea {
  ACCION_MANUAL = 'accion_manual',
  DOCUMENTO = 'documento',
  REUNION = 'reunion',
  VENCIMIENTO = 'vencimiento',
  NOTIFICACION = 'notificacion',
  APROBACION = 'aprobacion',
  REVISION = 'revision',
  ENTREGA = 'entrega'
}

export enum EstadoTarea {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
  VENCIDA = 'vencida',
  CANCELADA = 'cancelada',
  BLOQUEADA = 'bloqueada'
}

export enum PrioridadTarea {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
  URGENTE = 'urgente'
}

@Entity('flujos_trabajo')
@Index(['empresaId', 'tipo'])
@Index(['empresaId', 'estado'])
@Index(['empresaId', 'fechaCreacion'])
export class FlujoTrabajo extends BaseEntity {
  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({
    type: 'enum',
    enum: TipoFlujo,
    default: TipoFlujo.WORKFLOW_PERSONALIZADO
  })
  tipo: TipoFlujo;

  @Column({
    type: 'enum',
    enum: EstadoFlujo,
    default: EstadoFlujo.EN_DESARROLLO
  })
  estado: EstadoFlujo;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: false })
  esTemplate: boolean;

  @Column({ type: 'boolean', default: true })
  esPublico: boolean;

  @Column({ type: 'int', default: 0 })
  numeroUsos: number;

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({ length: 100, nullable: true })
  icono?: string;

  @Column({ type: 'text', nullable: true })
  tags?: string;

  @Column({ type: 'json', nullable: true })
  metadatos?: any;

  // Campos adicionales requeridos por los servicios
  @Column({ type: 'uuid', nullable: true })
  usuarioCreador?: string;

  @Column({ type: 'jsonb', nullable: true })
  pasos?: any[];

  @Column({ type: 'jsonb', nullable: true })
  triggers?: any[];

  @Column({ type: 'int', default: 1 })
  prioridad: number;

  @Column({ type: 'jsonb', nullable: true })
  configuracion?: any;

  @Column({ type: 'text', nullable: true })
  etiquetas?: string;

  @Column({ type: 'jsonb', nullable: true })
  administradores?: string[];

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fechaInicio?: Date;

  @Column({ type: 'jsonb', nullable: true })
  ejecuciones?: any[];

  // Relaciones
  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: Usuario;

  @Column({ name: 'creado_por_id' })
  creadoPorId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'modificado_por_id' })
  modificadoPor?: Usuario;

  @Column({ name: 'modificado_por_id', nullable: true })
  modificadoPorId?: string;

  @OneToMany(() => TareaFlujo, tareaFlujo => tareaFlujo.flujoTrabajo, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  tareas: TareaFlujo[];

  @OneToMany(() => InstanciaFlujo, instancia => instancia.flujoTrabajo)
  instancias: InstanciaFlujo[];
}

@Entity('tareas_flujo')
@Index(['flujoTrabajoId', 'orden'])
@Index(['flujoTrabajoId', 'tipo'])
export class TareaFlujo extends BaseEntity {
  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({
    type: 'enum',
    enum: TipoTarea,
    default: TipoTarea.ACCION_MANUAL
  })
  tipo: TipoTarea;

  @Column({ type: 'int' })
  orden: number;

  @Column({ type: 'boolean', default: false })
  esObligatoria: boolean;

  @Column({ type: 'int', nullable: true })
  duracionEstimadaDias?: number;

  @Column({ type: 'int', nullable: true })
  duracionEstimadaHoras?: number;

  @Column({ type: 'json', nullable: true })
  configuracion?: any;

  @Column({ type: 'text', nullable: true })
  plantillaInstrucciones?: string;

  @Column({ type: 'json', nullable: true })
  dependencias?: string[];

  @Column({ type: 'json', nullable: true })
  condiciones?: any;

  @Column({ type: 'json', nullable: true })
  formularioCampos?: any;

  @Column({ type: 'json', nullable: true })
  notificaciones?: any;

  @Column({ type: 'boolean', default: false })
  requiereAprobacion: boolean;

  @Column({ type: 'json', nullable: true })
  rolesAprobadores?: string[];

  // Relaciones
  @ManyToOne(() => FlujoTrabajo, flujo => flujo.tareas, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'flujo_trabajo_id' })
  flujoTrabajo: FlujoTrabajo;

  @Column({ name: 'flujo_trabajo_id' })
  flujoTrabajoId: string;

  @OneToMany(() => EjecucionTarea, ejecucion => ejecucion.tareaFlujo)
  ejecuciones: EjecucionTarea[];
}

@Entity('instancias_flujo')
@Index(['flujoTrabajoId', 'estado'])
@Index(['casoId'])
@Index(['proyectoId'])
@Index(['empresaId', 'fechaInicio'])
export class InstanciaFlujo extends BaseEntity {
  @Column({ length: 200 })
  nombre: string;

  @Column({
    type: 'enum',
    enum: EstadoFlujo,
    default: EstadoFlujo.ACTIVO
  })
  estado: EstadoFlujo;

  @Column({ type: 'timestamp', nullable: true })
  fechaInicio?: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFinEstimada?: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFinReal?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porcentajeCompletado: number;

  @Column({ type: 'json', nullable: true })
  variables?: any;

  @Column({ type: 'text', nullable: true })
  comentarios?: string;

  @Column({
    type: 'enum',
    enum: PrioridadTarea,
    default: PrioridadTarea.MEDIA
  })
  prioridad: PrioridadTarea;

  // Relaciones
  @ManyToOne(() => FlujoTrabajo, flujo => flujo.instancias, {
    nullable: false
  })
  @JoinColumn({ name: 'flujo_trabajo_id' })
  flujoTrabajo: FlujoTrabajo;

  @Column({ name: 'flujo_trabajo_id' })
  flujoTrabajoId: string;

  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Caso, { nullable: true })
  @JoinColumn({ name: 'caso_id' })
  caso?: Caso;

  @Column({ name: 'caso_id', nullable: true })
  casoId?: string;

  @ManyToOne(() => Proyecto, { nullable: true })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto?: Proyecto;

  @Column({ name: 'proyecto_id', nullable: true })
  proyectoId?: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;

  @Column({ name: 'responsable_id' })
  responsableId: string;

  @OneToMany(() => EjecucionTarea, ejecucion => ejecucion.instanciaFlujo, {
    cascade: true
  })
  ejecucionesTareas: EjecucionTarea[];
}

@Entity('ejecuciones_tareas')
@Index(['instanciaFlujoId', 'tareaFlujoId'])
@Index(['instanciaFlujoId', 'estado'])
@Index(['asignadoAId', 'estado'])
@Index(['fechaVencimiento'])
export class EjecucionTarea extends BaseEntity {
  @Column({
    type: 'enum',
    enum: EstadoTarea,
    default: EstadoTarea.PENDIENTE
  })
  estado: EstadoTarea;

  @Column({ type: 'timestamp', nullable: true })
  fechaInicio?: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaVencimiento?: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaCompletado?: Date;

  @Column({ type: 'text', nullable: true })
  resultado?: string;

  @Column({ type: 'json', nullable: true })
  datosFormulario?: any;

  @Column({ type: 'text', nullable: true })
  comentarios?: string;

  @Column({ type: 'int', nullable: true })
  horasReales?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porcentajeCompletado: number;

  @Column({
    type: 'enum',
    enum: PrioridadTarea,
    default: PrioridadTarea.MEDIA
  })
  prioridad: PrioridadTarea;

  @Column({ type: 'json', nullable: true })
  archivosAdjuntos?: string[];

  @Column({ type: 'boolean', default: false })
  requiereRevision: boolean;

  @Column({ type: 'boolean', default: false })
  esAprobada: boolean;

  @Column({ type: 'text', nullable: true })
  motivoRechazo?: string;

  // Relaciones
  @ManyToOne(() => InstanciaFlujo, instancia => instancia.ejecucionesTareas, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'instancia_flujo_id' })
  instanciaFlujo: InstanciaFlujo;

  @Column({ name: 'instancia_flujo_id' })
  instanciaFlujoId: string;

  @ManyToOne(() => TareaFlujo, tarea => tarea.ejecuciones, {
    nullable: false
  })
  @JoinColumn({ name: 'tarea_flujo_id' })
  tareaFlujo: TareaFlujo;

  @Column({ name: 'tarea_flujo_id' })
  tareaFlujoId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'asignado_a_id' })
  asignadoA?: Usuario;

  @Column({ name: 'asignado_a_id', nullable: true })
  asignadoAId?: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'completado_por_id' })
  completadoPor?: Usuario;

  @Column({ name: 'completado_por_id', nullable: true })
  completadoPorId?: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'aprobado_por_id' })
  aprobadoPor?: Usuario;

  @Column({ name: 'aprobado_por_id', nullable: true })
  aprobadoPorId?: string;
}
