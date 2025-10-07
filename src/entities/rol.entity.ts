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
import { Usuario } from './usuario.entity';
import { RolPermiso } from './rol-permiso.entity';

export enum NivelRol {
  ADMINISTRADOR = 1,
  GERENTE = 2,
  ASOCIADO = 3,
  ASISTENTE = 4,
}

/**
 * Entidad de roles para el sistema RBAC
 * Define los roles por empresa con sus respectivos permisos
 */
@Entity('roles')
@Unique('uk_roles_nombre_empresa', ['nombre', 'empresaId'])
@Index('idx_roles_empresa', ['empresaId'])
@Index('idx_roles_nivel', ['nivel'])
@Index('idx_roles_activo', ['activo'])
export class Rol extends BaseEntity {
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
    description: 'Nombre del rol',
    example: 'Abogado Senior',
    maxLength: 50,
  })
  @Column({
    name: 'nombre',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Nombre descriptivo del rol',
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del rol',
    example: 'Abogado con experiencia que maneja casos complejos y supervisa asociados',
    required: false,
  })
  @Column({
    name: 'descripcion',
    type: 'text',
    nullable: true,
    comment: 'Descripción detallada del rol y sus responsabilidades',
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Nivel jerárquico del rol',
    example: 2,
    enum: NivelRol,
  })
  @Column({
    name: 'nivel',
    type: 'integer',
    nullable: false,
    default: 4,
    comment: '1=Administrador, 2=Gerente, 3=Asociado, 4=Asistente',
  })
  nivel: NivelRol;

  @ApiProperty({
    description: 'Indica si es un rol predefinido del sistema',
    example: false,
    default: false,
  })
  @Column({
    name: 'es_sistema',
    type: 'boolean',
    default: false,
    comment: 'Roles predefinidos del sistema que no se pueden eliminar',
  })
  esSistema: boolean;

  @ApiProperty({
    description: 'Estado activo del rol',
    example: true,
    default: true,
  })
  @Column({
    name: 'activo',
    type: 'boolean',
    default: true,
    comment: 'Indica si el rol está activo y disponible para asignación',
  })
  activo: boolean;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Empresa a la que pertenece el rol',
    type: () => Empresa,
  })
  @ManyToOne(() => Empresa, (empresa) => empresa.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ApiProperty({
    description: 'Usuarios que tienen este rol',
    type: () => [Usuario],
  })
  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];

  @ApiProperty({
    description: 'Permisos asignados a este rol',
    type: () => [RolPermiso],
  })
  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.rol, {
    cascade: true,
    eager: true,
  })
  permisos: RolPermiso[];

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Verifica si el rol tiene un permiso específico
   */
  tienePermiso(modulo: string, accion: string): boolean {
    return this.permisos?.some(
      (rp) => rp.permiso.modulo === modulo && 
              rp.permiso.accion === accion &&
              rp.permiso.activo
    ) ?? false;
  }

  /**
   * Verifica si el rol puede acceder a un módulo
   */
  puedeAccederModulo(modulo: string): boolean {
    return this.permisos?.some(
      (rp) => rp.permiso.modulo === modulo && rp.permiso.activo
    ) ?? false;
  }

  /**
   * Obtiene todos los módulos a los que puede acceder
   */
  get modulosDisponibles(): string[] {
    if (!this.permisos) return [];
    
    const modulos = new Set(
      this.permisos
        .filter(rp => rp.permiso.activo)
        .map(rp => rp.permiso.modulo)
    );
    
    return Array.from(modulos);
  }

  /**
   * Obtiene todas las acciones disponibles para un módulo
   */
  getAccionesModulo(modulo: string): string[] {
    if (!this.permisos) return [];
    
    return this.permisos
      .filter(rp => rp.permiso.modulo === modulo && rp.permiso.activo)
      .map(rp => rp.permiso.accion);
  }

  /**
   * Verifica si es un rol administrativo
   */
  get esAdministrativo(): boolean {
    return this.nivel <= NivelRol.GERENTE;
  }

  /**
   * Verifica si puede gestionar usuarios de menor nivel
   */
  puedeGestionarNivel(nivel: NivelRol): boolean {
    return this.nivel < nivel;
  }

  /**
   * Nombre del nivel para mostrar
   */
  get nombreNivel(): string {
    switch (this.nivel) {
      case NivelRol.ADMINISTRADOR:
        return 'Administrador';
      case NivelRol.GERENTE:
        return 'Gerente';
      case NivelRol.ASOCIADO:
        return 'Asociado';
      case NivelRol.ASISTENTE:
        return 'Asistente';
      default:
        return 'Sin definir';
    }
  }

  /**
   * Cantidad de usuarios asignados
   */
  get cantidadUsuarios(): number {
    return this.usuarios?.length ?? 0;
  }

  /**
   * Cantidad de permisos asignados
   */
  get cantidadPermisos(): number {
    return this.permisos?.length ?? 0;
  }
}
