import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrosTiempoService } from './registros-tiempo.service';
import { RegistrosTiempoController } from './registros-tiempo.controller';
// import { RegistroTiempo } from '../../entities/registro-tiempo.entity';
import { Cliente } from '../../entities/cliente.entity';
import { Caso } from '../../entities/caso.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { ClientesModule } from '../clientes/clientes.module';
import { CasosModule } from '../casos/casos.module';
import { ProyectosModule } from '../proyectos/proyectos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // RegistroTiempo,
      Cliente,
      Caso,
      Proyecto,
      Usuario
    ]),
    forwardRef(() => ClientesModule),
    forwardRef(() => CasosModule),
    forwardRef(() => ProyectosModule),
    forwardRef(() => UsuariosModule),
  ],
  controllers: [RegistrosTiempoController],
  providers: [
    RegistrosTiempoService,
    {
      provide: 'REGISTRO_TIEMPO_REPOSITORY',
      useFactory: () => {
        // Mock repository hasta tener la entidad real
        return {
          create: (data: any) => ({ ...data, id: 'mock-id', fechaCreacion: new Date() }),
          save: (entity: any) => Promise.resolve(entity),
          findOne: (options: any) => Promise.resolve(null),
          find: (options: any) => Promise.resolve([]),
          createQueryBuilder: () => ({
            leftJoinAndSelect: () => ({ andWhere: () => ({ skip: () => ({ take: () => ({ orderBy: () => ({ addOrderBy: () => ({ getManyAndCount: () => Promise.resolve([[], 0]) }) }) }) }) }) }),
            where: () => ({ andWhere: () => ({ skip: () => ({ take: () => ({ orderBy: () => ({ addOrderBy: () => ({ getManyAndCount: () => Promise.resolve([[], 0]) }) }) }) }) }) }),
            andWhere: () => ({ skip: () => ({ take: () => ({ orderBy: () => ({ addOrderBy: () => ({ getManyAndCount: () => Promise.resolve([[], 0]) }) }) }) }) }),
            skip: () => ({ take: () => ({ orderBy: () => ({ addOrderBy: () => ({ getManyAndCount: () => Promise.resolve([[], 0]) }) }) }) }),
            take: () => ({ orderBy: () => ({ addOrderBy: () => ({ getManyAndCount: () => Promise.resolve([[], 0]) }) }) }),
            orderBy: () => ({ addOrderBy: () => ({ getManyAndCount: () => Promise.resolve([[], 0]) }) }),
            addOrderBy: () => ({ getManyAndCount: () => Promise.resolve([[], 0]) }),
            getManyAndCount: () => Promise.resolve([[], 0]),
            getMany: () => Promise.resolve([])
          })
        };
      }
    }
  ],
  exports: [RegistrosTiempoService],
})
export class RegistrosTiempoModule {}
