import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsArray,
  Length,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NivelRol } from '../../../entities/rol.entity';

export class CreateRolDto {
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Abogado Senior',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50, {
    message: 'El nombre del rol debe tener entre 2 y 50 caracteres',
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del rol',
    example: 'Abogado con experiencia que puede gestionar casos complejos',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  descripcion?: string;

  @ApiProperty({
    description: 'Nivel jerárquico del rol (1 = más alto, 10 = más bajo)',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1, { message: 'El nivel debe ser al menos 1' })
  @Max(10, { message: 'El nivel no puede ser mayor a 10' })
  nivel: NivelRol;

  @ApiPropertyOptional({
    description: 'Lista de IDs de permisos asignados al rol',
    example: ['uuid-permiso-1', 'uuid-permiso-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true, message: 'Cada permiso debe ser un UUID válido' })
  permisos?: string[];

  @ApiPropertyOptional({
    description: 'Estado activo del rol',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'ID de la empresa (se asigna automáticamente si no se proporciona)',
    example: 'uuid-empresa-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  empresaId?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Lista de IDs de permisos a asignar al rol',
    example: ['uuid-permiso-1', 'uuid-permiso-2', 'uuid-permiso-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID(4, { each: true, message: 'Cada permiso debe ser un UUID válido' })
  permisos: string[];
}
