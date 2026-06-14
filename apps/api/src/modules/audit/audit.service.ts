import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditAction, AuditModule, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface CreateAuditLogDto {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: AuditAction;
  module: AuditModule;
  entityType?: string;
  entityId?: string;
  description: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changeReason?: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
  }

  // Genera hash de integridad para garantizar inmutabilidad del registro
  private generateIntegrityHash(data: CreateAuditLogDto, timestamp: Date): string {
    const payload = JSON.stringify({
      ...data,
      timestamp: timestamp.toISOString(),
      key: this.encryptionKey,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async log(dto: CreateAuditLogDto): Promise<void> {
    const timestamp = new Date();
    const integrityHash = this.generateIntegrityHash(dto, timestamp);

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: dto.userId,
          userEmail: dto.userEmail,
          userName: dto.userName,
          action: dto.action,
          module: dto.module,
          entityType: dto.entityType,
          entityId: dto.entityId,
          description: dto.description,
          oldValue: dto.oldValue as Prisma.InputJsonValue,
          newValue: dto.newValue as Prisma.InputJsonValue,
          changeReason: dto.changeReason,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          sessionId: dto.sessionId,
          integrityHash,
          timestamp,
        },
      });
    } catch (error) {
      // El audit trail NUNCA debe fallar silenciosamente
      this.logger.error(`Error crítico al registrar audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(params: {
    userId?: string;
    action?: AuditAction;
    module?: AuditModule;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...filters } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.module) where.module = filters.module;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async verifyIntegrity(logId: string): Promise<boolean> {
    const log = await this.prisma.auditLog.findUnique({ where: { id: logId } });
    if (!log) return false;

    const dto: CreateAuditLogDto = {
      userId: log.userId,
      userEmail: log.userEmail,
      userName: log.userName,
      action: log.action,
      module: log.module,
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      oldValue: log.oldValue as Record<string, any>,
      newValue: log.newValue as Record<string, any>,
      changeReason: log.changeReason,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      sessionId: log.sessionId,
    };

    const expectedHash = this.generateIntegrityHash(dto, log.timestamp);
    return expectedHash === log.integrityHash;
  }

  async getStatistics(startDate: Date, endDate: Date) {
    const [totalLogs, byAction, byModule, byUser] = await Promise.all([
      this.prisma.auditLog.count({
        where: { timestamp: { gte: startDate, lte: endDate } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        where: { timestamp: { gte: startDate, lte: endDate } },
        orderBy: { _count: { action: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['module'],
        _count: { module: true },
        where: { timestamp: { gte: startDate, lte: endDate } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        _count: { userId: true },
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: { not: null },
        },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return { totalLogs, byAction, byModule, byUser };
  }
}
