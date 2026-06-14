import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  SignatureType,
  SignaturePurpose,
  AuditAction,
  AuditModule,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface SignatureRequestDto {
  userId: string;
  password: string;
  type: SignatureType;
  purpose: SignaturePurpose;
  meaning: string;
  comments?: string;
  recordId?: string;
  approvalId?: string;
  dataToSign?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  authMethod?: string;
}

@Injectable()
export class SignaturesService {
  private readonly logger = new Logger(SignaturesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {}

  async createSignature(dto: SignatureRequestDto) {
    // 21 CFR Part 11 §11.200 - Verificar identidad del firmante
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user || !user.signatureEnabled) {
      throw new UnauthorizedException('Usuario no autorizado para firmar electrónicamente.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditService.log({
        userId: dto.userId,
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.SIGNATURES,
        description: 'Intento de firma electrónica con contraseña incorrecta',
        ipAddress: dto.ipAddress,
        entityType: 'ElectronicSignature',
      });
      throw new UnauthorizedException('Contraseña incorrecta para firma electrónica.');
    }

    if (!dto.meaning || dto.meaning.trim().length < 5) {
      throw new BadRequestException(
        'Debe especificar el significado de la firma (mínimo 5 caracteres).',
      );
    }

    // Generar hash del contenido firmado + datos del firmante (no repudio)
    const dataHash = this.generateDataHash({
      ...(dto.dataToSign ?? {}),
      signerId: dto.userId,
      signerEmail: user.email,
      type: dto.type,
      purpose: dto.purpose,
      meaning: dto.meaning,
      timestamp: new Date().toISOString(),
    });

    const signatureHash = this.generateSignatureHash(dataHash, user.id, dto.userId);

    const signature = await this.prisma.electronicSignature.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        purpose: dto.purpose,
        meaning: dto.meaning,
        comments: dto.comments,
        recordId: dto.recordId,
        approvalId: dto.approvalId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        authMethod: dto.authMethod || 'PASSWORD',
        dataHash,
        signatureHash,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
          },
        },
      },
    });

    await this.auditService.log({
      userId: dto.userId,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: AuditAction.SIGNATURE,
      module: AuditModule.SIGNATURES,
      description: `Firma electrónica aplicada: ${dto.type} - ${dto.meaning}`,
      newValue: {
        signatureId: signature.id,
        type: dto.type,
        purpose: dto.purpose,
        meaning: dto.meaning,
        recordId: dto.recordId,
      },
      ipAddress: dto.ipAddress,
      entityType: 'ElectronicSignature',
      entityId: signature.id,
    });

    return signature;
  }

  async verifySignature(signatureId: string): Promise<{
    isValid: boolean;
    signature: any;
    integrityCheck: boolean;
  }> {
    const signature = await this.prisma.electronicSignature.findUnique({
      where: { id: signatureId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!signature) {
      return { isValid: false, signature: null, integrityCheck: false };
    }

    const expectedHash = this.generateSignatureHash(
      signature.dataHash,
      signature.userId,
      signature.userId,
    );

    const integrityCheck = expectedHash === signature.signatureHash;

    return {
      isValid: !signature.isRevoked && integrityCheck,
      signature,
      integrityCheck,
    };
  }

  async getSignaturesForRecord(recordId: string) {
    return this.prisma.electronicSignature.findMany({
      where: { recordId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, position: true },
        },
      },
      orderBy: { signedAt: 'asc' },
    });
  }

  async revokeSignature(
    signatureId: string,
    reason: string,
    revokedByUserId: string,
    ipAddress: string,
  ) {
    const signature = await this.prisma.electronicSignature.update({
      where: { id: signatureId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    await this.auditService.log({
      userId: revokedByUserId,
      action: AuditAction.SIGNATURE,
      module: AuditModule.SIGNATURES,
      description: `Firma electrónica revocada: ${reason}`,
      entityType: 'ElectronicSignature',
      entityId: signatureId,
      changeReason: reason,
      ipAddress,
    });

    return signature;
  }

  private generateDataHash(data: Record<string, any>): string {
    const payload = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  private generateSignatureHash(dataHash: string, userId: string, signerId: string): string {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    const payload = `${dataHash}:${userId}:${signerId}:${encryptionKey}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}
