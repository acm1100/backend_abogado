import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsObject, IsDateString, ValidateNested, Max, Min, MaxLength, MinLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoReporte {
  FINANCIERO = 'financiero',
  OPERACIONAL = 'operacional',
  PRODUCTIVIDAD = 'productividad',
  CLIENTES = 'clientes',
  CASOS = 'casos',
  FACTURACION = 'facturacion',
  GASTOS = 'gastos',
  TIEMPO = 'tiempo',
  PROYECTOS = 'proyectos',
  USUARIOS = 'usuarios',
  DASHBOARD = 'dashboard',
  PERSONALIZADO = 'personalizado'
}

export enum FormatoReporte {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
  POWERBI = 'powerbi'
}

export enum FrecuenciaReporte {
  UNICA_VEZ = 'unica_vez',
  DIARIO = 'diario',
  SEMANAL = 'semanal',
  QUINCENAL = 'quincenal',
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual'
}

export enum EstadoReporte {
  BORRADOR = 'borrador',
  ACTIVO = 'activo',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  ERROR = 'error',
  ARCHIVADO = 'archivado'
}

class FiltroReporteDto {
  @ApiProperty({ description: 'Campo a filtrar' })
  @IsString()
  campo: string;

  @ApiProperty({ description: 'Operador de comparación', enum: ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN', 'BETWEEN'] })
  @IsString()
  operador: string;

  @ApiProperty({ description: 'Valor(es) del filtro' })
  valor: any;

  @ApiPropertyOptional({ description: 'Etiqueta descriptiva del filtro' })
  @IsOptional()
  @IsString()
  etiqueta?: string;
}

class CampoReporteDto {
  @ApiProperty({ description: 'Nombre del campo' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Alias para mostrar' })
  @IsString()
  alias: string;

  @ApiPropertyOptional({ description: 'Función de agregación', enum: ['SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'GROUP_CONCAT'] })
  @IsOptional()
  @IsString()
  agregacion?: string;

  @ApiPropertyOptional({ description: 'Formato de datos', enum: ['texto', 'numero', 'moneda', 'fecha', 'porcentaje'] })
  @IsOptional()
  @IsString()
  formato?: string;

  @ApiPropertyOptional({ description: 'Si el campo es visible' })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiPropertyOptional({ description: 'Orden de visualización' })
  @IsOptional()
  orden?: number;
}

class ConfiguracionGraficoDto {
  @ApiProperty({ description: 'Tipo de gráfico', enum: ['bar', 'line', 'pie', 'donut', 'area', 'scatter', 'table'] })
  @IsString()
  tipo: string;

  @ApiPropertyOptional({ description: 'Título del gráfico' })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({ description: 'Campo para eje X' })
  @IsOptional()
  @IsString()
  ejeX?: string;

  @ApiPropertyOptional({ description: 'Campo para eje Y' })
  @IsOptional()
  @IsString()
  ejeY?: string;

  @ApiPropertyOptional({ description: 'Configuración de colores' })
  @IsOptional()
  @IsArray()
  colores?: string[];

  @ApiPropertyOptional({ description: 'Si mostrar leyenda' })
  @IsOptional()
  @IsBoolean()
  mostrarLeyenda?: boolean;

  @ApiPropertyOptional({ description: 'Posición de la leyenda' })
  @IsOptional()
  @IsString()
  posicionLeyenda?: string;
}

export class CreateReporteDto {
  @ApiProperty({ description: 'Nombre del reporte', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del reporte' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ 
    description: 'Tipo de reporte',
    enum: TipoReporte,
    enumName: 'TipoReporte'
  })
  @IsEnum(TipoReporte)
  tipo: TipoReporte;

  @ApiProperty({ 
    description: 'Formato de salida',
    enum: FormatoReporte,
    enumName: 'FormatoReporte'
  })
  @IsEnum(FormatoReporte)
  formato: FormatoReporte;

  @ApiPropertyOptional({ 
    description: 'Frecuencia de ejecución',
    enum: FrecuenciaReporte,
    enumName: 'FrecuenciaReporte',
    default: FrecuenciaReporte.UNICA_VEZ
  })
  @IsOptional()
  @IsEnum(FrecuenciaReporte)
  frecuencia?: FrecuenciaReporte;

  @ApiProperty({ 
    description: 'Campos a incluir en el reporte',
    type: [CampoReporteDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampoReporteDto)
  campos: CampoReporteDto[];

  @ApiPropertyOptional({ 
    description: 'Filtros a aplicar',
    type: [FiltroReporteDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FiltroReporteDto)
  filtros?: FiltroReporteDto[];

  @ApiPropertyOptional({ description: 'Configuración de agrupamiento' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  agruparPor?: string[];

  @ApiPropertyOptional({ description: 'Configuración de ordenamiento' })
  @IsOptional()
  @IsObject()
  ordenamiento?: {
    campo: string;
    direccion: 'ASC' | 'DESC';
  }[];

  @ApiPropertyOptional({ description: 'Rango de fechas por defecto' })
  @IsOptional()
  @IsObject()
  rangoFechas?: {
    fechaInicio: string;
    fechaFin: string;
    tipoRango: 'fijo' | 'relativo';
    rangoRelativo?: string; // 'ultimo_mes', 'ultimos_3_meses', etc.
  };

  @ApiPropertyOptional({ 
    description: 'Configuración de gráficos',
    type: [ConfiguracionGraficoDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfiguracionGraficoDto)
  graficos?: ConfiguracionGraficoDto[];

  @ApiPropertyOptional({ description: 'SQL personalizado para reportes avanzados' })
  @IsOptional()
  @IsString()
  consultaPersonalizada?: string;

  @ApiPropertyOptional({ description: 'Parámetros dinámicos del reporte' })
  @IsOptional()
  @IsObject()
  parametros?: {
    [key: string]: {
      tipo: string;
      etiqueta: string;
      valorDefecto?: any;
      opciones?: any[];
      esRequerido: boolean;
    };
  };

  @ApiPropertyOptional({ description: 'Configuración de programación' })
  @IsOptional()
  @IsObject()
  programacion?: {
    fechaInicio: string;
    horaEjecucion: string;
    zonaHoraria: string;
    diasSemana?: number[];
    diaMes?: number;
    notificarPorEmail: boolean;
    emailsNotificacion?: string[];
  };

  @ApiPropertyOptional({ description: 'Configuración de formato y estilo' })
  @IsOptional()
  @IsObject()
  configuracionFormato?: {
    tituloReporte?: string;
    subtitulo?: string;
    logoEmpresa?: boolean;
    piePagina?: string;
    orientacion?: 'portrait' | 'landscape';
    tamañoPapel?: 'A4' | 'Letter' | 'Legal';
    margenes?: {
      superior: number;
      inferior: number;
      izquierdo: number;
      derecho: number;
    };
  };

  @ApiPropertyOptional({ 
    description: 'Etiquetas para categorización',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({ description: 'Si es reporte público para toda la empresa' })
  @IsOptional()
  @IsBoolean()
  esPublico?: boolean;

  @ApiPropertyOptional({ description: 'Si permite edición por otros usuarios' })
  @IsOptional()
  @IsBoolean()
  permiteEdicion?: boolean;

  @ApiPropertyOptional({ description: 'Configuración de caché' })
  @IsOptional()
  @IsObject()
  configuracionCache?: {
    habilitado: boolean;
    tiempoVidaMinutos: number;
    actualizarEnBackground: boolean;
  };

  @ApiPropertyOptional({ description: 'IDs de usuarios con acceso' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usuariosAcceso?: string[];

  @ApiPropertyOptional({ description: 'IDs de roles con acceso' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rolesAcceso?: string[];

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  @IsOptional()
  @IsObject()
  metadatos?: any;
}
