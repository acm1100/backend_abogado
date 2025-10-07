import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturacionService } from './facturacion.service';
import { FacturacionController } from './facturacion.controller';
import { Facturacion } from '../../entities/facturacion.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Usuario } from '../../entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Facturacion,
      Cliente,
      Caso,
      Proyecto,
      Usuario,
    ]),
  ],
  controllers: [FacturacionController],
  providers: [FacturacionService],
  exports: [FacturacionService, TypeOrmModule],
})
export class FacturacionModule {}
