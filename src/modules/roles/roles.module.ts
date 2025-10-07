import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Rol } from '../../entities/rol.entity';
import { RolPermiso } from '../../entities/rol-permiso.entity';
import { Permiso } from '../../entities/permiso.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Empresa } from '../../entities/empresa.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rol,
      RolPermiso,
      Permiso,
      Usuario,
      Empresa
    ]),
    forwardRef(() => UsuariosModule), // Evitar dependencia circular
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [
    RolesService,
    TypeOrmModule // Exportar para que otros módulos puedan usar las entidades
  ],
})
export class RolesModule {}
