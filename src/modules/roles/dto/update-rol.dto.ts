import { PartialType } from '@nestjs/swagger';
import { CreateRolDto } from './create-rol.dto';
import { IsOptional, IsBoolean, IsArray, IsString, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRolDto extends PartialType(CreateRolDto) {
  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del rol',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Si el rol está siendo usado actualmente',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  esActivo?: boolean;
}

export class AsignarPermisosDto {
  @ApiProperty({
    description: 'Lista de IDs de permisos para asignar al rol',
    example: ['perm-uuid-1', 'perm-uuid-2', 'perm-uuid-3'],
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe especificar al menos un permiso' })
  @IsUUID('4', { each: true, message: 'Cada ID de permiso debe ser un UUID válido' })
  permisosIds: string[];

  @ApiPropertyOptional({
    description: 'Si debe reemplazar todos los permisos existentes o agregar a los actuales',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  reemplazarExistentes?: boolean;
}

export class AsignarUsuariosDto {
  @ApiProperty({
    description: 'Lista de IDs de usuarios para asignar al rol',
    example: ['user-uuid-1', 'user-uuid-2', 'user-uuid-3'],
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe especificar al menos un usuario' })
  @IsUUID('4', { each: true, message: 'Cada ID de usuario debe ser un UUID válido' })
  usuariosIds: string[];

  @ApiPropertyOptional({
    description: 'Si debe reemplazar todos los usuarios existentes o agregar a los actuales',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  reemplazarExistentes?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de expiración de la asignación del rol (opcional)',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsString()
  fechaExpiracion?: string;
}

export class ClonarRolDto {
  @ApiProperty({
    description: 'Nombre para el nuevo rol clonado',
    example: 'Abogado Senior (Copia)',
    maxLength: 100
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción para el nuevo rol clonado',
    example: 'Copia del rol Abogado Senior con los mismos permisos'
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Si debe copiar también los usuarios asignados',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  copiarUsuarios?: boolean;

  @ApiPropertyOptional({
    description: 'Si debe copiar todos los permisos del rol original',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  copiarPermisos?: boolean;
}

export class CambiarEstadoRolDto {
  @ApiProperty({
    description: 'Nuevo estado del rol',
    example: true
  })
  @IsBoolean()
  esActivo: boolean;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Rol desactivado por reestructuración organizacional'
  })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Si debe notificar a los usuarios afectados',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  notificarUsuarios?: boolean;
}

export class BuscarRolesDto {
  @ApiPropertyOptional({
    description: 'Término de búsqueda en nombre y descripción',
    example: 'abogado'
  })
  @IsOptional()
  @IsString()
  buscar?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo/inactivo',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  esActivo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar solo roles del sistema',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  soloSistema?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar solo roles personalizados',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  soloPersonalizados?: boolean;

  @ApiPropertyOptional({
    description: 'Campo para ordenar resultados',
    example: 'nombre',
    enum: ['nombre', 'fechaCreacion', 'cantidadUsuarios']
  })
  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    example: 'ASC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  orden?: 'ASC' | 'DESC';
}
