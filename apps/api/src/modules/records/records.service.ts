import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule, RecordStatus, FormatStatus, Prisma } from '@prisma/client';

export interface CreateRecordDto {
  formatId: string;
  title?: string;
  batchNumber?: string;
  productName?: string;
  startDate?: Date;
  comments?: string;
}

export interface SaveFieldValuesDto {
  values: {
    fieldId: string;
    sectionIndex?: number;
    value?: string;
    valueNumeric?: number;
    valueDate?: Date;
    valueJson?: any;
  }[];
  changeReason?: string;
}

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateRecordDto, createdById: string, ipAddress: string) {
    const format = await this.prisma.format.findUnique({
      where: { id: dto.formatId },
      include: { fields: true },
    });

    if (!format) throw new NotFoundException('Formato no encontrado.');

    let code: string;
    if (format.code === 'CC-F-063') {
      const count = await this.prisma.record.count({
        where: { formatId: dto.formatId, isDeleted: false },
      });
      code = `PW${String(count + 1).padStart(3, '0')}`;
    } else {
      code = `${format.code}-${Date.now().toString(36).toUpperCase()}`;
    }

    const record = await this.prisma.record.create({
      data: {
        formatId: dto.formatId,
        code,
        title: dto.title,
        batchNumber: dto.batchNumber,
        productName: dto.productName,
        startDate: dto.startDate,
        comments: dto.comments,
        status: RecordStatus.IN_PROGRESS,
        createdById,
      },
    });

    await this.auditService.log({
      userId: createdById,
      action: AuditAction.CREATE,
      module: AuditModule.RECORDS,
      description: `Registro creado: ${code} (${format.name})`,
      entityType: 'Record',
      entityId: record.id,
      newValue: { code, formatId: dto.formatId, status: RecordStatus.IN_PROGRESS },
      ipAddress,
    });

    return this.findOne(record.id);
  }

  async saveFieldValues(
    recordId: string,
    dto: SaveFieldValuesDto,
    userId: string,
    ipAddress: string,
  ) {
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
      include: { format: { include: { fields: true } } },
    });

    if (!record) throw new NotFoundException('Registro no encontrado.');

    const results = await this.prisma.$transaction(async (tx) => {
      const savedValues = [];

      for (const valueDto of dto.values) {
        const field = record.format.fields.find((f) => f.id === valueDto.fieldId);
        if (!field) continue;

        const existing = await tx.recordFieldValue.findUnique({
          where: {
            recordId_fieldId_sectionIndex: {
              recordId,
              fieldId: valueDto.fieldId,
              sectionIndex: valueDto.sectionIndex ?? 0,
            },
          },
        });

        const saved = await tx.recordFieldValue.upsert({
          where: {
            recordId_fieldId_sectionIndex: {
              recordId,
              fieldId: valueDto.fieldId,
              sectionIndex: valueDto.sectionIndex ?? 0,
            },
          },
          update: {
            value: valueDto.value,
            valueNumeric: valueDto.valueNumeric,
            valueDate: valueDto.valueDate,
            valueJson: valueDto.valueJson,
            enteredAt: new Date(),
            enteredById: userId,
          },
          create: {
            recordId,
            fieldId: valueDto.fieldId,
            sectionIndex: valueDto.sectionIndex ?? 0,
            value: valueDto.value,
            valueNumeric: valueDto.valueNumeric,
            valueDate: valueDto.valueDate,
            valueJson: valueDto.valueJson,
            enteredById: userId,
          },
        });

        if (existing && (existing.value !== valueDto.value || existing.valueNumeric !== valueDto.valueNumeric)) {
          await this.auditService.log({
            userId,
            action: AuditAction.UPDATE,
            module: AuditModule.RECORDS,
            description: `Campo "${field.label}" modificado en registro ${record.code}`,
            entityType: 'RecordFieldValue',
            entityId: saved.id,
            oldValue: { value: existing.value, valueNumeric: existing.valueNumeric },
            newValue: { value: valueDto.value, valueNumeric: valueDto.valueNumeric },
            changeReason: dto.changeReason,
            ipAddress,
          });
        }

        savedValues.push(saved);
      }

      return savedValues;
    });

    return results;
  }

  async complete(recordId: string, userId: string, ipAddress: string) {
    const record = await this.prisma.record.findUnique({
      where: { id: recordId },
    });

    if (!record) throw new NotFoundException('Registro no encontrado.');

    const updated = await this.prisma.record.update({
      where: { id: recordId },
      data: { status: RecordStatus.COMPLETED, endDate: new Date(), updatedById: userId },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      module: AuditModule.RECORDS,
      description: `Registro completado: ${record.code}`,
      entityType: 'Record',
      entityId: recordId,
      oldValue: { status: record.status },
      newValue: { status: RecordStatus.COMPLETED },
      ipAddress,
    });

    return updated;
  }

  async cancel(recordId: string, reason: string, userId: string, ipAddress: string) {

    const record = await this.prisma.record.update({
      where: { id: recordId },
      data: {
        status: RecordStatus.CANCELLED,
        cancelReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CANCEL,
      module: AuditModule.RECORDS,
      description: `Registro cancelado: ${record.code}`,
      entityType: 'Record',
      entityId: recordId,
      changeReason: reason,
      oldValue: { status: RecordStatus.IN_PROGRESS },
      newValue: { status: RecordStatus.CANCELLED },
      ipAddress,
    });
  }

  async invalidate(recordId: string, reason: string, userId: string, ipAddress: string) {

    const record = await this.prisma.record.update({
      where: { id: recordId },
      data: {
        status: RecordStatus.INVALIDATED,
        invalidReason: reason,
        invalidatedAt: new Date(),
        invalidatedBy: userId,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.INVALIDATE,
      module: AuditModule.RECORDS,
      description: `Registro invalidado: ${record.code}`,
      entityType: 'Record',
      entityId: recordId,
      changeReason: reason,
      ipAddress,
    });
  }

  async delete(
    recordId: string,
    reason: string,
    password: string,
    userId: string,
    ipAddress: string,
  ) {
    const record = await this.prisma.record.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Registro no encontrado.');
    if (record.isDeleted) throw new BadRequestException('El registro ya fue eliminado.');

    const deleted = await this.prisma.record.update({
      where: { id: recordId },
      data: { isDeleted: true },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      module: AuditModule.RECORDS,
      description: `Registro eliminado por autorización: ${record.code}. Motivo: ${reason}`,
      entityType: 'Record',
      entityId: recordId,
      changeReason: reason,
      oldValue: { code: record.code, status: record.status, isDeleted: false },
      newValue: { isDeleted: true, deletedBy: userId },
      ipAddress,
    });

    return { success: true, code: record.code };
  }

  async findAll(params: {
    formatId?: string;
    status?: RecordStatus;
    batchNumber?: string;
    page?: number;
    limit?: number;
  }) {
    const { page: rawPage, limit: rawLimit, ...filters } = params;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const where: Prisma.RecordWhereInput = { isDeleted: false };

    if (filters.formatId) where.formatId = filters.formatId;
    if (filters.status) where.status = filters.status;
    if (filters.batchNumber) where.batchNumber = { contains: filters.batchNumber, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.record.findMany({
        where,
        include: {
          format: { select: { name: true, code: true, type: true, version: true } },
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { fieldValues: true, signatures: true, attachments: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.record.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const record = await this.prisma.record.findUnique({
      where: { id },
      include: {
        format: {
          include: {
            sections: { include: { fields: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } },
          },
        },
        fieldValues: {
          include: {
            field: true,
            enteredBy: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        signatures: {
          include: { user: { select: { firstName: true, lastName: true, email: true, position: true } } },
          orderBy: { signedAt: 'asc' },
        },
        attachments: { where: { isDeleted: false } },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!record) throw new NotFoundException('Registro no encontrado.');
    return record;
  }

  async getDashboardStats() {
    const [totalRecords, byStatus, recentActivity] = await Promise.all([
      this.prisma.record.count({ where: { isDeleted: false } }),
      this.prisma.record.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { isDeleted: false },
      }),
      this.prisma.record.findMany({
        where: { isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          format: { select: { name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return { totalRecords, byStatus, recentActivity };
  }
}
