import { Controller, Post, Get, Param, Body, Res, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportFormat } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

class GenerateReportDto {
  @ApiProperty() @IsString() recordId: string;
  @ApiProperty({ enum: ReportFormat }) @IsEnum(ReportFormat) format: ReportFormat;
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generar reporte (PDF, DOCX o XLSX)' })
  generateReport(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.reportsService.generateReport({
      ...dto,
      userId: user.id,
      ipAddress: (req as any).ip || '0.0.0.0',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar reportes generados' })
  findAll(
    @CurrentUser() user: any,
    @Query('recordId') recordId?: string,
  ) {
    return this.reportsService.findAll(undefined, recordId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar reporte generado' })
  async downloadReport(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { report, filePath } = await this.reportsService.getReportFile(id);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}${ext}"`);
    res.setHeader('X-Report-Checksum', report.checksum || '');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
