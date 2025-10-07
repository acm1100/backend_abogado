import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../../entities/usuario.entity';

export interface JwtPayload {
  sub: string; // Usuario ID
  email: string;
  empresaId: string;
  rolId?: string;
  iat: number;
  exp: number;
}

/**
 * Estrategia JWT para autenticación
 * Valida el token y carga la información completa del usuario
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const { sub: userId, email, empresaId } = payload;

    // Buscar usuario con relaciones necesarias
    const usuario = await this.usuarioRepository.findOne({
      where: { 
        id: userId,
        email,
        empresaId,
        activo: true,
      },
      relations: [
        'empresa',
        'rol',
        'rol.permisos',
        'rol.permisos.permiso',
      ],
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Verificar que la empresa esté activa
    if (!usuario.empresa.activo) {
      throw new UnauthorizedException('Empresa inactiva');
    }

    // Verificar si el usuario está bloqueado
    if (usuario.estaBloqueado) {
      throw new UnauthorizedException('Usuario bloqueado temporalmente');
    }

    // Actualizar último acceso
    usuario.actualizarUltimoAcceso();
    await this.usuarioRepository.save(usuario);

    // Retornar usuario con información necesaria para guards
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      nombreCompleto: usuario.nombreCompleto,
      empresaId: usuario.empresaId,
      empresa: {
        id: usuario.empresa.id,
        razonSocial: usuario.empresa.razonSocial,
        ruc: usuario.empresa.ruc,
        activo: usuario.empresa.activo,
      },
      rol: usuario.rol ? {
        id: usuario.rol.id,
        nombre: usuario.rol.nombre,
        nivel: usuario.rol.nivel,
        permisos: usuario.rol.permisos || [],
      } : null,
      activo: usuario.activo,
      ultimoAcceso: usuario.ultimoAcceso,
      configuracionPersonal: usuario.configuracionPersonal,
      // Métodos útiles
      tienePermiso: (modulo: string, accion: string) => 
        usuario.tienePermiso(modulo, accion),
      puedeAccederModulo: (modulo: string) => 
        usuario.puedeAccederModulo(modulo),
      estaBloqueado: usuario.estaBloqueado,
    };
  }
}
