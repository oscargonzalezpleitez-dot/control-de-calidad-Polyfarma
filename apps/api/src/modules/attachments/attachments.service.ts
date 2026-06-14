import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule, AttachmentType } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';

@Injectable()
export class AttachmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async uploadAttachment(
    recordId: string,
    file: Express.Multer.File,
    type: AttachmentType,
    description: string,
    userId: string,
    ipAddress: string,
    fieldId?: string,
  ) {
    const checksum = await this.calculateChecksum(file.path);

    const attachment = await this.prisma.attachment.create({
      data: {
        recordId,
        fieldId,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        type,
        checksum,
        description,
        uploadedById: userId,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      module: AuditModule.ATTACHMENTS,
      description: `Adjunto subido: ${file.originalname} en registro ${recordId}`,
      entityType: 'Attachment',
      entityId: attachment.id,
      newValue: { originalName: file.originalname, size: file.size, checksum },
      ipAddress,
    });

    return attachment;
  }

  async findByRecord(recordId: string) {
    return this.prisma.attachment.findMany({
      where: { recordId, isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getFile(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.isDeleted) {
      throw new NotFoundException('Adjunto no encontrado.');
    }

    const filePath = require('path').join(
      process.cwd(), 'uploads', 'attachments', attachment.storedName,
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo físico no encontrado.');
    }

    const currentChecksum = await this.calculateChecksum(filePath);
    const integrityValid = currentChecksum === attachment.checksum;

    return { attachment, filePath, integrityValid };
  }

  async softDelete(attachmentId: string, userId: string, ipAddress: string) {
    const attachment = await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE,
      module: AuditModule.ATTACHMENTS,
      description: `Adjunto eliminado (lógicamente): ${attachment.originalName}`,
      entityType: 'Attachment',
      entityId: attachmentId,
      ipAddress,
    });
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (d) => hash.update(d));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}
