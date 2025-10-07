import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { RolPermiso } from './rol-permiso.entity';

/**
 * Entidad de permisos del sistema
 * Define los permisos granulares disponibles para asignar a roles
 */
@Entity('permisos')
@Index('idx_permisos_modulo', ['modulo'])
@Index('idx_permisos_accion', ['accion'])
@Index('idx_permisos_categoria', ['categoria'])
@Index('idx_permisos_activo', ['activo'])
export class Permiso extends BaseEntity {
  @ApiProperty({
    description: 'Módulo al que pertenece el permiso',
    example: 'clientes',
    enum: [
      'usuarios', 'clientes', 'casos', 'proyectos', 'facturacion', 
      'agenda', 'documentos', 'reportes', 'configuracion', 'administracion'
    ],
  })
  @Column({
    name: 'modulo',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Módulo del sistema al que aplica el permiso',
  })
  modulo: string;

  @ApiProperty({
    description: 'Acción específica del permiso',
    example: 'crear',
    enum: [
      'crear', 'leer', 'actualizar', 'eliminar', 'aprobar', 
      'exportar', 'importar', 'compartir', 'publicar'
    ],
  })
  @Column({
    name: 'accion',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Acción específica que permite realizar',
  })
  accion: string;

  @ApiProperty({
    description: 'Descripción detallada del permiso',
    example: 'Permite crear nuevos clientes en el sistema',
    required: false,
  })
  @Column({
    name: 'descripcion',
    type: 'text',
    nullable: true,
    comment: 'Descripción clara de lo que permite hacer este permiso',
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Categoría del permiso para agrupación',
    example: 'operaciones',
    enum: ['seguridad', 'operaciones', 'reportes', 'configuracion'],
    required: false,
  })
  @Column({
    name: 'categoria',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Categoría para agrupar permisos similares',
  })
  categoria?: string;

  @ApiProperty({
    description: 'Estado activo del permiso',
    example: true,
    default: true,
  })
  @Column({
    name: 'activo',
    type: 'boolean',
    default: true,
    comment: 'Indica si el permiso está activo y disponible',
  })
  activo: boolean;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Roles que tienen este permiso',
    type: () => [RolPermiso],
  })
  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.permiso)
  roles: RolPermiso[];

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Nombre completo del permiso para mostrar
   */
  get nombreCompleto(): string {
    return `${this.modulo}.${this.accion}`;
  }

  /**
   * Descripción legible del permiso
   */
  get descripcionLegible(): string {
    if (this.descripcion) return this.descripcion;
    
    const acciones = {
      crear: 'Crear',
      leer: 'Ver',
      actualizar: 'Editar',
      eliminar: 'Eliminar',
      aprobar: 'Aprobar',
      exportar: 'Exportar',
      importar: 'Importar',
      compartir: 'Compartir',
      publicar: 'Publicar',
    };

    const modulos = {
      usuarios: 'usuarios',
      clientes: 'clientes',
      casos: 'casos',
      proyectos: 'proyectos',
      facturacion: 'facturas',
      agenda: 'eventos de agenda',
      documentos: 'documentos',
      reportes: 'reportes',
      configuracion: 'configuración',
      administracion: 'administración',
    };

    const accionNombre = acciones[this.accion] || this.accion;
    const moduloNombre = modulos[this.modulo] || this.modulo;

    return `${accionNombre} ${moduloNombre}`;
  }

  /**
   * Verifica si es un permiso crítico
   */
  get esCritico(): boolean {
    const permisosCriticos = [
      'usuarios.eliminar',
      'administracion.configurar',
      'usuarios.crear',
      'configuracion.actualizar',
    ];
    
    return permisosCriticos.includes(this.nombreCompleto);
  }

  /**
   * Cantidad de roles que tienen este permiso
   */
  get cantidadRoles(): number {
    return this.roles?.length ?? 0;
  }
}
