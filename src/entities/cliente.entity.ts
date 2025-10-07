import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { Empresa } from './empresa.entity';
import { Usuario } from './usuario.entity';
// import { ContactoCliente } from './contacto-cliente.entity';
import { Caso } from './caso.entity';
import { Proyecto } from './proyecto.entity';
// import { Factura } from './factura.entity';

export enum TipoCliente {
  PERSONA_NATURAL = 'persona_natural',
  EMPRESA = 'empresa',
}

export enum EstadoCliente {
  PROSPECTO = 'prospecto',
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export enum TipoDocumento {
  DNI = 'dni',
  RUC = 'ruc',
  PASAPORTE = 'pasaporte',
  CARNET_EXTRANJERIA = 'carnet_extranjeria',
}

/**
 * Entidad de clientes con validaciones específicas para Perú
 * Maneja tanto personas naturales como empresas con sus respectivos documentos
 */
@Entity('clientes')
@Index('idx_clientes_empresa', ['empresaId'])
@Index('idx_clientes_tipo', ['tipoCliente'])
@Index('idx_clientes_estado', ['estado'])
@Index('idx_clientes_dni', ['dni'])
@Index('idx_clientes_ruc', ['ruc'])
@Index('idx_clientes_responsable', ['responsableId'])
@Index('idx_clientes_documento', ['empresaId', 'dni', 'ruc'])
@Check('chk_documento_identidad', `
  (tipo_cliente = 'persona_natural' AND dni IS NOT NULL) OR 
  (tipo_cliente = 'empresa' AND ruc IS NOT NULL)
`)
@Check('chk_dni_valido', `dni IS NULL OR (length(dni) = 8 AND dni ~ '^[0-9]+$')`)
@Check('chk_ruc_valido', `ruc IS NULL OR (length(ruc) = 11 AND ruc ~ '^[0-9]+$')`)
export class Cliente extends BaseEntity {
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
    description: 'Tipo de cliente',
    enum: TipoCliente,
    example: TipoCliente.PERSONA_NATURAL,
  })
  @Column({
    name: 'tipo_cliente',
    type: 'enum',
    enum: TipoCliente,
    nullable: false,
    comment: 'Tipo de cliente: persona natural o empresa',
  })
  tipoCliente: TipoCliente;

  // ===============================================
  // DATOS PARA PERSONA NATURAL
  // ===============================================

  @ApiProperty({
    description: 'Nombres (solo para persona natural)',
    example: 'Juan Carlos',
    required: false,
  })
  @Column({
    name: 'nombres',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Nombres para persona natural',
  })
  nombres?: string;

  @ApiProperty({
    description: 'Nombre completo o razón social del cliente',
    example: 'Juan Carlos López García',
  })
  @Column({
    name: 'nombre',
    type: 'varchar',
    length: 200,
    nullable: false,
    comment: 'Nombre completo o razón social',
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellidos (solo para persona natural)',
    example: 'López García',
    required: false,
  })
  @Column({
    name: 'apellidos',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Apellidos para persona natural',
  })
  apellidos?: string;

  @ApiProperty({
    description: 'DNI (solo para persona natural)',
    example: '12345678',
    pattern: '^[0-9]{8}$',
    required: false,
  })
  @Column({
    name: 'dni',
    type: 'varchar',
    length: 8,
    nullable: true,
    comment: 'DNI para persona natural (8 dígitos)',
  })
  dni?: string;

  // ===============================================
  // DATOS PARA EMPRESA
  // ===============================================

  @ApiProperty({
    description: 'Razón social (solo para empresa)',
    example: 'Constructora ABC S.A.C.',
    required: false,
  })
  @Column({
    name: 'razon_social',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Razón social para empresa',
  })
  razonSocial?: string;

  @ApiProperty({
    description: 'RUC (solo para empresa)',
    example: '20123456789',
    pattern: '^[0-9]{11}$',
    required: false,
  })
  @Column({
    name: 'ruc',
    type: 'varchar',
    length: 11,
    nullable: true,
    comment: 'RUC para empresa (11 dígitos)',
  })
  ruc?: string;

  // ===============================================
  // DATOS COMUNES
  // ===============================================

  @ApiProperty({
    description: 'Email de contacto',
    example: 'cliente@ejemplo.com',
    format: 'email',
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
    description: 'Teléfono de contacto',
    example: '+51 987 654 321',
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
    description: 'Dirección completa',
    example: 'Av. Arequipa 123, Miraflores, Lima',
    required: false,
  })
  @Column({
    name: 'direccion',
    type: 'text',
    nullable: true,
    comment: 'Dirección completa del cliente',
  })
  direccion?: string;

  @ApiProperty({
    description: 'Sector o rubro de la empresa',
    example: 'Construcción',
    required: false,
  })
  @Column({
    name: 'sector',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Sector económico o rubro del cliente',
  })
  sector?: string;

  @ApiProperty({
    description: 'Estado del cliente',
    enum: EstadoCliente,
    example: EstadoCliente.ACTIVO,
  })
  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoCliente,
    default: EstadoCliente.PROSPECTO,
    comment: 'Estado actual del cliente',
  })
  estado: EstadoCliente;

  @ApiProperty({
    description: 'Indica si el cliente está activo',
    example: true,
  })
  @Column({
    name: 'activo',
    type: 'boolean',
    default: true,
    comment: 'Indica si el cliente está activo en el sistema',
  })
  activo: boolean;

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

  // ===============================================
  // CONTACTO PRINCIPAL (PARA EMPRESAS)
  // ===============================================

  @ApiProperty({
    description: 'Nombre del contacto principal (para empresas)',
    example: 'María González',
    required: false,
  })
  @Column({
    name: 'contacto_principal',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nombre de la persona de contacto principal',
  })
  contactoPrincipal?: string;

  @ApiProperty({
    description: 'Cargo del contacto principal',
    example: 'Gerente General',
    required: false,
  })
  @Column({
    name: 'cargo_contacto',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cargo del contacto principal',
  })
  cargoContacto?: string;

  // ===============================================
  // CAMPOS ADICIONALES
  // ===============================================

  @ApiProperty({
    description: 'Etiquetas del cliente',
    example: ['vip', 'corporativo', 'litigio'],
    required: false,
  })
  @Column({
    name: 'etiquetas',
    type: 'text',
    array: true,
    nullable: true,
    comment: 'Array de etiquetas para categorizar el cliente',
  })
  etiquetas?: string[];

  @ApiProperty({
    description: 'Notas generales del cliente',
    required: false,
  })
  @Column({
    name: 'notas',
    type: 'text',
    nullable: true,
    comment: 'Notas generales sobre el cliente',
  })
  notas?: string;

  @ApiProperty({
    description: 'Notas sensibles encriptadas',
    required: false,
  })
  @Column({
    name: 'notas_encrypted',
    type: 'bytea',
    nullable: true,
    comment: 'Notas sensibles encriptadas',
  })
  notasEncriptadas?: Buffer;

  @ApiProperty({
    description: 'Historial de interacciones',
    example: [
      {
        fecha: '2024-01-15T10:00:00Z',
        tipo: 'llamada',
        descripcion: 'Consulta inicial sobre divorcio',
        usuario: 'Juan López'
      }
    ],
    required: false,
  })
  @Column({
    name: 'historial_interacciones',
    type: 'jsonb',
    default: [],
    comment: 'Historial de interacciones con el cliente',
  })
  historialInteracciones: any[];

  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez García',
  })
  @Column({
    name: 'nombre_completo',
    type: 'varchar',
    length: 400,
    nullable: true,
    comment: 'Nombre completo del cliente (calculado)',
  })
  nombreCompleto?: string;

  @ApiProperty({
    description: 'Configuración específica del cliente',
    required: false,
  })
  @Column({
    name: 'configuracion',
    type: 'jsonb',
    nullable: true,
    default: {},
    comment: 'Configuración específica del cliente',
  })
  configuracion?: any;

  @ApiProperty({
    description: 'Número de casos activos',
    example: 2,
  })
  @Column({
    name: 'casos_activos',
    type: 'int',
    default: 0,
    comment: 'Cantidad de casos activos del cliente',
  })
  casosActivos: number;

  @ApiProperty({
    description: 'Total facturado al cliente',
    example: 15000.50,
  })
  @Column({
    name: 'total_facturado',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Total facturado al cliente',
  })
  totalFacturado: number;

  @ApiProperty({
    description: 'Fecha del último contacto',
    type: 'string',
    format: 'date-time',
  })
  @Column({
    name: 'fecha_ultimo_contacto',
    type: 'timestamptz',
    nullable: true,
    comment: 'Fecha del último contacto con el cliente',
  })
  fechaUltimoContacto?: Date;

  // ===============================================
  // RELACIONES
  // ===============================================

  @ApiProperty({
    description: 'Empresa a la que pertenece el cliente',
    type: () => Empresa,
  })
  @ManyToOne(() => Empresa, (empresa) => empresa.clientes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ApiProperty({
    description: 'Usuario responsable del cliente',
    type: () => Usuario,
    required: false,
  })
  @ManyToOne(() => Usuario, (usuario) => usuario.clientesAsignados, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'responsable_id' })
  responsable?: Usuario;

  // @ApiProperty({
  //   description: 'Contactos adicionales del cliente',
  //   type: () => [ContactoCliente],
  // })
  // @OneToMany(() => ContactoCliente, (contacto) => contacto.cliente, {
  //   cascade: true,
  // })
  // contactosAdicionales: ContactoCliente[];

  @ApiProperty({
    description: 'Casos del cliente',
    type: () => [Caso],
  })
  @OneToMany(() => Caso, (caso) => caso.cliente)
  casos: Caso[];

  @ApiProperty({
    description: 'Proyectos del cliente',
    type: () => [Proyecto],
  })
  @OneToMany(() => Proyecto, (proyecto) => proyecto.cliente)
  proyectos: Proyecto[];

  // @ApiProperty({
  //   description: 'Facturas del cliente',
  //   type: () => [Factura],
  // })
  // @OneToMany(() => Factura, (factura) => factura.cliente)
  // facturas: Factura[];

  // ===============================================
  // HOOKS
  // ===============================================

  @BeforeInsert()
  @BeforeUpdate()
  validarDatos() {
    if (this.tipoCliente === TipoCliente.PERSONA_NATURAL) {
      if (!this.nombres || !this.apellidos || !this.dni) {
        throw new Error('Persona natural debe tener nombres, apellidos y DNI');
      }
      this.razonSocial = null;
      this.ruc = null;
    } else if (this.tipoCliente === TipoCliente.EMPRESA) {
      if (!this.razonSocial || !this.ruc) {
        throw new Error('Empresa debe tener razón social y RUC');
      }
      this.nombres = null;
      this.apellidos = null;
      this.dni = null;
    }
  }

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Documento de identidad según el tipo
   */
  get documentoIdentidad(): string | null {
    if (this.tipoCliente === TipoCliente.PERSONA_NATURAL) {
      return this.dni;
    } else {
      return this.ruc;
    }
  }

  /**
   * Tipo de documento
   */
  get tipoDocumento(): string {
    return this.tipoCliente === TipoCliente.PERSONA_NATURAL ? 'DNI' : 'RUC';
  }

  /**
   * Número de documento (alias para documentoIdentidad)
   */
  get numeroDocumento(): string | null {
    return this.documentoIdentidad;
  }

  /**
   * Verifica si es una persona natural
   */
  get esPersonaNatural(): boolean {
    return this.tipoCliente === TipoCliente.PERSONA_NATURAL;
  }

  /**
   * Verifica si es una empresa
   */
  get esEmpresa(): boolean {
    return this.tipoCliente === TipoCliente.EMPRESA;
  }

  /**
   * Verifica si el cliente está activo
   */
  get estaActivo(): boolean {
    return this.estado === EstadoCliente.ACTIVO;
  }

  /**
   * Agrega una interacción al historial
   */
  agregarInteraccion(tipo: string, descripcion: string, usuarioNombre: string): void {
    const interaccion = {
      fecha: new Date().toISOString(),
      tipo,
      descripcion,
      usuario: usuarioNombre,
    };

    this.historialInteracciones = [...(this.historialInteracciones || []), interaccion];
  }

  /**
   * Agrega una etiqueta si no existe
   */
  agregarEtiqueta(etiqueta: string): void {
    if (!this.etiquetas) {
      this.etiquetas = [];
    }
    
    if (!this.etiquetas.includes(etiqueta)) {
      this.etiquetas.push(etiqueta);
    }
  }

  /**
   * Remueve una etiqueta
   */
  removerEtiqueta(etiqueta: string): void {
    if (this.etiquetas) {
      this.etiquetas = this.etiquetas.filter(e => e !== etiqueta);
    }
  }

  /**
   * Cantidad de casos activos
   */
  get cantidadCasosActivos(): number {
    return this.casos?.filter(caso => caso.estado === 'activo').length ?? 0;
  }

  /**
   * Cantidad de proyectos activos
   */
  get cantidadProyectosActivos(): number {
    return this.proyectos?.filter(proyecto => 
      proyecto.estado !== 'completado' && 
      proyecto.estado !== 'cancelado' && 
      proyecto.estado !== 'facturado'
    ).length ?? 0;
  }

  /**
   * Monto total facturado
   */
  get montoTotalFacturado(): number {
    // return this.facturas?.reduce((total, factura) => total + factura.total, 0) ?? 0;
    return 0; // Temporalmente comentado
  }

  /**
   * Saldo pendiente de cobro
   */
  get saldoPendiente(): number {
    // return this.facturas?.reduce((total, factura) => total + factura.saldoPendiente, 0) ?? 0;
    return 0; // Temporalmente comentado
  }
}
