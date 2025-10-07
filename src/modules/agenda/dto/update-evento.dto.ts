import { PartialType } from '@nestjs/swagger';
import { CreateEventoDto } from './create-evento.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateEventoDto extends PartialType(CreateEventoDto) {
  @ApiPropertyOptional({
    description: 'Fecha y hora de finalización real del evento',
    example: '2024-02-15T11:45:00Z',
  })
  @IsOptional()
  @IsDateString()
  fechaFinalizacion?: string;
}
