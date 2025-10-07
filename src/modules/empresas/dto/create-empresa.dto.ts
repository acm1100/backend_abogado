import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsObject, 
  IsPhoneNumber,
  IsUrl,
  Length,
  Matches,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEmpresa, EstadoSuscripcion } from '../../../entities/empresa.entity';
import { DireccionDto } from './direccion.dto';
import { ContactoDto } from './contacto.dto';
import { ConfiguracionEmpresaDto } from './configuracion-empresa.dto';

export class CreateEmpresaDto {
  @ApiProperty({
    description: 'Razón social de la empresa',
    example: 'Bufete Legal Pérez & Asociados SAC',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @Length(3, 200, {
    message: 'La razón social debe tener entre 3 y 200 caracteres',
  })
  razonSocial: string;

  @ApiProperty({
    description: 'Nombre comercial de la empresa',
    example: 'Bufete Legal P&A',
    required: false,
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombreComercial?: string;

  @ApiProperty({
    description: 'RUC de la empresa (11 dígitos)',
    example: '20123456789',
    pattern: '^20\d{9}$',
  })
  @IsString()
  @Matches(/^20\d{9}$/, {
    message: 'El RUC debe tener el formato válido de 11 dígitos comenzando con 20',
  })
  ruc: string;

  @ApiProperty({
    description: 'Tipo de empresa',
    enum: TipoEmpresa,
    example: TipoEmpresa.BUFETE_JURIDICO,
  })
  @IsEnum(TipoEmpresa, {
    message: 'Tipo de empresa no válido',
  })
  tipo: TipoEmpresa;

  @ApiProperty({
    description: 'Dirección principal de la empresa',
    type: DireccionDto,
  })
  @ValidateNested()
  @Type(() => DireccionDto)
  direccion: DireccionDto;

  @ApiProperty({
    description: 'Email principal de la empresa',
    example: 'contacto@bufete.com',
    format: 'email',
  })
  @IsEmail({}, {
    message: 'Debe proporcionar un email válido',
  })
  email: string;

  @ApiProperty({
    description: 'Teléfono principal',
    example: '+5114567890',
  })
  @IsPhoneNumber('PE', {
    message: 'Debe proporcionar un teléfono peruano válido',
  })
  telefono: string;

  @ApiPropertyOptional({
    description: 'Teléfono alternativo',
    example: '+51987654321',
  })
  @IsOptional()
  @IsPhoneNumber('PE')
  telefonoAlternativo?: string;

  @ApiPropertyOptional({
    description: 'Sitio web de la empresa',
    example: 'https://www.bufete.com',
  })
  @IsOptional()
  @IsUrl({}, {
    message: 'Debe proporcionar una URL válida',
  })
  sitioWeb?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la empresa',
    example: 'Bufete especializado en derecho corporativo y civil',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Lista de contactos principales',
    type: [ContactoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactoDto)
  contactos?: ContactoDto[];

  @ApiPropertyOptional({
    description: 'Configuraciones específicas de la empresa',
    type: ConfiguracionEmpresaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionEmpresaDto)
  configuracion?: ConfiguracionEmpresaDto;

  @ApiPropertyOptional({
    description: 'Número máximo de usuarios permitidos',
    example: 10,
    minimum: 1,
    maximum: 1000,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Debe permitir al menos 1 usuario' })
  @Max(1000, { message: 'No puede exceder 1000 usuarios' })
  maxUsuarios?: number = 5;

  @ApiPropertyOptional({
    description: 'Espacio de almacenamiento en GB',
    example: 10,
    minimum: 1,
    maximum: 1000,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Debe tener al menos 1 GB de almacenamiento' })
  @Max(1000, { message: 'No puede exceder 1000 GB' })
  almacenamientoGb?: number = 10;
}
