import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasosService } from './casos.service';
import { CasosController } from './casos.controller';
import { Caso } from '../../entities/caso.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Usuario } from '../../entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Caso, Cliente, Usuario]),
  ],
  controllers: [CasosController],
  providers: [CasosService],
  exports: [CasosService, TypeOrmModule],
})
export class CasosModule {}
