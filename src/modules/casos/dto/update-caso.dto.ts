import { PartialType } from '@nestjs/swagger';
import { CreateCasoDto } from './create-caso.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCaso } from '../../../entities/caso.entity';

export class UpdateCasoDto extends PartialType(CreateCasoDto) {
  @ApiPropertyOptional({
    description: 'Cambiar estado del caso',
    enum: EstadoCaso,
    example: EstadoCaso.EN_PROCESO,
  })
  @IsOptional()
  @IsEnum(EstadoCaso, {
    message: 'Estado de caso no válido',
  })
  estado?: EstadoCaso;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Se asignó abogado responsable y se inició el proceso',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoCambio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de última actualización del estado',
    example: '2024-01-16T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaUltimaActualizacion?: string;

  @ApiPropertyOptional({
    description: 'Notas internas del caso',
    example: 'Cliente solicitó reunión urgente para revisar estrategia legal',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notasInternas?: string;

  @ApiPropertyOptional({
    description: 'Resolución del caso (cuando se cierra)',
    example: 'Caso resuelto favorablemente mediante conciliación extrajudicial',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  resolucion?: string;

  @ApiPropertyOptional({
    description: 'Fecha de resolución del caso',
    example: '2024-06-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaResolucion?: string;
}
