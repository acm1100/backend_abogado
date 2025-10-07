import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum TipoCondicion {
  CAMPO_VALOR = 'campo_valor',
  ESTADO_CASO = 'estado_caso',
  FECHA_LIMITE = 'fecha_limite',
  USUARIO_ASIGNADO = 'usuario_asignado',
  DOCUMENTO_PRESENTE = 'documento_presente',
  APROBACION_REQUERIDA = 'aprobacion_requerida'
}

export enum OperadorCondicion {
  IGUAL = 'igual',
  DIFERENTE = 'diferente',
  MAYOR = 'mayor',
  MENOR = 'menor',
  CONTIENE = 'contiene',
  NO_CONTIENE = 'no_contiene',
  VACIO = 'vacio',
  NO_VACIO = 'no_vacio'
}

export class CondicionPasoDto {
  @ApiProperty({
    description: 'Nombre de la condición',
    example: 'Verificar estado del caso'
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Tipo de condición',
    enum: TipoCondicion,
    example: TipoCondicion.ESTADO_CASO
  })
  @IsNotEmpty()
  @IsEnum(TipoCondicion)
  tipo: TipoCondicion;

  @ApiProperty({
    description: 'Campo a evaluar',
    example: 'estado'
  })
  @IsNotEmpty()
  @IsString()
  campo: string;

  @ApiProperty({
    description: 'Operador de comparación',
    enum: OperadorCondicion,
    example: OperadorCondicion.IGUAL
  })
  @IsNotEmpty()
  @IsEnum(OperadorCondicion)
  operador: OperadorCondicion;

  @ApiProperty({
    description: 'Valor esperado',
    example: 'EN_PROGRESO'
  })
  @IsOptional()
  valor?: any;

  @ApiProperty({
    description: 'Configuración adicional de la condición',
    example: {
      mensajeError: 'El caso debe estar en progreso',
      obligatoria: true
    }
  })
  @IsOptional()
  @IsObject()
  configuracion?: {
    mensajeError?: string;
    obligatoria?: boolean;
    valorPorDefecto?: any;
  };
}