import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProyectosService } from './proyectos.service';
import { ProyectosController } from './proyectos.controller';
import { Proyecto } from '../../entities/proyecto.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Usuario } from '../../entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proyecto,
      Cliente,
      Caso,
      Usuario
    ])
  ],
  controllers: [ProyectosController],
  providers: [ProyectosService],
  exports: [ProyectosService]
})
export class ProyectosModule {}