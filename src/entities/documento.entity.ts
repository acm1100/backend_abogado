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
import { Cliente } from './cliente.entity';
import { Usuario } from './usuario.entity';
import { Empresa } from './empresa.entity';

export enum TipoDocumento {
  CONTRATO = 'contrato',
  DEMANDA = 'demanda',
  ESCRITO = 'escrito',
  SENTENCIA = 'sentencia',
  ACUERDO = 'acuerdo',
  PODER = 'poder',
  CERTIFICADO = 'certificado',
  INFORME = 'informe',
  CORREO = 'correo',
  OTRO = 'otro',
}

export enum EstadoDocumento {
  BORRADOR = 'borrador',
  REVISION = 'revision',
  APROBADO = 'aprobado',
  FIRMADO = 'firmado',
  ARCHIVADO = 'archivado',
}

@Entity('documentos')
@Index(['empresaId', 'casoId'])
@Index(['empresaId', 'clienteId'])
@Index(['empresaId', 'tipo'])
export class Documento extends BaseEntity {

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: TipoDocumento,
    default: TipoDocumento.OTRO,
  })
  tipo: TipoDocumento;

  @Column({
    type: 'enum',
    enum: EstadoDocumento,
    default: EstadoDocumento.BORRADOR,
  })
  estado: EstadoDocumento;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rutaArchivo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombreArchivo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  extension: string;

  @Column({ type: 'bigint', nullable: true })
  tamaño: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'json', nullable: true })
  metadatos: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hash: string;

  @Column({ type: 'int', default: 1 })
  version: number;

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

  @Column({ type: 'uuid', nullable: true })
  @Index()
  clienteId: string;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column({ type: 'uuid' })
  @Index()
  creadoPorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creadoPorId' })
  creadoPor: Usuario;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  modificadoPorId: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'modificadoPorId' })
  modificadoPor: Usuario;

  // Métodos auxiliares
  get tamañoFormateado(): string {
    if (!this.tamaño) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.tamaño) / Math.log(1024));
    return Math.round(this.tamaño / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  get esImagen(): boolean {
    return this.mimeType?.startsWith('image/') || false;
  }

  get esPDF(): boolean {
    return this.mimeType === 'application/pdf';
  }
}