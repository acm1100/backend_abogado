import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsPhoneNumber,
  IsDateString,
  IsArray,
  IsObject,
  Length,
  Matches,
  ValidateNested,
  IsUrl,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoCliente, TipoDocumento } from '../../../entities/cliente.entity';

export class DireccionClienteDto {
  @ApiProperty({
    description: 'Dirección completa',
    example: 'Av. Larco 123, Miraflores',
  })
  @IsString()
  direccion: string;

  @ApiProperty({
    description: 'Distrito',
    example: 'Miraflores',
  })
  @IsString()
  distrito: string;

  @ApiProperty({
    description: 'Provincia',
    example: 'Lima',
  })
  @IsString()
  provincia: string;

  @ApiProperty({
    description: 'Departamento',
    example: 'Lima',
  })
  @IsString()
  departamento: string;

  @ApiProperty({
    description: 'País',
    example: 'Perú',
    default: 'Perú',
  })
  @IsString()
  pais: string = 'Perú';

  @ApiPropertyOptional({
    description: 'Código postal',
    example: '15074',
  })
  @IsOptional()
  @IsString()
  codigoPostal?: string;

  @ApiPropertyOptional({
    description: 'Referencia de ubicación',
    example: 'Frente al parque Kennedy',
  })
  @IsOptional()
  @IsString()
  referencia?: string;
}

export class ContactoClienteDto {
  @ApiProperty({
    description: 'Nombre del contacto',
    example: 'Ana García',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Cargo o relación',
    example: 'Gerente Legal',
  })
  @IsString()
  cargo: string;

  @ApiProperty({
    description: 'Email del contacto',
    example: 'ana.garcia@empresa.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Teléfono del contacto',
    example: '+51987654321',
  })
  @IsPhoneNumber('PE')
  telefono: string;

  @ApiPropertyOptional({
    description: 'Teléfono alternativo',
    example: '+5114567890',
  })
  @IsOptional()
  @IsPhoneNumber('PE')
  telefonoAlternativo?: string;

  @ApiPropertyOptional({
    description: 'Es contacto principal',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean = false;
}

export class InformacionFinancieraDto {
  @ApiPropertyOptional({
    description: 'Límite de crédito en soles',
    example: 50000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  limiteCredito?: number;

  @ApiPropertyOptional({
    description: 'Días de crédito otorgados',
    example: 30,
    minimum: 0,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  diasCredito?: number;

  @ApiPropertyOptional({
    description: 'Moneda preferida',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @IsOptional()
  @IsEnum(['PEN', 'USD', 'EUR'])
  monedaPreferida?: string;

  @ApiPropertyOptional({
    description: 'Condiciones especiales de pago',
    example: 'Pago al contado con 5% de descuento',
  })
  @IsOptional()
  @IsString()
  condicionesPago?: string;
}

export class CreateClienteDto {
  @ApiProperty({
    description: 'Tipo de cliente',
    enum: TipoCliente,
    example: TipoCliente.PERSONA_NATURAL,
  })
  @IsEnum(TipoCliente, {
    message: 'Tipo de cliente no válido',
  })
  tipo: TipoCliente;

  @ApiProperty({
    description: 'Tipo de documento de identidad',
    enum: TipoDocumento,
    example: TipoDocumento.DNI,
  })
  @IsEnum(TipoDocumento, {
    message: 'Tipo de documento no válido',
  })
  tipoDocumento: TipoDocumento;

  @ApiProperty({
    description: 'Número de documento (DNI: 8 dígitos, RUC: 11 dígitos, Pasaporte: alfanumérico)',
    example: '12345678',
  })
  @IsString()
  numeroDocumento: string;

  @ApiProperty({
    description: 'Nombres (persona natural) o Razón Social (empresa)',
    example: 'Juan Carlos Pérez García',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @Length(2, 200, {
    message: 'El nombre debe tener entre 2 y 200 caracteres',
  })
  nombres: string;

  @ApiPropertyOptional({
    description: 'Razón Social (para empresas)',
    example: 'Empresa SAC',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  razonSocial?: string;

  @ApiPropertyOptional({
    description: 'Apellidos (solo para persona natural)',
    example: 'Pérez García',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  apellidos?: string;

  @ApiPropertyOptional({
    description: 'Nombre comercial o alias',
    example: 'Pepe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  nombreComercial?: string;

  @ApiProperty({
    description: 'Email principal del cliente',
    example: 'juan.perez@email.com',
    format: 'email',
  })
  @IsEmail({}, {
    message: 'Debe proporcionar un email válido',
  })
  email: string;

  @ApiProperty({
    description: 'Teléfono principal',
    example: '+51987654321',
  })
  @IsPhoneNumber('PE', {
    message: 'Debe proporcionar un teléfono peruano válido',
  })
  telefono: string;

  @ApiPropertyOptional({
    description: 'Teléfono alternativo',
    example: '+5114567890',
  })
  @IsOptional()
  @IsPhoneNumber('PE')
  telefonoAlternativo?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (persona natural) o constitución (empresa)',
    example: '1985-03-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiProperty({
    description: 'Dirección principal del cliente',
    type: DireccionClienteDto,
  })
  @ValidateNested()
  @Type(() => DireccionClienteDto)
  direccion: DireccionClienteDto;

  @ApiPropertyOptional({
    description: 'Sitio web del cliente',
    example: 'https://www.cliente.com',
  })
  @IsOptional()
  @IsUrl({}, {
    message: 'Debe proporcionar una URL válida',
  })
  sitioWeb?: string;

  @ApiPropertyOptional({
    description: 'Profesión u ocupación',
    example: 'Ingeniero Civil',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  profesion?: string;

  @ApiPropertyOptional({
    description: 'Estado civil (solo persona natural)',
    example: 'Casado',
    enum: ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Conviviente'],
  })
  @IsOptional()
  @IsEnum(['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Conviviente'])
  estadoCivil?: string;

  @ApiPropertyOptional({
    description: 'Lista de contactos del cliente',
    type: [ContactoClienteDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactoClienteDto)
  contactos?: ContactoClienteDto[];

  @ApiPropertyOptional({
    description: 'Información financiera del cliente',
    type: InformacionFinancieraDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InformacionFinancieraDto)
  informacionFinanciera?: InformacionFinancieraDto;

  @ApiPropertyOptional({
    description: 'Categorías del cliente',
    example: ['VIP', 'Corporativo'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorias?: string[];

  @ApiPropertyOptional({
    description: 'Origen de referencia del cliente',
    example: 'Recomendación de otro cliente',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  origenReferencia?: string;

  @ApiPropertyOptional({
    description: 'Observaciones generales',
    example: 'Cliente con buen historial de pagos',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Estado activo del cliente',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Configuraciones específicas del cliente',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    notificaciones?: {
      email?: boolean;
      sms?: boolean;
      whatsapp?: boolean;
    };
    preferencias?: {
      idioma?: string;
      formatoFecha?: string;
      moneda?: string;
    };
    facturacion?: {
      emailFacturacion?: string;
      direccionFacturacion?: string;
      condicionesEspeciales?: string;
    };
  };
}
