import { PartialType } from '@nestjs/swagger';
import { CreateFacturacionDto } from './create-facturacion.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsObject,
  Length,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoFactura, MetodoPago } from '../../../entities/facturacion.entity';

export class UpdateFacturacionDto extends PartialType(CreateFacturacionDto) {
  @ApiPropertyOptional({
    description: 'Cambiar estado de la factura',
    enum: EstadoFactura,
    example: EstadoFactura.EMITIDA,
  })
  @IsOptional()
  @IsEnum(EstadoFactura, {
    message: 'Estado de facturación no válido',
  })
  estado?: EstadoFactura;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Factura emitida y enviada al cliente por email',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoCambio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de pago recibido',
    example: '2024-01-20T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaPago?: string;

  @ApiPropertyOptional({
    description: 'Monto pagado (puede ser parcial)',
    example: 1000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoPagado?: number;

  @ApiPropertyOptional({
    description: 'Método utilizado para el pago',
    enum: MetodoPago,
    example: MetodoPago.TRANSFERENCIA,
  })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPagoUtilizado?: MetodoPago;

  @ApiPropertyOptional({
    description: 'Referencia o comprobante del pago',
    example: 'TXN-20240120-001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  referenciaPago?: string;

  @ApiPropertyOptional({
    description: 'Número asignado por SUNAT (facturación electrónica)',
    example: 'F001-00000123',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  numeroSunat?: string;

  @ApiPropertyOptional({
    description: 'CDR (Constancia de Recepción) de SUNAT',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  cdrSunat?: string;

  @ApiPropertyOptional({
    description: 'Hash del documento XML para SUNAT',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @Length(0, 128)
  hashDocumento?: string;

  @ApiPropertyOptional({
    description: 'Fecha de envío a SUNAT',
    example: '2024-01-16T09:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaEnvioSunat?: string;

  @ApiPropertyOptional({
    description: 'Fecha de aceptación por SUNAT',
    example: '2024-01-16T09:05:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaAceptacionSunat?: string;

  @ApiPropertyOptional({
    description: 'Si la factura fue anulada',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  anulada?: boolean = false;

  @ApiPropertyOptional({
    description: 'Motivo de anulación',
    example: 'Error en datos del cliente',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoAnulacion?: string;

  @ApiPropertyOptional({
    description: 'Fecha de anulación',
    example: '2024-01-17T14:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaAnulacion?: string;

  @ApiPropertyOptional({
    description: 'Usuario que anuló la factura',
    example: 'uuid-usuario-anulador',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  anuladaPor?: string;

  @ApiPropertyOptional({
    description: 'Notas internas de seguimiento',
    example: 'Cliente solicitó modificación de fecha de vencimiento',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notasInternas?: string;

  @ApiPropertyOptional({
    description: 'Información de recordatorios enviados',
  })
  @IsOptional()
  @IsObject()
  recordatoriosEnviados?: {
    previoVencimiento?: {
      fecha?: string;
      enviado?: boolean;
      respuesta?: string;
    };
    vencido?: Array<{
      diasVencido?: number;
      fecha?: string;
      enviado?: boolean;
      respuesta?: string;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Información de retención (si aplica)',
  })
  @IsOptional()
  @IsObject()
  retencion?: {
    aplicaRetencion?: boolean;
    porcentaje?: number;
    monto?: number;
    numeroConstancia?: string;
    fechaConstancia?: string;
  };

  @ApiPropertyOptional({
    description: 'Información de detracción (si aplica)',
  })
  @IsOptional()
  @IsObject()
  infoDetraccion?: {
    numeroConstancia?: string;
    fechaDeposito?: string;
    entidadFinanciera?: string;
    numeroCuenta?: string;
  };

  @ApiPropertyOptional({
    description: 'Tasa de cambio utilizada (para moneda extranjera)',
    example: 3.75,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  tipoCambio?: number;

  @ApiPropertyOptional({
    description: 'Equivalente en soles (para moneda extranjera)',
    example: 3750.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  equivalenteSoles?: number;
}
