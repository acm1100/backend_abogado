import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  IsObject,
  IsNumber,
  Length,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoCaso, EstadoCaso, PrioridadCaso } from '../../../entities/caso.entity';

export class ParteInvolucradaDto {
  @ApiProperty({
    description: 'Nombre de la parte involucrada',
    example: 'María González Pérez',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Tipo de parte',
    example: 'DEMANDANTE',
    enum: ['DEMANDANTE', 'DEMANDADO', 'TERCERO', 'TESTIGO', 'PERITO', 'ABOGADO_CONTRAPARTE'],
  })
  @IsEnum(['DEMANDANTE', 'DEMANDADO', 'TERCERO', 'TESTIGO', 'PERITO', 'ABOGADO_CONTRAPARTE'])
  tipo: string;

  @ApiPropertyOptional({
    description: 'Documento de identidad',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'maria.gonzalez@email.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+51987654321',
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Dirección',
    example: 'Av. Principal 123, Lima',
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Observaciones sobre la parte',
    example: 'Representante legal de la empresa',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateCasoDto {
  @ApiProperty({
    description: 'Título del caso',
    example: 'Demanda por incumplimiento de contrato - Empresa ABC',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @Length(5, 200, {
    message: 'El título debe tener entre 5 y 200 caracteres',
  })
  titulo: string;

  @ApiProperty({
    description: 'Descripción detallada del caso',
    example: 'Caso de incumplimiento contractual donde la empresa ABC no cumplió con las cláusulas establecidas...',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @Length(10, 2000, {
    message: 'La descripción debe tener entre 10 y 2000 caracteres',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de caso',
    enum: TipoCaso,
    example: TipoCaso.CIVIL,
  })
  @IsEnum(TipoCaso, {
    message: 'Tipo de caso no válido',
  })
  tipo: TipoCaso;

  @ApiProperty({
    description: 'Especialidad jurídica específica',
    example: 'Derecho Contractual',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  especialidad: string;

  @ApiProperty({
    description: 'Prioridad del caso',
    enum: PrioridadCaso,
    example: PrioridadCaso.MEDIA,
  })
  @IsEnum(PrioridadCaso, {
    message: 'Prioridad no válida',
  })
  prioridad: PrioridadCaso;

  @ApiProperty({
    description: 'ID del cliente asociado al caso',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsUUID(4, {
    message: 'Debe proporcionar un ID de cliente válido',
  })
  clienteId: string;

  @ApiPropertyOptional({
    description: 'ID del usuario responsable del caso (abogado principal)',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  usuarioId?: string;

  @ApiPropertyOptional({
    description: 'Número de expediente o código interno',
    example: 'EXP-2024-001',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  numeroExpediente?: string;

  @ApiPropertyOptional({
    description: 'Juzgado o instancia competente',
    example: '1er Juzgado Civil de Lima',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  juzgado?: string;

  @ApiPropertyOptional({
    description: 'Número de proceso judicial',
    example: '00123-2024-0-1801-JR-CI-01',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  numeroProceso?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del caso',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha límite o vencimiento',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;

  @ApiPropertyOptional({
    description: 'Monto en controversia (en soles)',
    example: 150000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montoReclamado?: number;

  @ApiPropertyOptional({
    description: 'Moneda del monto reclamado',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @IsOptional()
  @IsEnum(['PEN', 'USD', 'EUR'])
  monedaReclamado?: string;

  @ApiPropertyOptional({
    description: 'Lista de partes involucradas en el caso',
    type: [ParteInvolucradaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParteInvolucradaDto)
  partesInvolucradas?: ParteInvolucradaDto[];

  @ApiPropertyOptional({
    description: 'Etiquetas o tags del caso',
    example: ['urgente', 'corporativo', 'apelación'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Cliente VIP, requiere atención prioritaria',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Estado inicial del caso',
    enum: EstadoCaso,
    example: EstadoCaso.ABIERTO,
    default: EstadoCaso.ABIERTO,
  })
  @IsOptional()
  @IsEnum(EstadoCaso)
  estado?: EstadoCaso = EstadoCaso.ABIERTO;

  @ApiPropertyOptional({
    description: 'Si el caso es confidencial',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  confidencial?: boolean = false;

  @ApiPropertyOptional({
    description: 'Si el caso está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Configuración específica del caso',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    notificaciones?: {
      recordatorios?: boolean;
      actualizaciones?: boolean;
      vencimientos?: boolean;
    };
    facturacion?: {
      tarifaHora?: number;
      moneda?: string;
      facturable?: boolean;
    };
    acceso?: {
      equipoAsignado?: string[];
      nivelAcceso?: 'PUBLICO' | 'RESTRINGIDO' | 'CONFIDENCIAL';
    };
  };
}
