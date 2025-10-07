import { PartialType } from '@nestjs/swagger';
import { CreateEmpresaDto } from './create-empresa.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {
  @ApiPropertyOptional({
    description: 'Estado activo/inactivo de la empresa',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
