import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

// Entities
import { Usuario } from '../../entities/usuario.entity';
import { Empresa } from '../../entities/empresa.entity';
import { Rol } from '../../entities/rol.entity';
import { Permiso } from '../../entities/permiso.entity';
import { RolPermiso } from '../../entities/rol-permiso.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Empresa,
      Rol,
      Permiso,
      RolPermiso,
    ]),

    // Passport para estrategias de autenticación
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('app.jwt.expiresIn', '1h'),
          issuer: configService.get<string>('app.name', 'backend-app-abogados'),
          audience: configService.get<string>('app.url', 'http://localhost:3000'),
        },
      }),
      inject: [ConfigService],
    }),

    CacheModule.register(),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
