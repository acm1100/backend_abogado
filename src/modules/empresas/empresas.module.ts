import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';

// Entities
import { Empresa } from '../../entities/empresa.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Rol } from '../../entities/rol.entity';
import { Suscripcion } from '../../entities/suscripcion.entity';

/**
 * Módulo de empresas
 * Gestiona operaciones CRUD y multi-tenancy
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empresa,
      Usuario,
      Rol,
      Suscripcion,
    ]),
    ConfigModule,
  ],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
