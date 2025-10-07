import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateReporteDto, EstadoReporte } from './create-reporte.dto';
import { IsOptional, IsEnum, IsString, IsObject, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdateReporteDto extends PartialType(CreateReporteDto) {
  @ApiPropertyOptional({ 
    description: 'Estado del reporte',
    enum: EstadoReporte,
    enumName: 'EstadoReporte'
  })
  @IsOptional()
  @IsEnum(EstadoReporte)
  estado?: EstadoReporte;

  @ApiPropertyOptional({ description: 'Fecha de última ejecución' })
  @IsOptional()
  @IsDateString()
  fechaUltimaEjecucion?: string;

  @ApiPropertyOptional({ description: 'Número de ejecuciones realizadas' })
  @IsOptional()
  numeroEjecuciones?: number;

  @ApiPropertyOptional({ description: 'Mensaje de error si existe' })
  @IsOptional()
  @IsString()
  mensajeError?: string;
}

export class EjecutarReporteDto {
  @ApiPropertyOptional({ description: 'Parámetros para la ejecución' })
  @IsOptional()
  @IsObject()
  parametros?: { [key: string]: any };

  @ApiPropertyOptional({ description: 'Rango de fechas personalizado' })
  @IsOptional()
  @IsObject()
  rangoFechas?: {
    fechaInicio: string;
    fechaFin: string;
  };

  @ApiPropertyOptional({ description: 'Filtros adicionales para esta ejecución' })
  @IsOptional()
  @IsArray()
  filtrosAdicionales?: any[];

  @ApiPropertyOptional({ description: 'Formato de salida específico para esta ejecución' })
  @IsOptional()
  @IsString()
  formatoSalida?: string;

  @ApiPropertyOptional({ description: 'Si enviar por email' })
  @IsOptional()
  enviarPorEmail?: boolean;

  @ApiPropertyOptional({ description: 'Emails adicionales para envío' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailsAdicionales?: string[];
}

export class ProgramarReporteDto {
  @ApiProperty({ description: 'Nueva configuración de programación' })
  @IsObject()
  programacion: {
    fechaInicio: string;
    horaEjecucion: string;
    zonaHoraria: string;
    diasSemana?: number[];
    diaMes?: number;
    notificarPorEmail: boolean;
    emailsNotificacion?: string[];
  };

  @ApiPropertyOptional({ description: 'Si activar la programación inmediatamente' })
  @IsOptional()
  activarInmediatamente?: boolean;
}

export class CompartirReporteDto {
  @ApiProperty({ description: 'IDs de usuarios para compartir' })
  @IsArray()
  @IsString({ each: true })
  usuariosIds: string[];

  @ApiPropertyOptional({ description: 'IDs de roles para compartir' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rolesIds?: string[];

  @ApiPropertyOptional({ description: 'Permisos específicos', enum: ['solo_lectura', 'lectura_ejecucion', 'completo'] })
  @IsOptional()
  @IsString()
  nivelPermiso?: string;

  @ApiPropertyOptional({ description: 'Mensaje al compartir' })
  @IsOptional()
  @IsString()
  mensaje?: string;
}

export class ExportarReporteDto {
  @ApiProperty({ description: 'Formato de exportación', enum: ['pdf', 'excel', 'csv', 'json'] })
  @IsString()
  formato: string;

  @ApiPropertyOptional({ description: 'Incluir gráficos en la exportación' })
  @IsOptional()
  incluirGraficos?: boolean;

  @ApiPropertyOptional({ description: 'Configuración específica del formato' })
  @IsOptional()
  @IsObject()
  configuracionFormato?: any;

  @ApiPropertyOptional({ description: 'Filtros para los datos a exportar' })
  @IsOptional()
  @IsObject()
  filtros?: any;
}
