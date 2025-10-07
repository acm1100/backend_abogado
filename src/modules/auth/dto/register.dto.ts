import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  Matches, 
  IsOptional, 
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsObject,
  IsPhoneNumber,
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoDocumento {
  DNI = 'dni',
  CARNET_EXTRANJERIA = 'carnet_extranjeria',
  PASAPORTE = 'pasaporte',
  RUC = 'ruc'
}

export enum TipoUsuario {
  ADMIN_SISTEMA = 'admin_sistema',
  ADMIN_EMPRESA = 'admin_empresa',
  ABOGADO_SENIOR = 'abogado_senior',
  ABOGADO_JUNIOR = 'abogado_junior',
  ASISTENTE_LEGAL = 'asistente_legal',
  CONTADOR = 'contador',
  SECRETARIA = 'secretaria',
  CLIENTE = 'cliente'
}

class DatosEmpresaDto {
  @ApiProperty({ description: 'Nombre de la empresa', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ description: 'RUC de la empresa' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'RUC debe tener 11 dígitos' })
  ruc: string;

  @ApiPropertyOptional({ description: 'Razón social de la empresa' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  razonSocial?: string;

  @ApiProperty({ description: 'Dirección de la empresa' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  direccion: string;

  @ApiPropertyOptional({ description: 'Teléfono de la empresa' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+51\s?)?(\d{9}|\d{7})$/, { message: 'Formato de teléfono inválido' })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Email corporativo de la empresa' })
  @IsOptional()
  @IsEmail()
  emailCorporativo?: string;

  @ApiPropertyOptional({ description: 'Página web de la empresa' })
  @IsOptional()
  @IsUrl()
  paginaWeb?: string;

  @ApiPropertyOptional({ description: 'Descripción de la empresa' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}

export class RegisterDto {
  // Datos personales del usuario
  @ApiProperty({ description: 'Nombres completos del usuario', example: 'Juan Carlos' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ description: 'Apellidos completos del usuario', example: 'García López' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellidos: string;

  @ApiProperty({ 
    description: 'Tipo de documento de identidad',
    enum: TipoDocumento,
    enumName: 'TipoDocumento',
    example: TipoDocumento.DNI
  })
  @IsEnum(TipoDocumento)
  tipoDocumento: TipoDocumento;

  @ApiProperty({ description: 'Número de documento de identidad', example: '12345678' })
  @IsString()
  @Matches(/^(\d{8}|\d{11}|\d{12}|[A-Z0-9]{5,20})$/, { 
    message: 'Formato de documento inválido' 
  })
  numeroDocumento: string;

  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan.garcia@ejemplo.com' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono del usuario', example: '+51987654321' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+51\s?)?9\d{8}$/, { message: 'Formato de teléfono móvil peruano inválido' })
  telefono?: string;

  // Credenciales de acceso
  @ApiProperty({ 
    description: 'Contraseña del usuario (mínimo 8 caracteres, debe incluir mayúscula, minúscula, número y símbolo)',
    example: 'MiPassword123!',
    minLength: 8,
    maxLength: 50
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo'
    }
  )
  password: string;

  @ApiProperty({ description: 'Confirmación de contraseña' })
  @IsString()
  confirmPassword: string;

  // Información profesional
  @ApiProperty({ 
    description: 'Tipo de usuario en el sistema',
    enum: TipoUsuario,
    enumName: 'TipoUsuario',
    example: TipoUsuario.ABOGADO_SENIOR
  })
  @IsEnum(TipoUsuario)
  tipoUsuario: TipoUsuario;

  @ApiPropertyOptional({ description: 'Número de colegiatura (para abogados)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z0-9\-]+$/, { message: 'Formato de colegiatura inválido' })
  numeroColegiatura?: string;

  @ApiPropertyOptional({ description: 'Especialidades legales', type: [String] })
  @IsOptional()
  @IsString({ each: true })
  especialidades?: string[];

  @ApiPropertyOptional({ description: 'Años de experiencia' })
  @IsOptional()
  experienciaAños?: number;

  @ApiPropertyOptional({ description: 'Universidad de procedencia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  universidad?: string;

  // Datos de la empresa (para registro de empresa nueva)
  @ApiPropertyOptional({ 
    description: 'Datos de la empresa (requerido si es el primer usuario de una empresa nueva)',
    type: DatosEmpresaDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DatosEmpresaDto)
  datosEmpresa?: DatosEmpresaDto;

  // Configuraciones iniciales
  @ApiPropertyOptional({ description: 'Si acepta términos y condiciones', default: false })
  @IsOptional()
  @IsBoolean()
  aceptaTerminos?: boolean;

  @ApiPropertyOptional({ description: 'Si acepta políticas de privacidad', default: false })
  @IsOptional()
  @IsBoolean()
  aceptaPrivacidad?: boolean;

  @ApiPropertyOptional({ description: 'Si desea recibir notificaciones por email', default: true })
  @IsOptional()
  @IsBoolean()
  recibirNotificaciones?: boolean;

  @ApiPropertyOptional({ description: 'Idioma preferido', default: 'es' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  idioma?: string;

  @ApiPropertyOptional({ description: 'Zona horaria', default: 'America/Lima' })
  @IsOptional()
  @IsString()
  zonaHoraria?: string;

  // Campos de invitación (para registro por invitación)
  @ApiPropertyOptional({ description: 'Token de invitación (si aplica)' })
  @IsOptional()
  @IsString()
  tokenInvitacion?: string;

  @ApiPropertyOptional({ description: 'ID de la empresa que invita (si aplica)' })
  @IsOptional()
  @IsString()
  empresaInvitacionId?: string;

  @ApiPropertyOptional({ description: 'Rol asignado por invitación (si aplica)' })
  @IsOptional()
  @IsString()
  rolInvitacionId?: string;

  // Campos adicionales
  @ApiPropertyOptional({ description: 'Avatar/foto de perfil (base64 o URL)' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Biografía o descripción personal' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  biografia?: string;

  @ApiPropertyOptional({ description: 'Configuraciones adicionales del usuario' })
  @IsOptional()
  @IsObject()
  configuraciones?: {
    notificacionesPush?: boolean;
    notificacionesEmail?: boolean;
    notificacionesSMS?: boolean;
    temaOscuro?: boolean;
    idiomaInterfaz?: string;
    formatoFecha?: string;
    formatoHora?: string;
    monedaPreferida?: string;
  };

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  @IsOptional()
  @IsObject()
  metadatos?: any;
}
