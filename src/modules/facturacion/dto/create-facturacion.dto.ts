import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  IsObject,
  IsNumber,
  IsDateString,
  Length,
  ValidateNested,
  Min,
  Max,
  IsDecimal,
  IsEmail,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TipoFactura,
  EstadoFactura,
  MetodoPago
} from '../../../entities/facturacion.entity';export class DetalleFacturacionDto {
  @ApiProperty({
    description: 'Descripción del servicio o concepto',
    example: 'Consulta legal - Derecho Civil',
    maxLength: 500,
  })
  @IsString()
  @Length(1, 500)
  descripcion: string;

  @ApiProperty({
    description: 'Cantidad de unidades',
    example: 2,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario (sin impuestos)',
    example: 150.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario: number;

  @ApiPropertyOptional({
    description: 'Descuento aplicado (porcentaje)',
    example: 10.00,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  descuento?: number = 0;

  @ApiPropertyOptional({
    description: 'Tasa de impuesto (porcentaje)',
    example: 18.00, // IGV en Perú
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  tasaImpuesto?: number = 18; // IGV por defecto

  @ApiPropertyOptional({
    description: 'Código de producto o servicio (catálogo SUNAT)',
    example: '80141501',
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  codigoProducto?: string;

  @ApiPropertyOptional({
    description: 'Unidad de medida',
    example: 'HORA',
    enum: ['HORA', 'SERVICIO', 'UNIDAD', 'CONSULTA', 'DOCUMENTO'],
  })
  @IsOptional()
  @IsEnum(['HORA', 'SERVICIO', 'UNIDAD', 'CONSULTA', 'DOCUMENTO'])
  unidadMedida?: string = 'SERVICIO';

  // Campos calculados automáticamente
  subtotal?: number; // cantidad * precioUnitario
  montoDescuento?: number; // subtotal * (descuento / 100)
  baseImponible?: number; // subtotal - montoDescuento
  montoImpuesto?: number; // baseImponible * (tasaImpuesto / 100)
  total?: number; // baseImponible + montoImpuesto
}

export class DatosReceptorDto {
  @ApiProperty({
    description: 'Nombre o razón social del receptor',
    example: 'Empresa ABC S.A.C.',
    maxLength: 200,
  })
  @IsString()
  @Length(1, 200)
  nombre: string;

  @ApiProperty({
    description: 'Tipo de documento de identidad',
    example: 'RUC',
    enum: ['DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'],
  })
  @IsEnum(['DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'])
  tipoDocumento: string;

  @ApiProperty({
    description: 'Número de documento de identidad',
    example: '20123456789',
    maxLength: 20,
  })
  @IsString()
  @Length(1, 20)
  numeroDocumento: string;

  @ApiProperty({
    description: 'Dirección del receptor',
    example: 'Av. Principal 123, Lima, Perú',
    maxLength: 300,
  })
  @IsString()
  @Length(1, 300)
  direccion: string;

  @ApiPropertyOptional({
    description: 'Email del receptor',
    example: 'facturacion@empresaabc.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del receptor',
    example: '+51987654321',
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Ubigeo (código geográfico INEI)',
    example: '150101', // Lima-Lima-Lima
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  ubigeo?: string;
}

export class CreateFacturacionDto {
  @ApiProperty({
    description: 'Tipo de comprobante',
    enum: TipoFactura,
    example: TipoFactura.FACTURA,
  })
  @IsEnum(TipoFactura, {
    message: 'Tipo de facturación no válido',
  })
  tipo: TipoFactura;

  @ApiProperty({
    description: 'ID del cliente al que se factura',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsUUID(4, {
    message: 'Debe proporcionar un ID de cliente válido',
  })
  clienteId: string;

  @ApiPropertyOptional({
    description: 'ID del caso asociado (opcional)',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'ID del proyecto asociado (opcional)',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiProperty({
    description: 'Moneda de facturación',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @IsEnum(['PEN', 'USD', 'EUR'])
  moneda: string;

  @ApiProperty({
    description: 'Fecha de emisión',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaEmision: string;

  @ApiProperty({
    description: 'Fecha de vencimiento',
    example: '2024-02-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaVencimiento: string;

  @ApiProperty({
    description: 'Datos del receptor de la factura',
    type: DatosReceptorDto,
  })
  @ValidateNested()
  @Type(() => DatosReceptorDto)
  receptor: DatosReceptorDto;

  @ApiProperty({
    description: 'Detalle de servicios facturados',
    type: [DetalleFacturacionDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleFacturacionDto)
  detalles: DetalleFacturacionDto[];

  @ApiPropertyOptional({
    description: 'Observaciones o notas',
    example: 'Facturación correspondiente al mes de enero 2024',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Condiciones de pago',
    example: 'Pago al contado - 30 días',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  condicionesPago?: string;

  @ApiPropertyOptional({
    description: 'Método de pago preferido',
    enum: MetodoPago,
    example: MetodoPago.TRANSFERENCIA,
  })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({
    description: 'Descuento global (porcentaje)',
    example: 5.00,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  descuentoGlobal?: number = 0;

  @ApiPropertyOptional({
    description: 'Detracción aplicable (porcentaje)',
    example: 4.00, // Para servicios legales
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  detraccion?: number = 0;

  @ApiPropertyOptional({
    description: 'Estado inicial de la factura',
    enum: EstadoFactura,
    example: EstadoFactura.BORRADOR,
    default: EstadoFactura.BORRADOR,
  })
  @IsOptional()
  @IsEnum(EstadoFactura)
  estado?: EstadoFactura = EstadoFactura.BORRADOR;

  @ApiPropertyOptional({
    description: 'Si debe enviarse automáticamente por email',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enviarEmail?: boolean = true;

  @ApiPropertyOptional({
    description: 'Configuración adicional de facturación',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    facturacionElectronica?: {
      habilitada?: boolean;
      codigoEstablecimiento?: string;
      puntoEmision?: string;
    };
    recordatorios?: {
      previoVencimiento?: number; // días antes
      despuesVencimiento?: number[]; // días después [7, 15, 30]
    };
    plantilla?: {
      id?: string;
      personalizacion?: Record<string, any>;
    };
    exportacion?: {
      formatosPDF?: boolean;
      formatosXML?: boolean;
      incluirQR?: boolean;
    };
  };

  @ApiPropertyOptional({
    description: 'Referencias adicionales',
  })
  @IsOptional()
  @IsObject()
  referencias?: {
    ordenCompra?: string;
    contratoId?: string;
    expediente?: string;
    notaCredito?: string;
    notaDebito?: string;
  };

  @ApiPropertyOptional({
    description: 'Si la factura está activa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;
}
