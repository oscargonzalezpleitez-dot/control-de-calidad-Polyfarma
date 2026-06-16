import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  FormatStatus,
  FormatType,
  AuditAction,
  AuditModule,
  Prisma,
  ApprovalRole,
} from '@prisma/client';

export interface CreateFormatDto {
  code: string;
  name: string;
  description?: string;
  type: FormatType;
  department?: string;
  retentionPeriod?: number;
  sections: {
    name: string;
    description?: string;
    order: number;
    isRepeatable?: boolean;
    fields: {
      label: string;
      name: string;
      type: string;
      order: number;
      isRequired?: boolean;
      unit?: string;
      options?: any;
      minValue?: number;
      maxValue?: number;
      helpText?: string;
    }[];
  }[];
  approvers: { userId: string; role: ApprovalRole; order: number }[];
}

@Injectable()
export class FormatsService {
  private readonly logger = new Logger(FormatsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateFormatDto, createdById: string, ipAddress: string) {
    const existing = await this.prisma.format.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`El código de formato ${dto.code} ya existe.`);

    const format = await this.prisma.$transaction(async (tx) => {
      const newFormat = await tx.format.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          type: dto.type as FormatType,
          department: dto.department,
          retentionPeriod: dto.retentionPeriod,
          status: FormatStatus.DRAFT,
          version: '1.0',
          createdById,
        },
      });

      for (const sectionDto of dto.sections) {
        const section = await tx.formatSection.create({
          data: {
            formatId: newFormat.id,
            name: sectionDto.name,
            description: sectionDto.description,
            order: sectionDto.order,
            isRepeatable: sectionDto.isRepeatable ?? false,
          },
        });

        for (const fieldDto of sectionDto.fields) {
          await tx.formatField.create({
            data: {
              formatId: newFormat.id,
              sectionId: section.id,
              label: fieldDto.label,
              name: fieldDto.name,
              type: fieldDto.type as any,
              order: fieldDto.order,
              isRequired: fieldDto.isRequired ?? false,
              unit: fieldDto.unit,
              options: fieldDto.options,
              minValue: fieldDto.minValue,
              maxValue: fieldDto.maxValue,
              helpText: fieldDto.helpText,
            },
          });
        }
      }

      for (const approver of dto.approvers) {
        await tx.formatApproval.create({
          data: {
            formatId: newFormat.id,
            userId: approver.userId,
            role: approver.role,
            order: approver.order,
          },
        });
      }

      return newFormat;
    });

    await this.auditService.log({
      userId: createdById,
      action: AuditAction.CREATE,
      module: AuditModule.FORMATS,
      description: `Formato creado: ${format.code} - ${format.name}`,
      entityType: 'Format',
      entityId: format.id,
      newValue: { code: format.code, name: format.name, type: format.type },
      ipAddress,
    });

    return this.findOne(format.id);
  }

  async findAll(params: {
    status?: FormatStatus;
    type?: FormatType;
    department?: string;
    page?: number;
    limit?: number;
  }) {
    const { page: rawPage, limit: rawLimit, ...filters } = params;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const where: Prisma.FormatWhereInput = { isDeleted: false };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.department) where.department = { contains: filters.department, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.format.findMany({
        where,
        include: {
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { records: true, fields: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.format.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const format = await this.prisma.format.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            fields: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
        approvals: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, position: true } },
          },
          orderBy: { order: 'asc' },
        },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!format || format.isDeleted) throw new NotFoundException('Formato no encontrado.');
    return format;
  }

  async submitForApproval(formatId: string, userId: string, ipAddress: string) {
    const format = await this.findOne(formatId);

    const updated = await this.prisma.format.update({
      where: { id: formatId },
      data: { status: FormatStatus.UNDER_REVIEW, updatedById: userId },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      module: AuditModule.FORMATS,
      description: `Formato enviado a revisión: ${format.code}`,
      entityType: 'Format',
      entityId: formatId,
      oldValue: { status: FormatStatus.DRAFT },
      newValue: { status: FormatStatus.UNDER_REVIEW },
      ipAddress,
    });

    return updated;
  }

  async approve(formatId: string, approvalId: string, comments: string, userId: string, ipAddress: string) {
    const format = await this.findOne(formatId);

    const approval = format.approvals.find((a) => a.id === approvalId);
    if (!approval || approval.userId !== userId) {
      throw new BadRequestException('No tiene permiso para esta aprobación.');
    }

    await this.prisma.formatApproval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        comments,
        signedAt: new Date(),
      },
    });

    const allApproved = format.approvals.every(
      (a) => a.id === approvalId || a.status === 'APPROVED',
    );

    if (allApproved) {
      await this.prisma.format.update({
        where: { id: formatId },
        data: {
          status: FormatStatus.APPROVED,
          effectiveDate: new Date(),
          updatedById: userId,
        },
      });
    }

    await this.auditService.log({
      userId,
      action: AuditAction.APPROVE,
      module: AuditModule.FORMATS,
      description: `Formato ${allApproved ? 'aprobado completamente' : 'aprobación parcial'}: ${format.code}`,
      entityType: 'Format',
      entityId: formatId,
      changeReason: comments,
      ipAddress,
    });

    return this.findOne(formatId);
  }

  async createNewVersion(formatId: string, userId: string, ipAddress: string) {
    const current = await this.findOne(formatId);

    const [major, minor] = current.version.split('.').map(Number);
    const newVersion = `${major + 1}.0`;

    const newFormat = await this.create(
      {
        code: `${current.code}-v${major + 1}`,
        name: current.name,
        description: current.description,
        type: current.type,
        department: current.department,
        retentionPeriod: current.retentionPeriod,
        sections: current.sections.map((s) => ({
          name: s.name,
          description: s.description,
          order: s.order,
          isRepeatable: s.isRepeatable,
          fields: s.fields.map((f) => ({
            label: f.label,
            name: f.name,
            type: f.type,
            order: f.order,
            isRequired: f.isRequired,
            unit: f.unit,
            options: f.options,
            minValue: f.minValue,
            maxValue: f.maxValue,
            helpText: f.helpText,
          })),
        })),
        approvers: current.approvals.map((a) => ({
          userId: a.userId,
          role: a.role,
          order: a.order,
        })),
      },
      userId,
      ipAddress,
    );

    await Promise.all([
      this.prisma.format.update({
        where: { id: newFormat.id },
        data: { version: newVersion, previousVersionId: formatId },
      }),
      this.prisma.format.update({
        where: { id: formatId },
        data: { status: FormatStatus.SUPERSEDED },
      }),
    ]);

    return this.findOne(newFormat.id);
  }

  async obsolete(formatId: string, reason: string, userId: string, ipAddress: string) {
    const format = await this.findOne(formatId);

    await this.prisma.format.update({
      where: { id: formatId },
      data: { status: FormatStatus.OBSOLETE, updatedById: userId },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      module: AuditModule.FORMATS,
      description: `Formato obsoleto: ${format.code}`,
      entityType: 'Format',
      entityId: formatId,
      changeReason: reason,
      oldValue: { status: format.status },
      newValue: { status: FormatStatus.OBSOLETE },
      ipAddress,
    });
  }
}
