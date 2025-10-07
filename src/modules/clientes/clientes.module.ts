import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

// Entities
import { Cliente } from '../../entities/cliente.entity';
import { Usuario } from '../../entities/usuario.entity';

/**
 * Módulo de clientes
 * Gestiona operaciones CRUD, validaciones peruanas y contactos
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      Usuario,
    ]),
    ConfigModule,
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
