import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { Empresa } from './empresa.entity';
import { Cliente } from './cliente.entity';
import { Usuario } from './usuario.entity';
import { Proyecto } from './proyecto.entity';
// Referencias dinámicas para evitar dependencias circulares

export enum EstadoCaso {
  ABIERTO = 'abierto',
  ACTIVO = 'activo',
  EN_PROCESO = 'en_proceso',
  PAUSADO = 'pausado',
  CERRADO = 'cerrado',
  RESUELTO = 'resuelto',
  ARCHIVADO = 'archivado',
}

export enum TipoCaso {
  CIVIL = 'civil',
  PENAL = 'penal',
  LABORAL = 'laboral',
  COMERCIAL = 'comercial',
  ADMINISTRATIVO = 'administrativo',
  CONSTITUCIONAL = 'constitucional',
  FAMILIAR = 'familiar',
  TRIBUTARIO = 'tributario',
  OTROS = 'otros',
}

export enum PrioridadCaso {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum InstanciaCaso {
  PRIMERA_INSTANCIA = 'primera_instancia',
  APELACION = 'apelacion',
  CASACION = 'casacion',
  TRIBUNAL_CONSTITUCIONAL = 'tribunal_constitucional',
}

/**
 * Entidad central para casos legales
 * Representa los casos jurídicos que maneja el despacho
 */
@Entity('casos')
@Unique('uk_casos_numero_empresa', ['numeroCaso', 'empresaId'])
@Index('idx_casos_empresa', ['empresaId'])
@Index('idx_casos_cliente', ['clienteId'])
@Index('idx_casos_estado', ['estado'])
@Index('idx_casos_responsable', ['responsableId'])
@Index('idx_casos_tipo', ['tipoCaso'])
@Index('idx_casos_fecha_apertura', ['fechaApertura'])
@Index('idx_casos_prioridad', ['prioridad'])
export class Caso extends BaseEntity {
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
    description: 'ID del cliente',
    format: 'uuid',
    required: false,
  })
  @Column({
    name: 'cliente_id',
    type: 'uuid',
    nullable: true,
  })
  clienteId?: string;

  @ApiProperty({
    description: 'Número único del caso dentro de la empresa',
    example: 'CASO-2024-001',
    maxLength: 50,
  })
  @Column({
    name: 'numero_caso',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Número único del caso dentro de la empresa',
  })
  numeroCaso: string;

  @ApiProperty({
    description: 'Título descriptivo del caso',
    example: 'Divorcio por Causal - García vs. López',
    maxLength: 255,
  })
  @Column({
    name: 'titulo',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Título descriptivo del caso',
  })
  titulo: string;

  @ApiProperty({
    description: 'Descripción detallada del caso',
    example: 'Proceso de divorcio por causal de conducta deshonrosa que hace insoportable la vida en común...',
    required: false,
  })
  @Column({
    name: 'descripcion',
    type: 'text',
    nullable: true,
    comment: 'Descripción detallada del caso',
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Tipo de caso legal',
    enum: TipoCaso,
    example: TipoCaso.CIVIL,
  })
  @Column({
    name: 'tipo_caso',
    type: 'enum',
    enum: TipoCaso,
    nullable: true,
    comment: 'Tipo de caso: civil, penal, laboral, comercial, etc.',
  })
  tipoCaso?: TipoCaso;

  @ApiProperty({
    description: 'Estado actual del caso',
    enum: EstadoCaso,
    example: EstadoCaso.ABIERTO,
  })
  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoCaso,
    default: EstadoCaso.ABIERTO,
    comment: 'Estado actual del caso',
  })
  estado: EstadoCaso;

  @ApiProperty({
    description: 'Prioridad del caso',
    enum: PrioridadCaso,
    example: PrioridadCaso.MEDIA,
  })
  @Column({
    name: 'prioridad',
    type: 'enum',
    enum: PrioridadCaso,
    default: PrioridadCaso.MEDIA,
    comment: 'Prioridad del caso',
  })
  prioridad: PrioridadCaso;

  @ApiProperty({
    description: 'Fecha de apertura del caso',
    type: 'string',
    format: 'date',
  })
  @Column({
    name: 'fecha_apertura',
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_DATE',
    comment: 'Fecha de apertura del caso',
  })
  fechaApertura: Date;

  @ApiProperty({
    description: 'Fecha de cierre del caso',
    type: 'string',
    format: 'date',
    required: false,
  })
  @Column({
    name: 'fecha_cierre',
    type: 'date',
    nullable: true,
    comment: 'Fecha de cierre del caso',
  })
  fechaCierre?: Date;

  @ApiProperty({
    description: 'ID del usuario responsable',
    format: 'uuid',
    required: false,
  })
  @Column({
    name: 'responsable_id',
    type: 'uuid',
    nullable: true,
  })
  responsableId?: string;

  @ApiProperty({
    description: 'Monto reclamado en el caso',
    example: 50000.00,
    required: false,
  })
  @Column({
    name: 'monto_reclamado',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Monto económico reclamado en el caso',
  })
  montoReclamado?: number;

  @ApiProperty({
    description: 'Monto obtenido/ganado en el caso',
    example: 35000.00,
    required: false,
  })
  @Column({
    name: 'monto_obtenido',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Monto económico obtenido en el caso',
  })
  montoObtenido?: number;

  @ApiProperty({
    description: 'Juzgado o tribunal donde se tramita',
    example: 'Juzgado de Familia de Lima',
    required: false,
  })
  @Column({
    name: 'juzgado',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Juzgado o tribunal donde se tramita el caso',
  })
  juzgado?: string;

  @ApiProperty({
    description: 'Número de expediente judicial',
    example: '12345-2024-0-1801-JR-FC-01',
    required: false,
  })
  @Column({
    name: 'numero_expediente',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Número de expediente en el sistema judicial',
  })
  numeroExpediente?: string;

  @ApiProperty({
    description: 'Materia específica del caso',
    example: 'Divorcio por Causal',
    required: false,
  })
  @Column({
    name: 'materia',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Materia específica del caso legal',
  })
  materia?: string;

  @ApiProperty({
    description: 'Instancia judicial actual',
    enum: InstanciaCaso,
    example: InstanciaCaso.PRIMERA_INSTANCIA,
    required: false,
  })
  @Column({
    name: 'instancia',
    type: 'enum',
    enum: InstanciaCaso,
    nullable: true,
    comment: 'Instancia judicial donde se encuentra el caso',
  })
  instancia?: InstanciaCaso;

  @ApiProperty({
    description: 'Probabilidad de éxito estimada (0-100%)',
    example: 75,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @Column({
    name: 'probabilidad_exito',
    type: 'integer',
    nullable: true,
    comment: 'Probabilidad de éxito estimada en porcentaje',
  })
  probabilidadExito?: number;

  @ApiProperty({
    description: 'Notas internas del caso',
    required: false,
  })
  @Column({
    name: 'notas_internas',
    type: 'text',
    nullable: true,
    comment: 'Notas internas del equipo legal',
  })
  notasInternas?: string;

  @ApiProperty({
    description: 'Cronología de eventos del caso',
    example: [
      {
        fecha: '2024-01-15',
        evento: 'Presentación de demanda',
        descripcion: 'Se presentó la demanda de divorcio ante el juzgado',
        responsable: 'Juan López'
      }
    ],
    required: false,
  })
  @Column({
    name: 'cronologia',
    type: 'jsonb',
    default: [],
    comment: 'Cronología de eventos importantes del caso',
  })
  cronologia: any[];

  @ApiProperty({
    description: 'ID del usuario asignado al caso',
    format: 'uuid',
    required: false,
  })
  @Column({
    name: 'usuario_id',
    type: 'uuid',
    nullable: true,
  })
  usuarioId?: string;

  @ApiProperty({
    description: 'Indica si el caso está activo',
    example: true,
  })
  @Column({
    name: 'activo',
    type: 'boolean',
    default: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha límite del caso',
    type: 'string',
    format: 'date',
    required: false,
  })
  @Column({
    name: 'fecha_limite',
    type: 'date',
    nullable: true,
  })
  fechaLimite?: Date;

  @ApiProperty({
    description: 'Código interno del caso',
    example: 'CAS-2024-001',
    required: false,
  })
  @Column({
    name: 'codigo_interno',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  codigoInterno?: string;

  @ApiProperty({
    description: 'Configuración específica del caso',
    required: false,
  })
  @Column({
    name: 'configuracion',
    type: 'jsonb',
    nullable: true,
  })
  configuracion?: any;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Empresa a la que pertenece el caso',
    type: () => Empresa,
  })
  @ManyToOne(() => Empresa, (empresa) => empresa.casos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ApiProperty({
    description: 'Cliente del caso',
    type: () => Cliente,
    required: false,
  })
  @ManyToOne(() => Cliente, (cliente) => cliente.casos, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente?: Cliente;

  @ApiProperty({
    description: 'Usuario responsable del caso',
    type: () => Usuario,
    required: false,
  })
  @ManyToOne(() => Usuario, (usuario) => usuario.casosAsignados, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'responsable_id' })
  responsable?: Usuario;

  @ApiProperty({
    description: 'Proyectos asociados al caso',
    type: () => [Proyecto],
  })
  @OneToMany(() => Proyecto, (proyecto) => proyecto.caso)
  proyectos: Proyecto[];

  @ApiProperty({
    description: 'Registros de tiempo del caso',
    type: () => Array,
  })
  @OneToMany('RegistroTiempo', 'caso')
  registrosTiempo: any[];

  @ApiProperty({
    description: 'Documentos del caso',
    type: () => Array,
  })
  @OneToMany('Documento', 'caso')
  documentos: any[];

  @ApiProperty({
    description: 'Eventos de agenda relacionados',
    type: () => Array,
  })
  @OneToMany('EventoAgenda', 'caso')
  eventos: any[];

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Verifica si el caso está activo
   */
  get estaActivo(): boolean {
    return this.activo && (this.estado === EstadoCaso.ABIERTO || this.estado === EstadoCaso.EN_PROCESO);
  }

  /**
   * Verifica si el caso está cerrado
   */
  get estaCerrado(): boolean {
    return this.estado === EstadoCaso.CERRADO || this.estado === EstadoCaso.ARCHIVADO;
  }

  /**
   * Verifica si es un caso urgente
   */
  get esUrgente(): boolean {
    return this.prioridad === PrioridadCaso.URGENTE;
  }

  /**
   * Días transcurridos desde la apertura
   */
  get diasTranscurridos(): number {
    const hoy = new Date();
    const diferencia = hoy.getTime() - this.fechaApertura.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Duración del caso en días (si está cerrado)
   */
  get duracionDias(): number | null {
    if (!this.fechaCierre) return null;
    
    const diferencia = this.fechaCierre.getTime() - this.fechaApertura.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Porcentaje de éxito obtenido vs reclamado
   */
  get porcentajeExito(): number | null {
    if (!this.montoReclamado || !this.montoObtenido) return null;
    if (this.montoReclamado === 0) return null;
    
    return Math.round((this.montoObtenido / this.montoReclamado) * 100);
  }

  /**
   * Agrega un evento a la cronología
   */
  agregarEventoCronologia(evento: string, descripcion: string, responsable: string): void {
    const nuevoEvento = {
      fecha: new Date().toISOString().split('T')[0],
      evento,
      descripcion,
      responsable,
      timestamp: new Date().toISOString(),
    };

    this.cronologia = [...(this.cronologia || []), nuevoEvento];
  }

  /**
   * Cierra el caso con fecha y monto obtenido
   */
  cerrarCaso(montoObtenido?: number): void {
    this.estado = EstadoCaso.CERRADO;
    this.fechaCierre = new Date();
    
    if (montoObtenido !== undefined) {
      this.montoObtenido = montoObtenido;
    }

    this.agregarEventoCronologia(
      'Cierre de caso',
      `Caso cerrado${montoObtenido ? ` con monto obtenido: ${montoObtenido}` : ''}`,
      'Sistema'
    );
  }

  /**
   * Archiva el caso
   */
  archivarCaso(motivo?: string): void {
    this.estado = EstadoCaso.ARCHIVADO;
    
    this.agregarEventoCronologia(
      'Archivado',
      motivo || 'Caso archivado',
      'Sistema'
    );
  }

  /**
   * Actualiza la probabilidad de éxito
   */
  actualizarProbabilidad(nuevaProbabilidad: number, motivo?: string): void {
    const probabilidadAnterior = this.probabilidadExito;
    this.probabilidadExito = Math.max(0, Math.min(100, nuevaProbabilidad));
    
    this.agregarEventoCronologia(
      'Actualización de probabilidad',
      `Probabilidad actualizada de ${probabilidadAnterior}% a ${this.probabilidadExito}%${motivo ? `: ${motivo}` : ''}`,
      'Sistema'
    );
  }

  /**
   * Nombre para mostrar del caso
   */
  get nombreDisplay(): string {
    return `${this.numeroCaso} - ${this.titulo}`;
  }

  /**
   * Estado con formato legible
   */
  get estadoDisplay(): string {
    const estados = {
      [EstadoCaso.ABIERTO]: 'Abierto',
      [EstadoCaso.ACTIVO]: 'Activo',
      [EstadoCaso.EN_PROCESO]: 'En Proceso',
      [EstadoCaso.PAUSADO]: 'Pausado',
      [EstadoCaso.CERRADO]: 'Cerrado',
      [EstadoCaso.RESUELTO]: 'Resuelto',
      [EstadoCaso.ARCHIVADO]: 'Archivado',
    };
    
    return estados[this.estado] || this.estado;
  }

  /**
   * Prioridad con formato legible
   */
  get prioridadDisplay(): string {
    const prioridades = {
      [PrioridadCaso.BAJA]: 'Baja',
      [PrioridadCaso.MEDIA]: 'Media',
      [PrioridadCaso.ALTA]: 'Alta',
      [PrioridadCaso.URGENTE]: 'Urgente',
    };
    
    return prioridades[this.prioridad] || this.prioridad;
  }

  /**
   * Total de horas trabajadas en el caso
   */
  get totalHorasTrabajadas(): number {
    return this.registrosTiempo?.reduce((total, registro) => total + (registro.duracionHoras || 0), 0) ?? 0;
  }

  /**
   * Total facturado del caso
   */
  get totalFacturado(): number {
    return this.registrosTiempo?.reduce((total, registro) => total + (registro.montoCalculado || 0), 0) ?? 0;
  }
}
