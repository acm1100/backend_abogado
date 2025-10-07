import { PartialType, OmitType } from '@nestjs/swagger';
import { 
  CreateRegistroTiempoDto, 
  EstadoRegistroTiempo,
  TipoRegistroTiempo,
  CategoriaTiempo,
  ConfiguracionFacturacionDto 
} from './create-registro-tiempo.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsNumber,
  Length,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRegistroTiempoDto extends PartialType(CreateRegistroTiempoDto) {
  @ApiPropertyOptional({
    description: 'Motivo de la actualización',
    example: 'Corrección en las horas registradas por error de cálculo',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivoActualizacion?: string;
}

export class CambiarEstadoRegistroDto {
  @ApiPropertyOptional({
    description: 'Nuevo estado del registro',
    enum: EstadoRegistroTiempo,
    example: EstadoRegistroTiempo.APROBADO,
  })
  @IsEnum(EstadoRegistroTiempo, {
    message: 'Estado de registro no válido',
  })
  estado: EstadoRegistroTiempo;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Aprobado tras revisión de supervisor',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Observaciones del revisor',
    example: 'Registro correcto, tiempo justificado apropiadamente',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacionesRevisor?: string;

  @ApiPropertyOptional({
    description: 'ID del revisor/aprobador',
    example: 'uuid-revisor-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  revisorId?: string;

  @ApiPropertyOptional({
    description: 'Fecha de revisión',
    example: '2024-01-16T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  fechaRevision?: string;

  @ApiPropertyOptional({
    description: 'Ajustes aplicados al registro',
    type: 'object',
  })
  @IsOptional()
  ajustesAplicados?: {
    horasOriginales?: number;
    horasAjustadas?: number;
    tarifaOriginal?: number;
    tarifaAjustada?: number;
    motivosAjuste?: string[];
  };
}

export class AprobarRegistroDto {
  @ApiPropertyOptional({
    description: 'Observaciones de aprobación',
    example: 'Registro aprobado sin observaciones',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Ajustar horas si es necesario',
    example: 3.5,
    minimum: 0.1,
    maximum: 24,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(24)
  horasAjustadas?: number;

  @ApiPropertyOptional({
    description: 'Ajustar tarifa si es necesario',
    example: 120.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaAjustada?: number;

  @ApiPropertyOptional({
    description: 'Motivo de los ajustes',
    example: 'Tarifa especial por complejidad del caso',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  motivoAjustes?: string;

  @ApiPropertyOptional({
    description: 'Aprobar automáticamente registros similares del mismo usuario',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoAprobarSimilares?: boolean = false;
}

export class RechazarRegistroDto {
  @ApiPropertyOptional({
    description: 'Motivos del rechazo',
    example: 'Descripción insuficiente de las actividades realizadas',
    maxLength: 1000,
  })
  @IsString()
  @Length(1, 1000)
  motivosRechazo: string;

  @ApiPropertyOptional({
    description: 'Campos específicos que requieren corrección',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  camposACorregir?: string[];

  @ApiPropertyOptional({
    description: 'Sugerencias para mejorar el registro',
    example: 'Incluir más detalle sobre los documentos revisados',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  sugerenciasMejora?: string;

  @ApiPropertyOptional({
    description: 'Permitir reenvío después de correcciones',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  permitirReenvio?: boolean = true;

  @ApiPropertyOptional({
    description: 'Notificar al usuario sobre el rechazo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  notificarUsuario?: boolean = true;
}

export class MarcarFacturadoDto {
  @ApiPropertyOptional({
    description: 'ID de la factura asociada',
    example: 'uuid-factura-123',
    format: 'uuid',
  })
  @IsUUID(4)
  facturaId: string;

  @ApiPropertyOptional({
    description: 'Número de factura',
    example: 'F001-00000123',
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  numeroFactura: string;

  @ApiPropertyOptional({
    description: 'Fecha de facturación',
    example: '2024-01-20',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaFacturacion: string;

  @ApiPropertyOptional({
    description: 'Monto facturado (puede diferir del calculado)',
    example: 525.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoFacturado?: number;

  @ApiPropertyOptional({
    description: 'Observaciones de facturación',
    example: 'Incluido en factura mensual del cliente',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  observacionesFacturacion?: string;
}

export class ActualizarConfiguracionFacturacionDto extends PartialType(ConfiguracionFacturacionDto) {
  @ApiPropertyOptional({
    description: 'Motivo del cambio en configuración',
    example: 'Aplicación de tarifa especial por acuerdo con cliente',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  motivoCambio?: string;
}

export class RegistrarDescansoDto {
  @ApiPropertyOptional({
    description: 'Hora de inicio del descanso',
    example: '12:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Length(5, 5)
  horaInicioDescanso: string;

  @ApiPropertyOptional({
    description: 'Hora de fin del descanso',
    example: '13:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Length(5, 5)
  horaFinDescanso: string;

  @ApiPropertyOptional({
    description: 'Tipo de descanso',
    example: 'ALMUERZO',
    enum: ['ALMUERZO', 'DESCANSO_CORTO', 'DESCANSO_PERSONAL', 'OTRO'],
  })
  @IsOptional()
  @IsEnum(['ALMUERZO', 'DESCANSO_CORTO', 'DESCANSO_PERSONAL', 'OTRO'])
  tipoDescanso?: string = 'ALMUERZO';

  @ApiPropertyOptional({
    description: 'Observaciones del descanso',
    example: 'Reunión de trabajo durante almuerzo',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  observaciones?: string;
}

export class CopiarRegistroDto {
  @ApiPropertyOptional({
    description: 'Fecha para el nuevo registro',
    example: '2024-01-16',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  nuevaFecha: string;

  @ApiPropertyOptional({
    description: 'Ajustar descripción automáticamente',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ajustarDescripcion?: boolean = true;

  @ApiPropertyOptional({
    description: 'Campos a modificar en la copia',
    type: 'object',
  })
  @IsOptional()
  camposModificar?: {
    descripcion?: string;
    horaInicio?: string;
    horaFin?: string;
    totalHoras?: number;
    tipo?: TipoRegistroTiempo;
    categoria?: CategoriaTiempo;
  };

  @ApiPropertyOptional({
    description: 'Mantener configuración de facturación',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  mantenerConfiguracionFacturacion?: boolean = true;
}

export class GenerarReporteRegistrosDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio del reporte',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaInicio: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del reporte',
    example: '2024-01-31',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  fechaFin: string;

  @ApiPropertyOptional({
    description: 'Filtrar por cliente específico',
    example: 'uuid-cliente-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por proyecto específico',
    example: 'uuid-proyecto-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4)
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de registro',
    enum: EstadoRegistroTiempo,
  })
  @IsOptional()
  @IsEnum(EstadoRegistroTiempo)
  estado?: EstadoRegistroTiempo;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría',
    enum: CategoriaTiempo,
  })
  @IsOptional()
  @IsEnum(CategoriaTiempo)
  categoria?: CategoriaTiempo;

  @ApiPropertyOptional({
    description: 'Incluir solo registros facturables',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  soloFacturables?: boolean = false;

  @ApiPropertyOptional({
    description: 'Formato del reporte',
    example: 'PDF',
    enum: ['PDF', 'EXCEL', 'CSV', 'JSON'],
  })
  @IsOptional()
  @IsEnum(['PDF', 'EXCEL', 'CSV', 'JSON'])
  formato?: string = 'PDF';

  @ApiPropertyOptional({
    description: 'Incluir detalles de actividades',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  incluirDetalles?: boolean = true;

  @ApiPropertyOptional({
    description: 'Incluir análisis financiero',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  incluirAnalisisFinanciero?: boolean = false;

  @ApiPropertyOptional({
    description: 'Agrupar por período',
    example: 'DIARIO',
    enum: ['DIARIO', 'SEMANAL', 'MENSUAL'],
  })
  @IsOptional()
  @IsEnum(['DIARIO', 'SEMANAL', 'MENSUAL'])
  agruparPor?: string = 'DIARIO';

  @ApiPropertyOptional({
    description: 'Incluir gráficos estadísticos',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  incluirGraficos?: boolean = false;
}

export class ConfigurarNotificacionesDto {
  @ApiPropertyOptional({
    description: 'Notificaciones de recordatorio diario',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  recordatorioDiario?: boolean = true;

  @ApiPropertyOptional({
    description: 'Hora del recordatorio diario',
    example: '18:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  horaRecordatorio?: string = '18:00';

  @ApiPropertyOptional({
    description: 'Notificar cuando se aprueba un registro',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  notificarAprobacion?: boolean = true;

  @ApiPropertyOptional({
    description: 'Notificar cuando se rechaza un registro',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  notificarRechazo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Notificar al facturar registros',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notificarFacturacion?: boolean = false;

  @ApiPropertyOptional({
    description: 'Envío de resumen semanal',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  resumenSemanal?: boolean = true;

  @ApiPropertyOptional({
    description: 'Día de la semana para envío de resumen',
    example: 'VIERNES',
    enum: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'],
  })
  @IsOptional()
  @IsEnum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'])
  diaResumenSemanal?: string = 'VIERNES';

  @ApiPropertyOptional({
    description: 'Canales de notificación preferidos',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'SLACK'], { each: true })
  canalesPreferidos?: string[] = ['EMAIL'];
}
