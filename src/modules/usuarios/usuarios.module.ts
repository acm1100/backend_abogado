import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';

// Entities
import { Usuario } from '../../entities/usuario.entity';
import { Empresa } from '../../entities/empresa.entity';
import { Rol } from '../../entities/rol.entity';

/**
 * Módulo de usuarios
 * Gestiona operaciones CRUD, RBAC y perfiles de usuario
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Empresa,
      Rol,
    ]),
    ConfigModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
