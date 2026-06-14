import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EnableMfaDto } from './dto/enable-mfa.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Iniciar sesión (21 CFR Part 11)' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = (req as any).ip || '0.0.0.0';
    const userAgent = (req as any).headers?.['user-agent'] || '';
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión y revocar token' })
  logout(@CurrentUser() user: any, @Req() req: Request) {
    const token = (req as any).headers?.authorization?.replace('Bearer ', '') || '';
    const ipAddress = (req as any).ip || '0.0.0.0';
    const userAgent = (req as any).headers?.['user-agent'] || '';
    return this.authService.logout(user.id, token, ipAddress, userAgent);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acceso' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = (req as any).ip || '0.0.0.0';
    return this.authService.refreshTokens(dto, ipAddress);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña' })
  changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req as any).ip || '0.0.0.0';
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
      ipAddress,
    );
  }

  @Get('mfa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configurar autenticación multifactor (MFA)' })
  setupMfa(@CurrentUser() user: any) {
    return this.authService.setupMfa(user.id);
  }

  @Post('mfa/enable')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar MFA con código TOTP de verificación' })
  enableMfa(@CurrentUser() user: any, @Body() dto: EnableMfaDto) {
    return this.authService.enableMfa(user.id, dto.token);
  }
}
