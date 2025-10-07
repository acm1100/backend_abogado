import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { Usuario } from '../../entities/usuario.entity';
import { Empresa } from '../../entities/empresa.entity';
import { LoginDto, RefreshTokenDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Servicio de autenticación y autorización
 * Maneja login, logout, refresh tokens, cambio de contraseñas, etc.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutos

  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Autentica un usuario con email y contraseña
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, ruc } = loginDto;

    // Verificar intentos de login fallidos
    const lockoutKey = `lockout:${email}`;
    const isLockedOut = await this.cacheManager.get(lockoutKey);
    if (isLockedOut) {
      throw new UnauthorizedException('Cuenta temporalmente bloqueada por múltiples intentos fallidos');
    }

    // Buscar usuario
    let usuario: Usuario;
    
    if (ruc) {
      // Buscar por email y RUC específico
      usuario = await this.usuarioRepository.findOne({
        where: { 
          email,
          empresa: { ruc },
          activo: true,
        },
        relations: ['empresa', 'rol', 'rol.permisos', 'rol.permisos.permiso'],
      });
    } else {
      // Buscar por email (puede haber múltiples, tomar el primero activo)
      usuario = await this.usuarioRepository.findOne({
        where: { 
          email,
          activo: true,
        },
        relations: ['empresa', 'rol', 'rol.permisos', 'rol.permisos.permiso'],
        order: { fechaCreacion: 'DESC' },
      });
    }

    if (!usuario) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que la empresa esté activa
    if (!usuario.empresa.activo) {
      throw new UnauthorizedException('Empresa inactiva');
    }

    // Limpiar intentos fallidos
    await this.cacheManager.del(`failed_attempts:${email}`);

    // Actualizar último acceso
    usuario.actualizarUltimoAcceso();
    await this.usuarioRepository.save(usuario);

    // Generar tokens
    return this.generateTokens(usuario);
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshToken(refreshDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshDto;

    try {
      // Verificar refresh token en caché
      const userId = await this.cacheManager.get(`refresh_token:${refreshToken}`);
      if (!userId) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      // Buscar usuario
      const usuario = await this.usuarioRepository.findOne({
        where: { 
          id: userId as string,
          activo: true,
        },
        relations: ['empresa', 'rol', 'rol.permisos', 'rol.permisos.permiso'],
      });

      if (!usuario || !usuario.empresa.activo) {
        throw new UnauthorizedException('Usuario o empresa inactiva');
      }

      // Generar nuevos tokens
      return this.generateTokens(usuario);
    } catch (error) {
      this.logger.error(`Error al refrescar token: ${error.message}`);
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Eliminar refresh token del caché
      await this.cacheManager.del(`refresh_token:${refreshToken}`);
    }

    // Invalidar todas las sesiones del usuario
    const pattern = `refresh_token:*`;
    // Nota: En Redis real, buscaríamos por patrón y eliminaríamos tokens del usuario
    
    this.logger.log(`Usuario ${userId} cerró sesión`);
  }

  /**
   * Cambia la contraseña del usuario
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId, activo: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, usuario.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Verificar que la nueva contraseña no sea igual a la actual
    const isSamePassword = await bcrypt.compare(newPassword, usuario.password);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
    
    // Actualizar contraseña
    usuario.password = hashedPassword;
    usuario.fechaUltimoCambioPassword = new Date();
    usuario.requiereCambioPassword = false;
    
    await this.usuarioRepository.save(usuario);

    this.logger.log(`Usuario ${userId} cambió su contraseña`);
  }

  /**
   * Solicita reset de contraseña
   */
  async requestPasswordReset(resetRequestDto: ResetPasswordRequestDto): Promise<void> {
    const { email, ruc } = resetRequestDto;

    // Buscar usuario
    let usuario: Usuario;
    
    if (ruc) {
      usuario = await this.usuarioRepository.findOne({
        where: { 
          email,
          empresa: { ruc },
          activo: true,
        },
        relations: ['empresa'],
      });
    } else {
      usuario = await this.usuarioRepository.findOne({
        where: { 
          email,
          activo: true,
        },
        relations: ['empresa'],
        order: { fechaCreacion: 'DESC' },
      });
    }

    if (!usuario) {
      // Por seguridad, no revelamos si el email existe o no
      this.logger.warn(`Intento de reset de contraseña para email inexistente: ${email}`);
      return;
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en caché
    await this.cacheManager.set(
      `password_reset:${resetToken}`,
      usuario.id,
      60 * 60 * 1000, // 1 hora
    );

    // Aquí se enviaría el email con el token de reset
    // Por ahora solo logeamos
    this.logger.log(`Token de reset generado para usuario ${usuario.id}: ${resetToken}`);
    
    // En producción, enviar email aquí

  }

  /**
   * Resetea la contraseña usando el token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Verificar token
    const userId = await this.cacheManager.get(`password_reset:${token}`);
    if (!userId) {
      throw new UnauthorizedException('Token de reset inválido o expirado');
    }

    // Buscar usuario
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId as string, activo: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
    
    // Actualizar contraseña
    usuario.password = hashedPassword;
    usuario.fechaUltimoCambioPassword = new Date();
    usuario.requiereCambioPassword = false;
    usuario.intentosFallidos = 0;
    usuario.fechaBloqueo = null;
    
    await this.usuarioRepository.save(usuario);

    // Eliminar token de reset
    await this.cacheManager.del(`password_reset:${token}`);

    this.logger.log(`Usuario ${userId} reseteó su contraseña`);
  }

  /**
   * Genera access token y refresh token para un usuario
   */
  private async generateTokens(usuario: Usuario): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      rolId: usuario.rolId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
    };

    // Generar tokens
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    // Guardar refresh token en caché (7 días)
    await this.cacheManager.set(
      `refresh_token:${refreshToken}`,
      usuario.id,
      7 * 24 * 60 * 60 * 1000, // 7 días
    );

    // Preparar información del usuario
    const userInfo = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      nombreCompleto: usuario.nombreCompleto,
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
        permisos: (usuario.rol.permisos || []).map(rp => rp.permiso.codigo),
      } : null,
      activo: usuario.activo,
      ultimoAcceso: usuario.ultimoAcceso,
    };

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hora
      user: userInfo,
    };
  }

  /**
   * Maneja intentos de login fallidos
   */
  private async handleFailedLogin(email: string): Promise<void> {
    const attemptsKey = `failed_attempts:${email}`;
    const attempts = (await this.cacheManager.get<number>(attemptsKey)) || 0;
    const newAttempts = attempts + 1;

    await this.cacheManager.set(attemptsKey, newAttempts, 60 * 60 * 1000); // 1 hora

    if (newAttempts >= this.maxLoginAttempts) {
      // Bloquear cuenta temporalmente
      const lockoutKey = `lockout:${email}`;
      await this.cacheManager.set(lockoutKey, true, this.lockoutDuration);
      
      this.logger.warn(`Cuenta bloqueada temporalmente: ${email}`);
    }
  }

  /**
   * Valida si un usuario puede acceder a un recurso
   */
  async validateUserAccess(userId: string, empresaId: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { 
        id: userId,
        empresaId,
        activo: true,
      },
      relations: ['empresa'],
    });

    return usuario && usuario.empresa.activo;
  }
}
