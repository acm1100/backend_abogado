import { PartialType } from '@nestjs/swagger';
import { CreateDocumentoDto } from './create-documento.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsUUID,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDocumento } from '../../../entities/documentacion.entity';

export class UpdateDocumentoDto extends PartialType(CreateDocumentoDto) {
  @ApiPropertyOptional({
    description: 'Cambiar estado del documento',
    enum: EstadoDocumento,
    example: EstadoDocumento.PUBLICADO,
  })
  @IsOptional()
  @IsEnum(EstadoDocumento, {
    message: 'Estado de documento no válido',
  })
  estado?: EstadoDocumento;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Documento revisado y aprobado por el área legal',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoCambio?: string;

  @ApiPropertyOptional({
    description: 'Usuario que aprobó el documento',
    example: 'uuid-usuario-aprobador',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  aprobadoPor?: string;

  @ApiPropertyOptional({
    description: 'Fecha de aprobación',
    example: '2024-01-16T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaAprobacion?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento del documento',
    example: '2025-01-15',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @ApiPropertyOptional({
    description: 'Notas de revisión',
    example: 'Se actualizaron las cláusulas según las nuevas normativas',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notasRevision?: string;

  @ApiPropertyOptional({
    description: 'Si el documento ha sido firmado digitalmente',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  firmado?: boolean = false;

  @ApiPropertyOptional({
    description: 'Información de la firma digital',
  })
  @IsOptional()
  firmaDigital?: {
    firmadoPor?: string;
    fechaFirma?: string;
    certificado?: string;
    algoritmo?: string;
    valida?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Índice de contenido para búsquedas',
    example: 'contrato de arrendamiento clausulas penalidades...',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  indiceContenido?: string;
}
