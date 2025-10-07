import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class ContactoDto {
  @ApiProperty({
    description: 'Nombre del contacto',
    example: 'Juan Pérez'
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Cargo del contacto',
    example: 'Gerente Legal'
  })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiProperty({
    description: 'Teléfono del contacto',
    example: '+52 55 1234 5678'
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({
    description: 'Email del contacto',
    example: 'juan.perez@empresa.com'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Departamento del contacto',
    example: 'Legal'
  })
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiProperty({
    description: 'Extensión telefónica',
    example: '1234'
  })
  @IsOptional()
  @IsString()
  extension?: string;
}