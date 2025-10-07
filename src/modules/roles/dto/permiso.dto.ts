import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermisoDto {
  @ApiProperty({
    description: 'Código único del permiso',
    example: 'casos.crear',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50, {
    message: 'El código del permiso debe tener entre 3 y 50 caracteres',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre descriptivo del permiso',
    example: 'Crear casos',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100, {
    message: 'El nombre del permiso debe tener entre 3 y 100 caracteres',
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del permiso',
    example: 'Permite crear nuevos casos legales en el sistema',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  descripcion?: string;

  @ApiProperty({
    description: 'Módulo al que pertenece el permiso',
    example: 'casos',
  })
  @IsString()
  @Length(2, 30)
  modulo: string;

  @ApiProperty({
    description: 'Acción específica del permiso',
    example: 'crear',
    enum: ['crear', 'leer', 'editar', 'eliminar', 'administrar', 'listar', 'ver', 'buscar', 'estadisticas', 'exportar'],
  })
  @IsEnum(['crear', 'leer', 'editar', 'eliminar', 'administrar', 'listar', 'ver', 'buscar', 'estadisticas', 'exportar'], {
    message: 'La acción debe ser una de las acciones válidas',
  })
  accion: string;

  @ApiPropertyOptional({
    description: 'Estado activo del permiso',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;
}

export class UpdatePermisoDto {
  @ApiPropertyOptional({
    description: 'Nombre descriptivo del permiso',
    example: 'Crear casos',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del permiso',
    example: 'Permite crear nuevos casos legales en el sistema',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Estado activo del permiso',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
