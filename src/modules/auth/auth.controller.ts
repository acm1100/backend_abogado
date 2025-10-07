import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Get,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto, RefreshTokenDto, ChangePasswordDto, ResetPasswordRequestDto, ResetPasswordDto } from './dto/login.dto';
import { AuthResponseDto, UserInfoDto } from './dto/auth-response.dto';

@ApiTags('Autenticación')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Iniciar sesión
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario con email y contraseña, devuelve tokens JWT',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta bloqueada',
    schema: {
      example: {
        statusCode: 401,
        message: 'Credenciales inválidas',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de login',
    schema: {
      example: {
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
        error: 'Too Many Requests',
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Intento de login para: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  /**
   * Refrescar token de acceso
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refrescar token',
    description: 'Obtiene un nuevo access token usando el refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  async refreshToken(@Body() refreshDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshDto);
  }

  /**
   * Cerrar sesión
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Cerrar sesión',
    description: 'Invalida los tokens del usuario actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    schema: {
      example: {
        message: 'Sesión cerrada exitosamente',
      },
    },
  })
  async logout(@Request() req: any, @Body() body?: { refreshToken?: string }): Promise<{ message: string }> {
    const userId = req.user.id;
    const refreshToken = body?.refreshToken;
    
    await this.authService.logout(userId, refreshToken);
    
    this.logger.log(`Usuario ${userId} cerró sesión`);
    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Obtener información del usuario actual
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Información del usuario',
    description: 'Obtiene la información del usuario autenticado actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario',
    type: UserInfoDto,
  })
  async getProfile(@Request() req: any): Promise<UserInfoDto> {
    const user = req.user;
    
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      nombreCompleto: user.nombreCompleto,
      empresa: user.empresa,
      rol: user.rol,
      activo: user.activo,
      ultimoAcceso: user.ultimoAcceso,
    };
  }

  /**
   * Cambiar contraseña
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Cambiar contraseña',
    description: 'Permite al usuario cambiar su contraseña actual',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
    schema: {
      example: {
        message: 'Contraseña cambiada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La nueva contraseña debe ser diferente a la actual',
  })
  @ApiResponse({
    status: 401,
    description: 'Contraseña actual incorrecta',
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    
    await this.authService.changePassword(userId, changePasswordDto);
    
    this.logger.log(`Usuario ${userId} cambió su contraseña`);
    return { message: 'Contraseña cambiada exitosamente' };
  }

  /**
   * Solicitar reset de contraseña
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Solicitar reset de contraseña',
    description: 'Envía un email con un token para resetear la contraseña',
  })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Si el email existe, se enviará un token de reset',
    schema: {
      example: {
        message: 'Si el email está registrado, recibirás las instrucciones para resetear tu contraseña',
      },
    },
  })
  async requestPasswordReset(@Body() resetRequestDto: ResetPasswordRequestDto): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(resetRequestDto);
    
    // Por seguridad, siempre devolver el mismo mensaje
    return { 
      message: 'Si el email está registrado, recibirás las instrucciones para resetear tu contraseña' 
    };
  }

  /**
   * Resetear contraseña con token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Resetear contraseña',
    description: 'Resetea la contraseña usando el token recibido por email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña reseteada exitosamente',
    schema: {
      example: {
        message: 'Contraseña reseteada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de reset inválido o expirado',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    
    return { message: 'Contraseña reseteada exitosamente' };
  }

  /**
   * Verificar si el token JWT es válido
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verificar token',
    description: 'Verifica si el token JWT actual es válido',
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    schema: {
      example: {
        valid: true,
        user: {
          id: 'uuid-123',
          email: 'admin@bufete.com',
          empresaId: 'uuid-456',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async verifyToken(@Request() req: any): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        empresaId: req.user.empresaId,
      },
    };
  }
}
