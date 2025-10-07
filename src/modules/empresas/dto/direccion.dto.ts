import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class DireccionDto {
  @ApiProperty({
    description: 'Calle y número',
    example: 'Av. Siempre Viva 123'
  })
  @IsNotEmpty()
  @IsString()
  calle: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Ciudad de México'
  })
  @IsNotEmpty()
  @IsString()
  ciudad: string;

  @ApiProperty({
    description: 'Estado o provincia',
    example: 'CDMX'
  })
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty({
    description: 'Código postal',
    example: '12345'
  })
  @IsOptional()
  @IsString()
  codigoPostal?: string;

  @ApiProperty({
    description: 'País',
    example: 'México'
  })
  @IsNotEmpty()
  @IsString()
  pais: string;

  @ApiProperty({
    description: 'Colonia',
    example: 'Centro'
  })
  @IsOptional()
  @IsString()
  colonia?: string;

  @ApiProperty({
    description: 'Referencias adicionales',
    example: 'Entre calle A y calle B'
  })
  @IsOptional()
  @IsString()
  referencias?: string;
}