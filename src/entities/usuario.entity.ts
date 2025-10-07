import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from './base.entity';
import { Empresa } from './empresa.entity';
import { Rol } from './rol.entity';
import { Cliente } from './cliente.entity';
import { Caso } from './caso.entity';
import { Proyecto } from './proyecto.entity';
// import { RegistroTiempo } from './registro-tiempo.entity';

@Entity('usuarios')
@Unique('uk_usuarios_email_empresa', ['email', 'empresaId'])
@Index('idx_usuarios_empresa', ['empresaId'])
@Index('idx_usuarios_email', ['email'])
@Index('idx_usuarios_activo', ['activo'])
@Index('idx_usuarios_ultimo_acceso', ['ultimoAcceso'])
export class Usuario extends BaseEntity {
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
    description: 'ID del rol asignado',
    format: 'uuid',
    required: false,
  })
  @Column({
    name: 'rol_id',
    type: 'uuid',
    nullable: true,
  })
  rolId?: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Carlos',
    minLength: 2,
    maxLength: 100,
  })
  @Column({
    name: 'nombre',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nombre del usuario',
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'López García',
    minLength: 2,
    maxLength: 100,
  })
  @Column({
    name: 'apellidos',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Apellidos del usuario',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Email del usuario (único por empresa)',
    example: 'juan.lopez@estudio-legal.com',
    format: 'email',
  })
  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Email del usuario para autenticación',
  })
  email: string;

  @ApiHideProperty()
  @Exclude()
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Hash de la contraseña del usuario',
  })
  passwordHash: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+51 987 654 321',
    required: false,
  })
  @Column({
    name: 'telefono',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Teléfono de contacto del usuario',
  })
  telefono?: string;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
    default: true,
  })
  @Column({
    name: 'activo',
    type: 'boolean',
    default: true,
    comment: 'Indica si el usuario está activo en el sistema',
  })
  activo: boolean;

  @ApiHideProperty()
  @Exclude()
  @Column({
    name: 'token_recuperacion',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para recuperación de contraseña',
  })
  tokenRecuperacion?: string;

  @ApiHideProperty()
  @Exclude()
  @Column({
    name: 'token_verificacion',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para verificación de email',
  })
  tokenVerificacion?: string;

  @ApiProperty({
    description: 'Fecha hasta cuando el usuario está bloqueado',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @Column({
    name: 'bloqueado_hasta',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha hasta cuando el usuario está bloqueado',
  })
  bloqueadoHasta?: Date;

  @ApiProperty({
    description: 'Fecha y hora del último acceso',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @Column({
    name: 'ultimo_acceso',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora del último acceso al sistema',
  })
  ultimoAcceso?: Date;

  @ApiProperty({
    description: 'Configuración personal del usuario',
    example: {
      tema: 'claro',
      idioma: 'es',
      notificacionesEmail: true,
      zonaHoraria: 'America/Lima',
    },
    required: false,
  })
  @Column({
    name: 'configuracion_personal',
    type: 'jsonb',
    default: {},
    comment: 'Configuración personal del usuario en formato JSON',
  })
  configuracionPersonal: Record<string, any>;

  @ApiProperty({
    description: 'DNI del usuario',
    example: '12345678',
    required: false,
  })
  @Column({
    name: 'dni',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Documento de identidad del usuario',
  })
  dni?: string;

  @ApiHideProperty()
  @Exclude()
  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Contraseña del usuario (alias de passwordHash)',
  })
  password: string;

  @ApiProperty({
    description: 'Fecha del último cambio de password',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @Column({
    name: 'fecha_ultimo_cambio_password',
    type: 'timestamp',
    nullable: true,
  })
  fechaUltimoCambioPassword?: Date;

  @ApiProperty({
    description: 'Indica si requiere cambio de password',
    example: false,
    default: false,
  })
  @Column({
    name: 'requiere_cambio_password',
    type: 'boolean',
    default: false,
  })
  requiereCambioPassword: boolean;

  @ApiProperty({
    description: 'Número de intentos fallidos de login',
    example: 0,
    default: 0,
  })
  @Column({
    name: 'intentos_fallidos',
    type: 'int',
    default: 0,
  })
  intentosFallidos: number;

  @ApiProperty({
    description: 'Fecha de bloqueo temporal',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @Column({
    name: 'fecha_bloqueo',
    type: 'timestamp',
    nullable: true,
  })
  fechaBloqueo?: Date;

  @ApiProperty({
    description: 'Tarifa por hora del usuario',
    example: 150.00,
    required: false,
  })
  @Column({
    name: 'tarifa_hora',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tarifaHora?: number;

  @ApiProperty({
    description: 'ID del usuario que creó este registro',
    format: 'uuid',
    required: false,
  })
  @Column({
    name: 'creado_por',
    type: 'uuid',
    nullable: true,
  })
  creadoPor?: string;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Empresa a la que pertenece el usuario',
    type: () => Empresa,
  })
  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ApiProperty({
    description: 'Rol asignado al usuario',
    type: () => Rol,
    required: false,
  })
  @ManyToOne(() => Rol, (rol) => rol.usuarios, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'rol_id' })
  rol?: Rol;

  @ApiProperty({
    description: 'Usuario que creó este registro',
    type: () => Usuario,
    required: false,
  })
  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creado_por' })
  creador?: Usuario;

  @ApiProperty({
    description: 'Clientes asignados como responsable',
    type: () => [Cliente],
  })
  @OneToMany(() => Cliente, (cliente) => cliente.responsable)
  clientesAsignados: Cliente[];

  @ApiProperty({
    description: 'Casos donde es responsable',
    type: () => [Caso],
  })
  @OneToMany(() => Caso, (caso) => caso.responsable)
  casosAsignados: Caso[];

  @ApiProperty({
    description: 'Proyectos donde es responsable',
    type: () => [Proyecto],
  })
  @OneToMany(() => Proyecto, (proyecto) => proyecto.responsable)
  proyectosAsignados: Proyecto[];

  // @ApiProperty({
  //   description: 'Registros de tiempo del usuario',
  //   type: () => [RegistroTiempo],
  // })
  // @OneToMany(() => RegistroTiempo, (registro) => registro.usuario)
  // registrosTiempo: RegistroTiempo[];

  // ===============================================
  // HOOKS
  // ===============================================

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Nombre completo del usuario
   */
  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellidos}`;
  }

  /**
   * Iniciales del usuario
   */
  get iniciales(): string {
    const nombres = this.nombre.split(' ');
    const apellidos = this.apellidos.split(' ');
    return `${nombres[0]?.[0] || ''}${apellidos[0]?.[0] || ''}`.toUpperCase();
  }

  /**
   * Verifica si el usuario está bloqueado
   */
  get estaBloqueado(): boolean {
    return this.bloqueadoHasta ? this.bloqueadoHasta > new Date() : false;
  }

  /**
   * Verifica si la contraseña es correcta
   */
  async verificarPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Establece una nueva contraseña
   */
  async establecerPassword(password: string): Promise<void> {
    this.passwordHash = await bcrypt.hash(password, 12);
  }

  /**
   * Genera un token de recuperación
   */
  generarTokenRecuperacion(): string {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    this.tokenRecuperacion = token;
    return token;
  }

  /**
   * Actualiza la fecha de último acceso
   */
  actualizarUltimoAcceso(): void {
    this.ultimoAcceso = new Date();
  }

  /**
   * Obtiene una configuración personal específica
   */
  getConfiguracion<T = any>(key: string, defaultValue?: T): T {
    return this.configuracionPersonal?.[key] ?? defaultValue;
  }

  setConfiguracion(key: string, value: any): void {
    this.configuracionPersonal = {
      ...this.configuracionPersonal,
      [key]: value,
    };
  }

  tienePermiso(modulo: string, accion: string): boolean {
    if (!this.rol) return false;
    
    return this.rol.permisos?.some(
      (rp) => rp.permiso.modulo === modulo && rp.permiso.accion === accion
    ) ?? false;
  }

  puedeAccederModulo(modulo: string): boolean {
    if (!this.rol) return false;
    
    return this.rol.permisos?.some(
      (rp) => rp.permiso.modulo === modulo
    ) ?? false;
  }
}
