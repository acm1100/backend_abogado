import {
  Entity,
  Column,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { Usuario } from './usuario.entity';
import { Cliente } from './cliente.entity';
import { Caso } from './caso.entity';
import { Proyecto } from './proyecto.entity';
// import { Factura } from './factura.entity';
// import { Documento } from './documento.entity';
import { Suscripcion } from './suscripcion.entity';
import { Rol } from './rol.entity';

export enum TipoEmpresa {
  ESTUDIO_JURIDICO = 'estudio_juridico',
  BUFETE = 'bufete',
  BUFETE_JURIDICO = 'bufete_juridico',
  DEPARTAMENTO_LEGAL = 'departamento_legal',
  CONSULTORIA = 'consultoria',
  OTRO = 'otro',
}

export enum EstadoSuscripcion {
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
  SUSPENDIDA = 'suspendida',
  CANCELADA = 'cancelada',
}

/**
 * Entidad principal para multi-tenancy
 * Cada empresa es un tenant independiente con sus propios datos
 */
@Entity('empresas')
@Index('idx_empresas_ruc', ['ruc'])
@Index('idx_empresas_activo', ['activo'])
@Check('chk_ruc_valido', `validar_ruc_peruano(ruc)`)
export class Empresa extends BaseEntity {
  @ApiProperty({
    description: 'Razón social de la empresa',
    example: 'Estudio Jurídico López & Asociados S.A.C.',
    maxLength: 255,
  })
  @Column({
    name: 'razon_social',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Razón social de la empresa',
  })
  razonSocial: string;

  @ApiProperty({
    description: 'RUC de la empresa (11 dígitos)',
    example: '20123456789',
    pattern: '^[0-9]{11}$',
  })
  @Column({
    name: 'ruc',
    type: 'varchar',
    length: 11,
    unique: true,
    nullable: false,
    comment: 'RUC de la empresa (validado con dígito verificador)',
  })
  ruc: string;

  @ApiProperty({
    description: 'Dirección fiscal de la empresa',
    example: 'Av. Javier Prado Este 492, San Isidro, Lima',
    required: false,
  })
  @Column({
    name: 'direccion',
    type: 'text',
    nullable: true,
    comment: 'Dirección fiscal de la empresa',
  })
  direccion?: string;

  @ApiProperty({
    description: 'Teléfono principal',
    example: '+51 1 234-5678',
    required: false,
  })
  @Column({
    name: 'telefono',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Teléfono principal de contacto',
  })
  telefono?: string;

  @ApiProperty({
    description: 'Email principal de contacto',
    example: 'contacto@estudio-lopez.com',
    required: false,
  })
  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Email principal de contacto',
  })
  email?: string;

  @ApiProperty({
    description: 'URL del logo de la empresa',
    example: 'https://storage.company.com/logos/empresa-logo.png',
    required: false,
  })
  @Column({
    name: 'logo_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL del logo de la empresa para reportes y facturas',
  })
  logoUrl?: string;

  @ApiProperty({
    description: 'Color primario para la interfaz (hex)',
    example: '#2563eb',
    default: '#2563eb',
  })
  @Column({
    name: 'colores_primario',
    type: 'varchar',
    length: 7,
    default: '#2563eb',
    comment: 'Color primario en formato hexadecimal para personalización',
  })
  coloresPrimario: string;

  @ApiProperty({
    description: 'Color secundario para la interfaz (hex)',
    example: '#64748b',
    default: '#64748b',
  })
  @Column({
    name: 'colores_secundario',
    type: 'varchar',
    length: 7,
    default: '#64748b',
    comment: 'Color secundario en formato hexadecimal',
  })
  coloresSecundario: string;

  @ApiProperty({
    description: 'Zona horaria de la empresa',
    example: 'America/Lima',
    default: 'America/Lima',
  })
  @Column({
    name: 'zona_horaria',
    type: 'varchar',
    length: 50,
    default: 'America/Lima',
    comment: 'Zona horaria para fechas y horas',
  })
  zonaHoraria: string;

  @ApiProperty({
    description: 'Moneda predeterminada',
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
    description: 'Configuración flexible en formato JSON',
    example: {
      facturacionElectronica: true,
      plantillasPersonalizadas: true,
      integracionContable: false,
    },
    required: false,
  })
  @Column({
    name: 'configuracion',
    type: 'jsonb',
    default: {},
    comment: 'Configuración flexible para personalización por empresa',
  })
  configuracion: Record<string, any>;

  @ApiProperty({
    description: 'Límites y restricciones de la empresa',
    example: { maxUsuarios: 10, maxProyectos: 100, maxAlmacenamiento: '10GB' },
  })
  @Column({
    name: 'limites',
    type: 'jsonb',
    default: { maxUsuarios: 5, maxProyectos: 50, maxAlmacenamiento: '5GB' },
    comment: 'Límites y restricciones aplicables a la empresa',
  })
  limites: Record<string, any>;

  @ApiProperty({
    description: 'Estado activo/inactivo de la empresa',
    example: true,
    default: true,
  })
  @Column({
    name: 'activo',
    type: 'boolean',
    default: true,
    comment: 'Indica si la empresa está activa en el sistema',
  })
  activo: boolean;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Suscripciones de la empresa',
    type: () => [Suscripcion],
  })
  @OneToMany(() => Suscripcion, (suscripcion) => suscripcion.empresa, {
    cascade: true,
  })
  suscripciones: Suscripcion[];

  @ApiProperty({
    description: 'Roles definidos para la empresa',
    type: () => [Rol],
  })
  @OneToMany(() => Rol, (rol) => rol.empresa, {
    cascade: true,
  })
  roles: Rol[];

  @ApiProperty({
    description: 'Usuarios de la empresa',
    type: () => [Usuario],
  })
  @OneToMany(() => Usuario, (usuario) => usuario.empresa, {
    cascade: true,
  })
  usuarios: Usuario[];

  @ApiProperty({
    description: 'Clientes de la empresa',
    type: () => [Cliente],
  })
  @OneToMany(() => Cliente, (cliente) => cliente.empresa, {
    cascade: true,
  })
  clientes: Cliente[];

  @ApiProperty({
    description: 'Casos de la empresa',
    type: () => [Caso],
  })
  @OneToMany(() => Caso, (caso) => caso.empresa, {
    cascade: true,
  })
  casos: Caso[];

  @ApiProperty({
    description: 'Proyectos de la empresa',
    type: () => [Proyecto],
  })
  @OneToMany(() => Proyecto, (proyecto) => proyecto.empresa, {
    cascade: true,
  })
  proyectos: Proyecto[];

  // @ApiProperty({
  //   description: 'Facturas de la empresa',
  //   type: () => [Factura],
  // })
  // @OneToMany(() => Factura, (factura) => factura.empresa, {
  //   cascade: true,
  // })
  // facturas: Factura[];

  // @ApiProperty({
  //   description: 'Documentos de la empresa',
  //   type: () => [Documento],
  // })
  // @OneToMany(() => Documento, (documento) => documento.empresa, {
  //   cascade: true,
  // })
  // documentos: Documento[];

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Retorna el nombre para mostrar (razón social)
   */
  get displayName(): string {
    return this.razonSocial;
  }

  /**
   * Verifica si la empresa tiene una suscripción activa
   */
  get tieneSubscripcionActiva(): boolean {
    if (!this.suscripciones?.length) return false;
    
    const ahora = new Date();
    return this.suscripciones.some(
      (sub) => sub.estado === 'activa' && sub.fechaFin > ahora
    );
  }

  /**
   * Obtiene la configuración con valores por defecto
   */
  getConfiguracion<T = any>(key: string, defaultValue: T): T {
    return this.configuracion?.[key] ?? defaultValue;
  }

  /**
   * Actualiza una configuración específica
   */
  setConfiguracion(key: string, value: any): void {
    this.configuracion = {
      ...this.configuracion,
      [key]: value,
    };
  }
}
