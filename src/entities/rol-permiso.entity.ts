import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { Rol } from './rol.entity';
import { Permiso } from './permiso.entity';

/**
 * Entidad intermedia para la relación muchos a muchos entre roles y permisos
 * Permite asignar permisos específicos a roles con fecha de asignación
 */
@Entity('roles_permisos')
@Unique('uk_rol_permiso', ['rolId', 'permisoId'])
@Index('idx_roles_permisos_rol', ['rolId'])
@Index('idx_roles_permisos_permiso', ['permisoId'])
export class RolPermiso extends BaseEntity {
  @ApiProperty({
    description: 'ID del rol',
    format: 'uuid',
  })
  @Column({
    name: 'rol_id',
    type: 'uuid',
    nullable: false,
  })
  rolId: string;

  @ApiProperty({
    description: 'ID del permiso',
    format: 'uuid',
  })
  @Column({
    name: 'permiso_id',
    type: 'uuid',
    nullable: false,
  })
  permisoId: string;

  @ApiProperty({
    description: 'Fecha de asignación del permiso al rol',
    type: 'string',
    format: 'date-time',
  })
  @Column({
    name: 'fecha_asignacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Fecha en que se asignó el permiso al rol',
  })
  fechaAsignacion: Date;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Rol al que se asignó el permiso',
    type: () => Rol,
  })
  @ManyToOne(() => Rol, (rol) => rol.permisos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @ApiProperty({
    description: 'Permiso asignado al rol',
    type: () => Permiso,
  })
  @ManyToOne(() => Permiso, (permiso) => permiso.roles, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'permiso_id' })
  permiso: Permiso;

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Nombre completo del permiso asignado
   */
  get nombrePermiso(): string {
    return this.permiso?.nombreCompleto || `${this.rolId}.${this.permisoId}`;
  }

  /**
   * Descripción del permiso asignado
   */
  get descripcionPermiso(): string {
    return this.permiso?.descripcionLegible || 'Permiso sin descripción';
  }

  /**
   * Verifica si la asignación es reciente (últimos 7 días)
   */
  get esReciente(): boolean {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return this.fechaAsignacion > hace7Dias;
  }
}
