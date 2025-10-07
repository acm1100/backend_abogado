import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraService } from './bitacora.service';
import { BitacoraController } from './bitacora.controller';
// import { Bitacora } from '../../entities/bitacora.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Empresa } from '../../entities/empresa.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EmpresasModule } from '../empresas/empresas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Bitacora,
      Usuario,
      Empresa
    ]),
    forwardRef(() => UsuariosModule),
    forwardRef(() => EmpresasModule),
  ],
  controllers: [BitacoraController],
  providers: [
    BitacoraService,
    {
      provide: 'BITACORA_REPOSITORY',
      useFactory: () => {
        // Mock repository hasta tener la entidad real
        return {
          create: (data: any) => ({ ...data, id: 'mock-id', fechaCreacion: new Date() }),
          save: (entity: any) => Promise.resolve(entity),
          findOne: (options: any) => Promise.resolve(null),
          find: (options: any) => Promise.resolve([]),
          findAndCount: (options: any) => Promise.resolve([[], 0]),
          count: (options: any) => Promise.resolve(0),
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
  exports: [BitacoraService],
})
export class BitacoraModule {}
