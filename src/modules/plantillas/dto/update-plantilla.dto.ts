import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePlantillaDto, EstadoPlantilla } from './create-plantilla.dto';
import { IsOptional, IsEnum, IsString, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdatePlantillaDto extends PartialType(CreatePlantillaDto) {
  @ApiPropertyOptional({ 
    description: 'Estado de la plantilla',
    enum: EstadoPlantilla,
    enumName: 'EstadoPlantilla'
  })
  @IsOptional()
  @IsEnum(EstadoPlantilla)
  estado?: EstadoPlantilla;

  @ApiPropertyOptional({ description: 'Motivo del cambio de estado' })
  @IsOptional()
  @IsString()
  motivoCambioEstado?: string;
}

export class GenerarDocumentoDto {
  @ApiPropertyOptional({ description: 'Valores para las variables de la plantilla' })
  @IsOptional()
  @IsObject()
  variables?: { [key: string]: any };

  @ApiPropertyOptional({ description: 'Secciones a incluir en el documento' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seccionesIncluir?: string[];

  @ApiPropertyOptional({ description: 'Configuración específica para la generación' })
  @IsOptional()
  @IsObject()
  configuracion?: {
    formato?: string;
    incluirEncabezado?: boolean;
    incluirPiePagina?: boolean;
    aplicarEstilos?: boolean;
    numerarPaginas?: boolean;
  };

  @ApiPropertyOptional({ description: 'Datos del caso relacionado' })
  @IsOptional()
  @IsString()
  casoId?: string;

  @ApiPropertyOptional({ description: 'Datos del cliente relacionado' })
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'Datos del proyecto relacionado' })
  @IsOptional()
  @IsString()
  proyectoId?: string;

  @ApiPropertyOptional({ description: 'Nombre personalizado para el documento generado' })
  @IsOptional()
  @IsString()
  nombreDocumento?: string;
}

export class ValidarPlantillaDto {
  @ApiPropertyOptional({ description: 'Validar sintaxis de variables' })
  @IsOptional()
  validarVariables?: boolean;

  @ApiPropertyOptional({ description: 'Validar estructura del contenido' })
  @IsOptional()
  validarEstructura?: boolean;

  @ApiPropertyOptional({ description: 'Validar formato de salida' })
  @IsOptional()
  validarFormato?: boolean;
}

export class ClonarPlantillaDto {
  @ApiProperty({ description: 'Nuevo nombre para la plantilla clonada' })
  @IsString()
  nuevoNombre: string;

  @ApiPropertyOptional({ description: 'Nueva descripción' })
  @IsOptional()
  @IsString()
  nuevaDescripcion?: string;

  @ApiPropertyOptional({ description: 'Si debe mantener las mismas variables' })
  @IsOptional()
  mantenerVariables?: boolean;

  @ApiPropertyOptional({ description: 'Si debe mantener la misma configuración' })
  @IsOptional()
  mantenerConfiguracion?: boolean;
}

export class VersionarPlantillaDto {
  @ApiProperty({ description: 'Nueva versión' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ description: 'Notas sobre los cambios' })
  @IsOptional()
  @IsString()
  notasCambios?: string;

  @ApiPropertyOptional({ description: 'Si es una versión mayor' })
  @IsOptional()
  esMayor?: boolean;
}
