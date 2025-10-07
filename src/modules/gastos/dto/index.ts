export { 
  CreateGastoDto, 
  ComprobanteGastoDto, 
  ProveedorGastoDto 
} from './create-gasto.dto';

export { 
  UpdateGastoDto, 
  UpdateComprobanteGastoDto, 
  UpdateProveedorGastoDto,
  CambiarEstadoGastoDto,
  AsignarGastoDto,
  ReembolsoGastoDto 
} from './update-gasto.dto';

// Tipos adicionales para filtros y consultas
export interface FiltrosGastoDto {
  tipo?: string;
  categoria?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  montoMinimo?: number;
  montoMaximo?: number;
  moneda?: string;
  casoId?: string;
  proyectoId?: string;
  clienteId?: string;
  usuarioId?: string;
  reembolsable?: boolean;
  facturable?: boolean;
  etiquetas?: string[];
  proveedor?: string;
  metodoPago?: string;
  tipoComprobante?: string;
  activo?: boolean;
}

export interface OrdenamientoGastoDto {
  campo: 'fechaGasto' | 'monto' | 'fechaCreacion' | 'estado' | 'descripcion' | 'categoria';
  direccion: 'ASC' | 'DESC';
}

export interface PaginacionGastoDto {
  pagina: number;
  limite: number;
  ordenamiento?: OrdenamientoGastoDto;
}

export interface EstadisticasGastoDto {
  totalGastos: number;
  montoTotal: number;
  porTipo: Record<string, { cantidad: number; monto: number }>;
  porCategoria: Record<string, { cantidad: number; monto: number }>;
  porEstado: Record<string, { cantidad: number; monto: number }>;
  porMoneda: Record<string, { cantidad: number; monto: number }>;
  porMes: Record<string, { cantidad: number; monto: number }>;
  gastosPendientes: number;
  gastosAprobados: number;
  gastosRechazados: number;
  reembolsosPendientes: number;
  montoReembolsable: number;
  gastoPromedio: number;
  proveedoresMasFrecuentes: Array<{
    proveedor: string;
    cantidad: number;
    monto: number;
  }>;
}
