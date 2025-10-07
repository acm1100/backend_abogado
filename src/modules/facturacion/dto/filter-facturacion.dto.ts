import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  TipoFactura,
  EstadoFactura,
  MetodoPago,
} from '../../../entities/facturacion.entity';

export class FilterFacturacionDto {
  @ApiPropertyOptional({
    description: 'Buscar por número, receptor o observaciones',
    example: 'ABC S.A.C.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de comprobante',
    enum: TipoFactura,
    example: TipoFactura.FACTURA,
  })
  @IsOptional()
  @IsEnum(TipoFactura)
  tipo?: TipoFactura;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la factura',
    enum: EstadoFactura,
    example: EstadoFactura.EMITIDA,
  })
  @IsOptional()
  @IsEnum(EstadoFactura)
  estado?: EstadoFactura;

  @ApiPropertyOptional({
    description: 'Filtrar por cliente ID',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por caso ID',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por proyecto ID',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por usuario creador ID',
    example: 'uuid-usuario-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  usuarioCreadorId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por moneda',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @IsOptional()
  @IsEnum(['PEN', 'USD', 'EUR'])
  moneda?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por método de pago',
    enum: MetodoPago,
    example: MetodoPago.TRANSFERENCIA,
  })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({
    description: 'Fecha de emisión desde',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaEmisionDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de emisión hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaEmisionHasta?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento desde',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimientoDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimientoHasta?: string;

  @ApiPropertyOptional({
    description: 'Fecha de pago desde',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaPagoDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de pago hasta',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  fechaPagoHasta?: string;

  @ApiPropertyOptional({
    description: 'Monto total mínimo',
    example: 100.00,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value) || undefined)
  montoMinimo?: number;

  @ApiPropertyOptional({
    description: 'Monto total máximo',
    example: 10000.00,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value) || undefined)
  montoMaximo?: number;

  @ApiPropertyOptional({
    description: 'Solo facturas vencidas',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  vencidas?: boolean;

  @ApiPropertyOptional({
    description: 'Solo facturas pagadas',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  pagadas?: boolean;

  @ApiPropertyOptional({
    description: 'Solo facturas anuladas',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  anuladas?: boolean = false;

  @ApiPropertyOptional({
    description: 'Solo facturas activas',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Solo facturas con detracción',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  conDetraccion?: boolean;

  @ApiPropertyOptional({
    description: 'Solo facturas enviadas a SUNAT',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  enviadasSunat?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de documento del receptor',
    example: 'RUC',
    enum: ['DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'],
  })
  @IsOptional()
  @IsEnum(['DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'])
  tipoDocumentoReceptor?: string;

  @ApiPropertyOptional({
    description: 'Número de documento del receptor',
    example: '20123456789',
  })
  @IsOptional()
  @IsString()
  numeroDocumentoReceptor?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value) || 1)
  pagina?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const num = parseInt(value) || 20;
    return Math.min(Math.max(num, 1), 100); // Min 1, Max 100
  })
  limite?: number = 20;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    example: 'fechaEmision',
    enum: [
      'fechaEmision',
      'fechaVencimiento',
      'fechaPago',
      'fechaCreacion',
      'numeroInterno',
      'montoTotal',
      'estado',
      'receptor',
    ],
    default: 'fechaEmision',
  })
  @IsOptional()
  @IsEnum([
    'fechaEmision',
    'fechaVencimiento',
    'fechaPago',
    'fechaCreacion',
    'numeroInterno',
    'montoTotal',
    'estado',
    'receptor',
  ])
  ordenarPor?: string = 'fechaEmision';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  direccion?: 'ASC' | 'DESC' = 'DESC';
}
