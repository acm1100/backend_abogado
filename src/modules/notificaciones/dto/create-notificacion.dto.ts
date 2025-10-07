import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsDateString, IsObject, ValidateNested, IsEmail, IsPhoneNumber, MaxLength, MinLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoNotificacion {
  SISTEMA = 'sistema',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp'
}

export enum PrioridadNotificacion {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  CRITICA = 'critica'
}

export enum CategoriaNotificacion {
  VENCIMIENTO = 'vencimiento',
  RECORDATORIO = 'recordatorio',
  ACTUALIZACION = 'actualizacion',
  APROBACION = 'aprobacion',
  ALERTA = 'alerta',
  INFORMATIVA = 'informativa',
  MARKETING = 'marketing'
}

class DestinatarioDto {
  @ApiProperty({ description: 'ID del usuario destinatario' })
  @IsString()
  usuarioId: string;

  @ApiPropertyOptional({ description: 'Email alternativo del destinatario' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono alternativo del destinatario' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Nombre del destinatario' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;
}

class ConfiguracionNotificacionDto {
  @ApiPropertyOptional({ description: 'Template HTML para email' })
  @IsOptional()
  @IsString()
  templateHtml?: string;

  @ApiPropertyOptional({ description: 'Template de texto plano' })
  @IsOptional()
  @IsString()
  templateTexto?: string;

  @ApiPropertyOptional({ description: 'Configuración de reintento' })
  @IsOptional()
  @IsObject()
  reintento?: {
    maxIntentos: number;
    intervaloMinutos: number;
  };

  @ApiPropertyOptional({ description: 'Configuración de programación' })
  @IsOptional()
  @IsObject()
  programacion?: {
    fechaEnvio: Date;
    zonaHoraria: string;
    esRecurrente: boolean;
    intervaloDias?: number;
  };
}

export class CreateNotificacionDto {
  @ApiProperty({ description: 'Título de la notificación', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  @MinLength(1)
  mensaje: string;

  @ApiProperty({ 
    description: 'Tipo de notificación',
    enum: TipoNotificacion,
    enumName: 'TipoNotificacion'
  })
  @IsEnum(TipoNotificacion)
  tipo: TipoNotificacion;

  @ApiPropertyOptional({ 
    description: 'Prioridad de la notificación',
    enum: PrioridadNotificacion,
    enumName: 'PrioridadNotificacion',
    default: PrioridadNotificacion.NORMAL
  })
  @IsOptional()
  @IsEnum(PrioridadNotificacion)
  prioridad?: PrioridadNotificacion;

  @ApiPropertyOptional({ 
    description: 'Categoría de la notificación',
    enum: CategoriaNotificacion,
    enumName: 'CategoriaNotificacion'
  })
  @IsOptional()
  @IsEnum(CategoriaNotificacion)
  categoria?: CategoriaNotificacion;

  @ApiProperty({ 
    description: 'Lista de destinatarios',
    type: [DestinatarioDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinatarioDto)
  destinatarios: DestinatarioDto[];

  @ApiPropertyOptional({ description: 'ID del caso relacionado' })
  @IsOptional()
  @IsString()
  casoId?: string;

  @ApiPropertyOptional({ description: 'ID del proyecto relacionado' })
  @IsOptional()
  @IsString()
  proyectoId?: string;

  @ApiPropertyOptional({ description: 'ID del cliente relacionado' })
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'ID del documento relacionado' })
  @IsOptional()
  @IsString()
  documentoId?: string;

  @ApiPropertyOptional({ description: 'URL de acción o enlace' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  urlAccion?: string;

  @ApiPropertyOptional({ description: 'Texto del botón de acción' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  textoBotonAccion?: string;

  @ApiPropertyOptional({ description: 'Datos adicionales en formato JSON' })
  @IsOptional()
  @IsObject()
  datosAdicionales?: any;

  @ApiPropertyOptional({ description: 'Fecha programada de envío' })
  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @ApiPropertyOptional({ description: 'Configuración avanzada de la notificación' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionNotificacionDto)
  configuracion?: ConfiguracionNotificacionDto;

  @ApiPropertyOptional({ 
    description: 'Etiquetas para categorización',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({ description: 'Si requiere confirmación de lectura' })
  @IsOptional()
  @IsBoolean()
  requiereConfirmacion?: boolean;

  @ApiPropertyOptional({ description: 'Si se puede descartar la notificación' })
  @IsOptional()
  @IsBoolean()
  esDismisible?: boolean;

  @ApiPropertyOptional({ description: 'Si la notificación expira' })
  @IsOptional()
  @IsBoolean()
  expira?: boolean;

  @ApiPropertyOptional({ description: 'Fecha de expiración' })
  @IsOptional()
  @IsDateString()
  fechaExpiracion?: string;
}
