import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsObject, ValidateNested, MaxLength, MinLength, IsJSON } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoPlantilla {
  DOCUMENTO = 'documento',
  CONTRATO = 'contrato',
  CARTA = 'carta',
  ESCRITOS_JUDICIALES = 'escritos_judiciales',
  DEMANDA = 'demanda',
  CONTESTACION = 'contestacion',
  RECURSO = 'recurso',
  ALEGATOS = 'alegatos',
  INFORME = 'informe',
  DICTAMEN = 'dictamen',
  OPINION_LEGAL = 'opinion_legal',
  ACUERDO = 'acuerdo',
  PODER = 'poder',
  ESTATUTOS = 'estatutos',
  EMAIL = 'email',
  OTROS = 'otros'
}

export enum FormatoPlantilla {
  DOCX = 'docx',
  PDF = 'pdf',
  HTML = 'html',
  TXT = 'txt',
  ODT = 'odt',
  RTF = 'rtf'
}

export enum EstadoPlantilla {
  BORRADOR = 'borrador',
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
  ARCHIVADA = 'archivada'
}

export enum CategoriaPlantilla {
  CIVIL = 'civil',
  PENAL = 'penal',
  LABORAL = 'laboral',
  COMERCIAL = 'comercial',
  TRIBUTARIO = 'tributario',
  ADMINISTRATIVO = 'administrativo',
  CONSTITUCIONAL = 'constitucional',
  CORPORATIVO = 'corporativo',
  INMOBILIARIO = 'inmobiliario',
  FAMILIA = 'familia',
  OTROS = 'otros'
}

class VariablePlantillaDto {
  @ApiProperty({ description: 'Nombre de la variable', example: 'cliente_nombre' })
  @IsString()
  @MaxLength(50)
  nombre: string;

  @ApiProperty({ description: 'Etiqueta descriptiva', example: 'Nombre del Cliente' })
  @IsString()
  @MaxLength(100)
  etiqueta: string;

  @ApiProperty({ description: 'Tipo de datos', enum: ['text', 'number', 'date', 'boolean', 'select', 'textarea'] })
  @IsString()
  tipo: string;

  @ApiPropertyOptional({ description: 'Valor por defecto' })
  @IsOptional()
  valorDefecto?: any;

  @ApiPropertyOptional({ description: 'Si es requerida' })
  @IsOptional()
  @IsBoolean()
  esRequerida?: boolean;

  @ApiPropertyOptional({ description: 'Opciones para campos select', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opciones?: string[];

  @ApiPropertyOptional({ description: 'Formato para variables de fecha' })
  @IsOptional()
  @IsString()
  formato?: string;

  @ApiPropertyOptional({ description: 'Texto de ayuda para el usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ayuda?: string;
}

class SeccionPlantillaDto {
  @ApiProperty({ description: 'Nombre de la sección' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ description: 'Contenido de la sección' })
  @IsString()
  contenido: string;

  @ApiPropertyOptional({ description: 'Orden de la sección' })
  @IsOptional()
  orden?: number;

  @ApiPropertyOptional({ description: 'Si la sección es opcional' })
  @IsOptional()
  @IsBoolean()
  esOpcional?: boolean;

  @ApiPropertyOptional({ description: 'Condición para mostrar la sección' })
  @IsOptional()
  @IsString()
  condicion?: string;
}

export class CreatePlantillaDto {
  @ApiProperty({ description: 'Nombre de la plantilla', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción de la plantilla' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ 
    description: 'Tipo de plantilla',
    enum: TipoPlantilla,
    enumName: 'TipoPlantilla'
  })
  @IsEnum(TipoPlantilla)
  tipo: TipoPlantilla;

  @ApiProperty({ 
    description: 'Formato de salida',
    enum: FormatoPlantilla,
    enumName: 'FormatoPlantilla'
  })
  @IsEnum(FormatoPlantilla)
  formato: FormatoPlantilla;

  @ApiPropertyOptional({ 
    description: 'Categoría legal',
    enum: CategoriaPlantilla,
    enumName: 'CategoriaPlantilla'
  })
  @IsOptional()
  @IsEnum(CategoriaPlantilla)
  categoria?: CategoriaPlantilla;

  @ApiProperty({ description: 'Contenido principal de la plantilla' })
  @IsString()
  @MinLength(1)
  contenido: string;

  @ApiPropertyOptional({ description: 'Encabezado del documento' })
  @IsOptional()
  @IsString()
  encabezado?: string;

  @ApiPropertyOptional({ description: 'Pie de página del documento' })
  @IsOptional()
  @IsString()
  piePagina?: string;

  @ApiPropertyOptional({ 
    description: 'Variables de la plantilla',
    type: [VariablePlantillaDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariablePlantillaDto)
  variables?: VariablePlantillaDto[];

  @ApiPropertyOptional({ 
    description: 'Secciones de la plantilla',
    type: [SeccionPlantillaDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeccionPlantillaDto)
  secciones?: SeccionPlantillaDto[];

  @ApiPropertyOptional({ description: 'Estilos CSS para HTML' })
  @IsOptional()
  @IsString()
  estilos?: string;

  @ApiPropertyOptional({ description: 'Configuración de márgenes y formato' })
  @IsOptional()
  @IsObject()
  configuracionFormato?: {
    margenSuperior?: number;
    margenInferior?: number;
    margenIzquierdo?: number;
    margenDerecho?: number;
    tamañoFuente?: number;
    fuenteTexto?: string;
    interlineado?: number;
    orientacion?: 'portrait' | 'landscape';
    tamañoPapel?: 'A4' | 'Letter' | 'Legal';
  };

  @ApiPropertyOptional({ 
    description: 'Etiquetas para categorización',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({ description: 'Si es plantilla pública para toda la empresa' })
  @IsOptional()
  @IsBoolean()
  esPublica?: boolean;

  @ApiPropertyOptional({ description: 'Si permite edición por otros usuarios' })
  @IsOptional()
  @IsBoolean()
  permiteEdicion?: boolean;

  @ApiPropertyOptional({ description: 'Si requiere firma digital' })
  @IsOptional()
  @IsBoolean()
  requiereFirma?: boolean;

  @ApiPropertyOptional({ description: 'Idioma de la plantilla' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  idioma?: string;

  @ApiPropertyOptional({ description: 'Version de la plantilla' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional({ description: 'Notas sobre cambios en la versión' })
  @IsOptional()
  @IsString()
  notasVersion?: string;

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  @IsOptional()
  @IsObject()
  metadatos?: any;

  @ApiPropertyOptional({ description: 'Configuración de automatización' })
  @IsOptional()
  @IsObject()
  automatizacion?: {
    autocompletar?: boolean;
    validaciones?: any[];
    acciones?: any[];
    integraciones?: any[];
  };
}
