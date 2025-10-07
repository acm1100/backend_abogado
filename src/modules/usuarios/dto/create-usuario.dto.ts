import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsPhoneNumber,
  IsObject,
  IsEnum,
  Length,
  Matches,
  ValidateNested,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfiguracionPersonalDto {
  @ApiPropertyOptional({
    description: 'Tema de la interfaz',
    example: 'light',
    enum: ['light', 'dark', 'auto'],
  })
  @IsOptional()
  @IsEnum(['light', 'dark', 'auto'])
  tema?: string;

  @ApiPropertyOptional({
    description: 'Idioma preferido',
    example: 'es',
    enum: ['es', 'en'],
  })
  @IsOptional()
  @IsEnum(['es', 'en'])
  idioma?: string;

  @ApiPropertyOptional({
    description: 'Zona horaria',
    example: 'America/Lima',
  })
  @IsOptional()
  @IsString()
  zonaHoraria?: string;

  @ApiPropertyOptional({
    description: 'Formato de fecha preferido',
    example: 'DD/MM/YYYY',
  })
  @IsOptional()
  @IsString()
  formatoFecha?: string;

  @ApiPropertyOptional({
    description: 'Configuración de notificaciones',
  })
  @IsOptional()
  @IsObject()
  notificaciones?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    frecuencia?: 'inmediata' | 'diaria' | 'semanal';
  };

  @ApiPropertyOptional({
    description: 'Preferencias del dashboard',
  })
  @IsOptional()
  @IsObject()
  dashboard?: {
    widgets?: string[];
    layout?: string;
    filtros?: object;
  };
}

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Carlos',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50, {
    message: 'El nombre debe tener entre 2 y 50 caracteres',
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100, {
    message: 'Los apellidos deben tener entre 2 y 100 caracteres',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Email del usuario (único por empresa)',
    example: 'juan.perez@bufete.com',
    format: 'email',
  })
  @IsEmail({}, {
    message: 'Debe proporcionar un email válido',
  })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiPassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @Length(8, 128, {
    message: 'La contraseña debe tener entre 8 y 128 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial',
  })
  password: string;

  @ApiProperty({
    description: 'Número de documento de identidad (DNI)',
    example: '12345678',
    pattern: '^\d{8}$',
  })
  @IsString()
  @Matches(/^\d{8}$/, {
    message: 'El DNI debe tener exactamente 8 dígitos',
  })
  dni: string;

  @ApiPropertyOptional({
    description: 'Teléfono del usuario',
    example: '+51987654321',
  })
  @IsOptional()
  @IsPhoneNumber('PE', {
    message: 'Debe proporcionar un teléfono peruano válido',
  })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Teléfono alternativo',
    example: '+5114567890',
  })
  @IsOptional()
  @IsPhoneNumber('PE')
  telefonoAlternativo?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento',
    example: '1990-01-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({
    description: 'Dirección del usuario',
    example: 'Av. Lima 123, Miraflores',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  direccion?: string;

  @ApiProperty({
    description: 'ID del rol asignado al usuario',
    example: 'uuid-rol-123',
    format: 'uuid',
  })
  @IsUUID(4, {
    message: 'Debe proporcionar un ID de rol válido',
  })
  rolId: string;

  @ApiPropertyOptional({
    description: 'ID de la empresa (se asigna automáticamente si no se proporciona)',
    example: 'uuid-empresa-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  empresaId?: string;

  @ApiPropertyOptional({
    description: 'Especialidades del usuario',
    example: ['Derecho Civil', 'Derecho Comercial'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];

  @ApiPropertyOptional({
    description: 'Estado activo del usuario',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Si el usuario debe cambiar la contraseña en el primer login',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requiereCambioPassword?: boolean = true;

  @ApiPropertyOptional({
    description: 'Configuración personal del usuario',
    type: ConfiguracionPersonalDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionPersonalDto)
  configuracionPersonal?: ConfiguracionPersonalDto;

  @ApiPropertyOptional({
    description: 'Observaciones o notas sobre el usuario',
    example: 'Usuario especialista en derecho corporativo',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  observaciones?: string;
}
