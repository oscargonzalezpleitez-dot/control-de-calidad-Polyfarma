import { Controller, Post, Get, Delete, Param, Body, UploadedFile, UseInterceptors, Res, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttachmentType } from '@prisma/client';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller({ path: 'attachments', version: '1' })
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('record/:recordId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adjuntar archivo a un registro' })
  upload(
    @Param('recordId') recordId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: AttachmentType,
    @Body('description') description: string,
    @Body('fieldId') fieldId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.attachmentsService.uploadAttachment(
      recordId, file, type || AttachmentType.DOCUMENT, description, user.id,
      (req as any).ip || '0.0.0.0', fieldId,
    );
  }

  @Get('record/:recordId')
  @ApiOperation({ summary: 'Listar adjuntos de un registro' })
  findByRecord(@Param('recordId') recordId: string) {
    return this.attachmentsService.findByRecord(recordId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar adjunto' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { attachment, filePath, integrityValid } = await this.attachmentsService.getFile(id);

    res.setHeader('X-Integrity-Valid', String(integrityValid));
    res.setHeader('X-Checksum', attachment.checksum);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimeType);

    const fs = require('fs');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar adjunto' })
  softDelete(@Param('id') id: string, @CurrentUser() user: any, @Req() req: Request) {
    return this.attachmentsService.softDelete(id, user.id, (req as any).ip || '0.0.0.0');
  }
}
