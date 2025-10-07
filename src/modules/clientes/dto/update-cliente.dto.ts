import { PartialType } from '@nestjs/swagger';
import { CreateClienteDto } from './create-cliente.dto';
import { IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del cliente',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de último contacto',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaUltimoContacto?: string;

  @ApiPropertyOptional({
    description: 'Estado del cliente',
    example: 'ACTIVO',
    enum: ['ACTIVO', 'INACTIVO', 'PROSPECTO', 'BLOQUEADO'],
  })
  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO', 'PROSPECTO', 'BLOQUEADO'])
  estado?: string;
}
