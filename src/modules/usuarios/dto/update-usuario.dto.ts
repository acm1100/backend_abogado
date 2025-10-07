import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del usuario',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de último acceso',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  ultimoAcceso?: string;

  @ApiPropertyOptional({
    description: 'Si el usuario requiere cambio de contraseña',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereCambioPassword?: boolean;
}

export class ChangeUserPasswordDto {
  @ApiPropertyOptional({
    description: 'Nueva contraseña para el usuario',
    example: 'NuevaPassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsOptional()
  newPassword?: string;

  @ApiPropertyOptional({
    description: 'Forzar cambio de contraseña en el próximo login',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean = true;
}
