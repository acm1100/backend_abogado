import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { Evento } from '../../entities/evento.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Caso } from '../../entities/caso.entity';
import { Cliente } from '../../entities/cliente.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evento,
      Usuario,
      Caso,
      Cliente,
    ]),
    forwardRef(() => UsuariosModule),
  ],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
