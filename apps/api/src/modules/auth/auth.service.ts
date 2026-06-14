import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    if (user.status === UserStatus.LOCKED) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new ForbiddenException(
          `Cuenta bloqueada hasta ${user.lockedUntil.toISOString()}. Contacte al administrador.`,
        );
      }
      // Desbloquear si el tiempo expiró
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE, loginAttempts: 0, lockedUntil: null },
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Cuenta inactiva o pendiente de activación.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, email);
      return null;
    }

    // Resetear intentos fallidos en login exitoso
    await this.prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    return user;
  }

  private async handleFailedLogin(userId: string, email: string): Promise<void> {
    const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5);
    const lockoutMinutes = this.configService.get<number>('LOCKOUT_DURATION_MINUTES', 30);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: { increment: 1 } },
    });

    if (user.loginAttempts >= maxAttempts) {
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.LOCKED,
          lockedUntil,
        },
      });
      this.logger.warn(`Cuenta bloqueada por intentos fallidos: ${email}`);
    }
  }

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      await this.auditService.log({
        userEmail: dto.email,
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
        description: `Intento de login fallido para: ${dto.email}`,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Verificar MFA si está habilitado
    if (user.mfaEnabled) {
      if (!dto.mfaToken) {
        return { requiresMfa: true, userId: user.id };
      }
      const isMfaValid = authenticator.verify({
        token: dto.mfaToken,
        secret: this.decryptMfaSecret(user.mfaSecret),
      });
      if (!isMfaValid) {
        throw new UnauthorizedException('Código MFA inválido.');
      }
    }

    const tokens = await this.generateTokens(user);

    // Registrar sesión activa
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });

    // Actualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
      description: `Login exitoso`,
      ipAddress,
      userAgent,
    });

    const { passwordHash, mfaSecret, signaturePin, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  async logout(userId: string, token: string, ipAddress: string, userAgent: string) {
    await this.prisma.session.updateMany({
      where: { userId, token },
      data: { isActive: false, revokedAt: new Date(), revokedBy: userId },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      module: AuditModule.AUTH,
      description: 'Cierre de sesión',
      ipAddress,
      userAgent,
    });
  }

  async refreshTokens(dto: RefreshTokenDto, ipAddress: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de refresco inválido o expirado.');
    }

    const tokens = await this.generateTokens(session.user);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '8h'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async setupMfa(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const issuer = this.configService.get('MFA_ISSUER', 'PharmaQMS');

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, issuer, secret);
    const qrCode = await qrcode.toDataURL(otpauth);
    const encryptedSecret = this.encryptMfaSecret(secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: encryptedSecret },
    });

    return { secret, qrCode };
  }

  async enableMfa(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const secret = this.decryptMfaSecret(user.mfaSecret);
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      throw new BadRequestException('Código MFA inválido.');
    }

    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaBackupCodes: backupCodes },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta.');
    }

    // Verificar historial de contraseñas (últimas 10)
    const history = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const h of history) {
      const isReused = await bcrypt.compare(newPassword, h.passwordHash);
      if (isReused) {
        throw new BadRequestException(
          'No puede reutilizar las últimas 10 contraseñas.',
        );
      }
    }

    const newHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          passwordChangedAt: new Date(),
          mustChangePassword: false,
        },
      }),
      this.prisma.passwordHistory.create({
        data: { userId, passwordHash: newHash },
      }),
    ]);

    await this.auditService.log({
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      module: AuditModule.AUTH,
      description: 'Contraseña cambiada exitosamente',
      ipAddress,
    });
  }

  private encryptMfaSecret(secret: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey),
      iv,
    );
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptMfaSecret(encrypted: string): string {
    const [ivHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey),
      iv,
    );
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
