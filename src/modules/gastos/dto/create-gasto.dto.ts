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
  IsEmail,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  TipoGasto, 
  EstadoGasto, 
  CategoriaGasto,
  MetodoPagoGasto 
} from '../../../entities/gasto.entity';

export class ComprobanteGastoDto {
  @ApiProperty({
    description: 'Número del comprobante',
    example: 'F001-00000123',
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  numero: string;

  @ApiProperty({
    description: 'Tipo de comprobante',
    example: 'FACTURA',
    enum: ['FACTURA', 'BOLETA', 'RECIBO_HONORARIOS', 'TICKET', 'NOTA_CREDITO', 'NOTA_DEBITO', 'OTROS'],
  })
  @IsEnum(['FACTURA', 'BOLETA', 'RECIBO_HONORARIOS', 'TICKET', 'NOTA_CREDITO', 'NOTA_DEBITO', 'OTROS'])
  tipo: string;

  @ApiProperty({
    description: 'RUC o DNI del emisor',
    example: '20123456789',
    maxLength: 20,
  })
  @IsString()
  @Length(1, 20)
  rucEmisor: string;

  @ApiProperty({
    description: 'Razón social del emisor',
    example: 'Servicios Legales ABC S.A.C.',
    maxLength: 200,
  })
  @IsString()
  @Length(1, 200)
  razonSocialEmisor: string;

  @ApiProperty({
    description: 'Fecha de emisión del comprobante',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaEmision: string;

  @ApiPropertyOptional({
    description: 'Moneda del comprobante',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
    default: 'PEN',
  })
  @IsOptional()
  @IsEnum(['PEN', 'USD', 'EUR'])
  moneda?: string = 'PEN';

  @ApiPropertyOptional({
    description: 'Monto base imponible',
    example: 100.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseImponible?: number;

  @ApiPropertyOptional({
    description: 'Monto de IGV',
    example: 18.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  igv?: number;

  @ApiPropertyOptional({
    description: 'Otros impuestos',
    example: 0.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  otrosImpuestos?: number = 0;

  @ApiProperty({
    description: 'Monto total del comprobante',
    example: 118.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  total: number;
}

export class ProveedorGastoDto {
  @ApiProperty({
    description: 'Nombre o razón social del proveedor',
    example: 'Servicios de Papelería S.A.C.',
    maxLength: 200,
  })
  @IsString()
  @Length(1, 200)
  nombre: string;

  @ApiProperty({
    description: 'Tipo de documento del proveedor',
    example: 'RUC',
    enum: ['DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'],
  })
  @IsEnum(['DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'])
  tipoDocumento: string;

  @ApiProperty({
    description: 'Número de documento del proveedor',
    example: '20987654321',
    maxLength: 20,
  })
  @IsString()
  @Length(1, 20)
  numeroDocumento: string;

  @ApiPropertyOptional({
    description: 'Dirección del proveedor',
    example: 'Av. Comercial 456, Lima',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del proveedor',
    example: '+51987654321',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Email del proveedor',
    example: 'ventas@papeleria.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateGastoDto {
  @ApiProperty({
    description: 'Descripción del gasto',
    example: 'Compra de materiales de oficina para el caso ABC',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @Length(5, 500, {
    message: 'La descripción debe tener entre 5 y 500 caracteres',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de gasto',
    enum: TipoGasto,
    example: TipoGasto.OPERATIVO,
  })
  @IsEnum(TipoGasto, {
    message: 'Tipo de gasto no válido',
  })
  tipo: TipoGasto;

  @ApiProperty({
    description: 'Categoría del gasto',
    enum: CategoriaGasto,
    example: CategoriaGasto.MATERIALES_OFICINA,
  })
  @IsEnum(CategoriaGasto, {
    message: 'Categoría de gasto no válida',
  })
  categoria: CategoriaGasto;

  @ApiProperty({
    description: 'Monto del gasto',
    example: 150.50,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, {
    message: 'El monto debe ser mayor a 0',
  })
  monto: number;

  @ApiProperty({
    description: 'Moneda del gasto',
    example: 'PEN',
    enum: ['PEN', 'USD', 'EUR'],
  })
  @IsEnum(['PEN', 'USD', 'EUR'], {
    message: 'Moneda no válida',
  })
  moneda: string;

  @ApiProperty({
    description: 'Fecha del gasto',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString({}, {
    message: 'Fecha del gasto no válida',
  })
  fechaGasto: string;

  @ApiProperty({
    description: 'Método de pago utilizado',
    enum: MetodoPagoGasto,
    example: MetodoPagoGasto.EFECTIVO,
  })
  @IsEnum(MetodoPagoGasto, {
    message: 'Método de pago no válido',
  })
  metodoPago: MetodoPagoGasto;

  @ApiPropertyOptional({
    description: 'ID del caso asociado',
    example: 'uuid-caso-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  casoId?: string;

  @ApiPropertyOptional({
    description: 'ID del proyecto asociado',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'ID del cliente asociado (para gastos reembolsables)',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  clienteId?: string;

  @ApiProperty({
    description: 'Información del comprobante',
    type: ComprobanteGastoDto,
  })
  @ValidateNested()
  @Type(() => ComprobanteGastoDto)
  comprobante: ComprobanteGastoDto;

  @ApiProperty({
    description: 'Información del proveedor',
    type: ProveedorGastoDto,
  })
  @ValidateNested()
  @Type(() => ProveedorGastoDto)
  proveedor: ProveedorGastoDto;

  @ApiPropertyOptional({
    description: 'Si el gasto es reembolsable al cliente',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reembolsable?: boolean = false;

  @ApiPropertyOptional({
    description: 'Si el gasto es facturable al cliente',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  facturable?: boolean = true;

  @ApiPropertyOptional({
    description: 'Porcentaje de markup para facturación',
    example: 15.00,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeMarkup?: number = 0;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Gasto urgente aprobado por el director',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Estado inicial del gasto',
    enum: EstadoGasto,
    example: EstadoGasto.PENDIENTE,
    default: EstadoGasto.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(EstadoGasto)
  estado?: EstadoGasto = EstadoGasto.PENDIENTE;

  @ApiPropertyOptional({
    description: 'Etiquetas del gasto',
    example: ['urgente', 'caso-abc', 'reembolsable'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim());
    }
    return value;
  })
  etiquetas?: string[];

  @ApiPropertyOptional({
    description: 'Configuración específica del gasto',
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    aprobacion?: {
      requiereAprobacion?: boolean;
      montoMaximoSinAprobacion?: number;
      aprobadores?: string[];
    };
    reembolso?: {
      cuentaBancaria?: string;
      formaPago?: string;
      plazoReembolso?: number; // días
    };
    facturacion?: {
      incluirEnFactura?: boolean;
      centroCoston?: string;
      codigoPresupuesto?: string;
    };
    contabilidad?: {
      cuentaContable?: string;
      centroCosto?: string;
      unidadNegocio?: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Información de kilometraje (para gastos de transporte)',
  })
  @IsOptional()
  @IsObject()
  kilometraje?: {
    origen?: string;
    destino?: string;
    kilometros?: number;
    tarifaPorKm?: number;
    vehiculo?: string;
    matricula?: string;
  };

  @ApiPropertyOptional({
    description: 'Si el gasto está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Archivos adjuntos (IDs de documentos)',
    example: ['uuid-documento-1', 'uuid-documento-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  documentosAdjuntos?: string[];
}
