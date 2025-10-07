import { ApiProperty } from '@nestjs/swagger';

export class EmpresaInfoDto {
  @ApiProperty({
    description: 'ID de la empresa',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Razón social de la empresa',
    example: 'Bufete Legal SAC',
  })
  razonSocial: string;

  @ApiProperty({
    description: 'RUC de la empresa',
    example: '20123456789',
  })
  ruc: string;

  @ApiProperty({
    description: 'Estado activo de la empresa',
    example: true,
  })
  activo: boolean;
}

export class RolInfoDto {
  @ApiProperty({
    description: 'ID del rol',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Administrador',
  })
  nombre: string;

  @ApiProperty({
    description: 'Nivel jerárquico del rol',
    example: 1,
  })
  nivel: number;

  @ApiProperty({
    description: 'Lista de permisos del rol',
    type: [String],
    example: ['usuarios.crear', 'usuarios.leer', 'casos.gestionar'],
  })
  permisos: string[];
}

export class UserInfoDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@bufete.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez García',
  })
  nombreCompleto: string;

  @ApiProperty({
    description: 'Información de la empresa',
  })
  empresa: EmpresaInfoDto;

  @ApiProperty({
    description: 'Información del rol',
    nullable: true,
  })
  rol: RolInfoDto | null;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha del último acceso',
    example: '2024-01-01T12:00:00Z',
  })
  ultimoAcceso: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de refresco',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tiempo de expiración del token en segundos',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información del usuario autenticado',
  })
  user: UserInfoDto;
}
