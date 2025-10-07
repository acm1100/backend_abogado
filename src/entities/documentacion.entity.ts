import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Usuario } from './usuario.entity';
import { Cliente } from './cliente.entity';
import { Caso } from './caso.entity';
import { Proyecto } from './proyecto.entity';
import { Empresa } from './empresa.entity';

export enum TipoDocumento {
  LEGAL = 'LEGAL',
  CONTRATO = 'CONTRATO',
  ESCRITURA = 'ESCRITURA',
  DEMANDA = 'DEMANDA',
  CONTESTACION = 'CONTESTACION',
  RECURSO = 'RECURSO',
  DICTAMEN = 'DICTAMEN',
  INFORME = 'INFORME',
  CARTA = 'CARTA',
  ACTA = 'ACTA',
  CERTIFICADO = 'CERTIFICADO',
  PODER = 'PODER',
  CONSTITUCION = 'CONSTITUCION',
  MODIFICACION = 'MODIFICACION',
  DISOLUCION = 'DISOLUCION',
  OTRO = 'OTRO'
}

export enum EstadoDocumento {
  BORRADOR = 'BORRADOR',
  REVISION = 'REVISION',
  APROBADO = 'APROBADO',
  PUBLICADO = 'PUBLICADO',
  RECHAZADO = 'RECHAZADO',
  FIRMADO = 'FIRMADO',
  VENCIDO = 'VENCIDO',
  ARCHIVADO = 'ARCHIVADO',
  ANULADO = 'ANULADO'
}

export enum CategoriaDocumento {
  LEGAL = 'LEGAL',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  FINANCIERO = 'FINANCIERO',
  COMERCIAL = 'COMERCIAL',
  LABORAL = 'LABORAL',
  TRIBUTARIO = 'TRIBUTARIO',
  SOCIETARIO = 'SOCIETARIO',
  INMOBILIARIO = 'INMOBILIARIO',
  DEMANDA = 'DEMANDA'
}

@Entity('documentacion')
export class Documentacion extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: TipoDocumento })
  tipo: TipoDocumento;

  @Column({ type: 'enum', enum: EstadoDocumento, default: EstadoDocumento.BORRADOR })
  estado: EstadoDocumento;

  @Column({ type: 'enum', enum: CategoriaDocumento })
  categoria: CategoriaDocumento;

  @Column({ type: 'varchar', length: 255 })
  nombreArchivo: string;

  @Column({ type: 'varchar', length: 500 })
  rutaArchivo: string;

  @Column({ type: 'varchar', length: 100 })
  tipoMime: string;

  @Column({ type: 'bigint' })
  tamanoArchivo: number;

  // Campo alias para compatibilidad
  get tamano(): number {
    return this.tamanoArchivo;
  }

  @Column({ type: 'varchar', length: 64, nullable: true })
  hashArchivo: string;

  // Campo alias para compatibilidad
  get hash(): string {
    return this.hashArchivo;
  }

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: false })
  esPlantilla: boolean;

  @Column({ type: 'boolean', default: false })
  requiereFirma: boolean;

  @Column({ type: 'boolean', default: false })
  esConfidencial: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadatos: {
    etiquetas?: string[];
    propiedades?: Record<string, any>;
    configuracionFirma?: {
      requiereFirmaDigital: boolean;
      signatarios: string[];
      ordenFirma?: number;
    };
    versionado?: {
      comentario: string;
      cambiosPrincipales: string[];
      versionAnterior?: string;
    };
    indexacion?: {
      contenidoExtraido: string;
      palabrasClave: string[];
      fechasRelevantes: Date[];
    };
  };

  @Column({ type: 'date', nullable: true })
  fechaVencimiento: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaFirma: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaArchivado: Date;

  // Campos adicionales requeridos por los servicios
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fechaModificacion: Date;

  @Column({ type: 'boolean', default: false })
  firmado: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigoInterno: string;

  @Column({ type: 'uuid', nullable: true })
  usuarioCreadorId: string;

  @Column({ type: 'uuid', nullable: true })
  aprobadoPor: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaAprobacion: Date;

  @Column({ type: 'jsonb', nullable: true })
  configuracion: {
    requiereFirma?: boolean;
    esPlantilla?: boolean;
    permiteVersionado?: boolean;
    acceso?: {
      publico?: boolean;
      equipoAsignado?: string[];
    };
  };

  @Column({ type: 'uuid' })
  empresaId: string;

  @Column({ type: 'uuid' })
  creadoPor: string;

  @Column({ type: 'uuid', nullable: true })
  clienteId: string;

  @Column({ type: 'uuid', nullable: true })
  casoId: string;

  @Column({ type: 'uuid', nullable: true })
  proyectoId: string;

  @Column({ type: 'uuid', nullable: true })
  plantillaId: string;

  @Column({ type: 'uuid', nullable: true })
  documentoPadreId: string;

  // Relaciones
  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creadoPor' })
  creador: Usuario;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @ManyToOne(() => Caso, { nullable: true })
  @JoinColumn({ name: 'casoId' })
  caso: Caso;

  @ManyToOne(() => Proyecto, { nullable: true })
  @JoinColumn({ name: 'proyectoId' })
  proyecto: Proyecto;

  @ManyToOne(() => Documentacion, documento => documento.versiones, { nullable: true })
  @JoinColumn({ name: 'plantillaId' })
  plantilla: Documentacion;

  @ManyToOne(() => Documentacion, documento => documento.versiones, { nullable: true })
  @JoinColumn({ name: 'documentoPadreId' })
  documentoPadre: Documentacion;

  @OneToMany(() => Documentacion, documento => documento.documentoPadre)
  versiones: Documentacion[];

  @OneToMany(() => Documentacion, documento => documento.plantilla)
  documentosGenerados: Documentacion[];

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
