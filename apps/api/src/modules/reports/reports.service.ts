import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule, ReportFormat, ReportStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { format as dateFormat } from 'date-fns';
import { es } from 'date-fns/locale';

export interface GenerateReportDto {
  recordId: string;
  format: ReportFormat;
  userId: string;
  ipAddress: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'reports');

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateReport(dto: GenerateReportDto) {
    const record = await this.prisma.record.findUnique({
      where: { id: dto.recordId },
      include: {
        format: {
          include: { fields: { include: { section: true } }, sections: true },
        },
        fieldValues: {
          include: { field: true, enteredBy: { select: { firstName: true, lastName: true, email: true } } },
        },
        signatures: {
          include: { user: { select: { firstName: true, lastName: true, email: true, position: true } } },
          orderBy: { signedAt: 'asc' },
        },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!record) throw new NotFoundException(`Registro ${dto.recordId} no encontrado`);

    const reportRecord = await this.prisma.report.create({
      data: {
        recordId: dto.recordId,
        formatId: record.formatId,
        name: `${record.format.name}_${record.code}_${Date.now()}`,
        format: dto.format,
        status: ReportStatus.GENERATING,
        generatedById: dto.userId,
      },
    });

    try {
      let filePath: string;
      let fileSize: number;

      switch (dto.format) {
        case ReportFormat.PDF:
          filePath = await this.generatePDF(record, reportRecord.id);
          break;
        case ReportFormat.DOCX:
          filePath = await this.generateDOCX(record, reportRecord.id);
          break;
        case ReportFormat.XLSX:
          filePath = await this.generateXLSX(record, reportRecord.id);
          break;
      }

      const stats = fs.statSync(filePath);
      fileSize = stats.size;
      const checksum = await this.calculateChecksum(filePath);

      await this.prisma.report.update({
        where: { id: reportRecord.id },
        data: {
          status: ReportStatus.COMPLETED,
          filePath,
          fileSize,
          checksum,
        },
      });

      await this.auditService.log({
        userId: dto.userId,
        action: AuditAction.EXPORT,
        module: AuditModule.REPORTS,
        description: `Reporte generado: ${record.format.name} - ${dto.format}`,
        entityType: 'Report',
        entityId: reportRecord.id,
        newValue: { recordId: dto.recordId, format: dto.format, filePath },
        ipAddress: dto.ipAddress,
      });

      return await this.prisma.report.findUnique({ where: { id: reportRecord.id } });
    } catch (error) {
      await this.prisma.report.update({
        where: { id: reportRecord.id },
        data: { status: ReportStatus.FAILED, errorMessage: error.message },
      });
      this.logger.error(`Error generando reporte: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generatePDF(record: any, reportId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.uploadsDir, `${reportId}.pdf`);
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        info: {
          Title: `${record.format.name} - ${record.code}`,
          Author: `${record.createdBy.firstName} ${record.createdBy.lastName}`,
          Subject: 'PharmaQMS - Registro de Calidad',
          Keywords: 'GMP, QMS, Calidad Farmacéutica',
          CreationDate: new Date(),
        },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Encabezado corporativo
      doc.fontSize(18).font('Helvetica-Bold')
        .fillColor('#1e3a5f')
        .text('SISTEMA DE GESTIÓN DE CALIDAD', { align: 'center' });

      doc.fontSize(14).font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text(record.format.name.toUpperCase(), { align: 'center' });

      doc.moveDown(0.5);

      // Línea separadora
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#2563eb').lineWidth(2).stroke();
      doc.moveDown(0.5);

      // Metadatos del registro
      const metaData = [
        ['Código:', record.code],
        ['Estado:', record.status],
        ['Versión del Formato:', record.format.version],
        ['Departamento:', record.format.department || 'N/A'],
        ['Número de Lote:', record.batchNumber || 'N/A'],
        ['Producto:', record.productName || 'N/A'],
        ['Fecha de Inicio:', record.startDate ? dateFormat(record.startDate, 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'],
        ['Elaborado por:', `${record.createdBy.firstName} ${record.createdBy.lastName}`],
        ['Fecha de Creación:', dateFormat(record.createdAt, 'dd/MM/yyyy HH:mm:ss', { locale: es })],
      ];

      doc.fontSize(9).font('Helvetica');
      metaData.forEach(([label, value]) => {
        doc.fillColor('#374151').font('Helvetica-Bold').text(label, { continued: true, width: 140 });
        doc.fillColor('#1f2937').font('Helvetica').text(` ${value}`);
      });

      doc.moveDown(1);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#d1d5db').lineWidth(0.5).stroke();
      doc.moveDown(0.5);

      // Campos del formulario
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f').text('DATOS DEL REGISTRO');
      doc.moveDown(0.5);

      const fieldValueMap = new Map<string, any>(
        record.fieldValues.map((fv: any) => [fv.fieldId, fv] as [string, any]),
      );

      record.format.sections.forEach((section: any) => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#2563eb')
          .text(section.name.toUpperCase());
        doc.moveDown(0.3);

        const sectionFields = record.format.fields.filter(
          (f: any) => f.sectionId === section.id,
        ).sort((a: any, b: any) => a.order - b.order);

        sectionFields.forEach((field: any) => {
          const fv = fieldValueMap.get(field.id);
          const value = fv?.value || fv?.valueNumeric?.toString() ||
            (fv?.valueDate ? dateFormat(fv.valueDate, 'dd/MM/yyyy HH:mm', { locale: es }) : '') || '—';

          doc.fontSize(9);
          doc.fillColor('#6b7280').font('Helvetica-Bold')
            .text(`${field.label}${field.unit ? ` (${field.unit})` : ''}:`, { continued: false });
          doc.fillColor('#111827').font('Helvetica')
            .text(value, { indent: 20 });

          if (fv?.enteredBy) {
            doc.fontSize(7).fillColor('#9ca3af').font('Helvetica-Oblique')
              .text(
                `  Ingresado por: ${fv.enteredBy.firstName} ${fv.enteredBy.lastName} | ${dateFormat(fv.enteredAt, 'dd/MM/yyyy HH:mm:ss', { locale: es })}`,
                { indent: 20 },
              );
          }
          doc.moveDown(0.3);
        });

        doc.moveDown(0.3);
      });

      // Sección de firmas electrónicas
      if (record.signatures && record.signatures.length > 0) {
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f')
          .text('FIRMAS ELECTRÓNICAS (21 CFR Part 11)', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#2563eb').lineWidth(1).stroke();
        doc.moveDown(0.5);

        record.signatures.forEach((sig: any) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937')
            .text(`${sig.type}: ${sig.user.firstName} ${sig.user.lastName}`);
          doc.fontSize(9).font('Helvetica').fillColor('#374151')
            .text(`Cargo: ${sig.user.position || 'N/A'}`);
          doc.text(`Email: ${sig.user.email}`);
          doc.text(`Significado: ${sig.meaning}`);
          doc.text(`Fecha y Hora: ${dateFormat(sig.signedAt, 'dd/MM/yyyy HH:mm:ss', { locale: es })}`);
          doc.text(`IP: ${sig.ipAddress}`);
          doc.fontSize(7).fillColor('#6b7280')
            .text(`Hash de integridad: ${sig.signatureHash.substring(0, 32)}...`);
          doc.moveDown(0.8);
          doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
          doc.moveDown(0.3);
        });
      }

      // Pie de página con hash del documento (ALCOA+ - Integridad)
      const contentHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ recordId: record.id, code: record.code, generatedAt: new Date() }))
        .digest('hex');

      doc.fontSize(7).fillColor('#9ca3af').font('Helvetica')
        .text(
          `Generado por PharmaQMS | ${dateFormat(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })} | Hash: ${contentHash.substring(0, 32)}...`,
          60, doc.page.height - 40, { align: 'center', width: 475 },
        );

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  private async generateXLSX(record: any, reportId: string): Promise<string> {
    const filePath = path.join(this.uploadsDir, `${reportId}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'PharmaQMS';
    workbook.created = new Date();
    workbook.title = `${record.format.name} - ${record.code}`;

    const worksheet = workbook.addWorksheet('Datos', {
      pageSetup: { orientation: 'landscape', fitToPage: true },
    });

    // Encabezado
    const headerRow = worksheet.addRow([record.format.name.toUpperCase()]);
    worksheet.mergeCells(`A1:F1`);
    headerRow.font = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;

    worksheet.addRow([`Código: ${record.code}`, '', `Estado: ${record.status}`, '', `Versión: ${record.format.version}`]);
    worksheet.addRow([`Elaborado: ${record.createdBy.firstName} ${record.createdBy.lastName}`, '', `Fecha: ${dateFormat(record.createdAt, 'dd/MM/yyyy HH:mm:ss', { locale: es })}`]);
    worksheet.addRow([]);

    // Cabecera de campos
    const colHeaders = worksheet.addRow(['Campo', 'Unidad', 'Valor', 'Ingresado por', 'Fecha de Ingreso', 'Sección']);
    colHeaders.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
      };
    });

    const fieldValueMap = new Map(record.fieldValues.map((fv: any) => [fv.fieldId, fv]));
    let rowIndex = 6;

    record.format.fields
      .sort((a: any, b: any) => a.order - b.order)
      .forEach((field: any, idx: number) => {
        const fv = fieldValueMap.get(field.id) as any;
        const value = fv?.value || fv?.valueNumeric?.toString() ||
          (fv?.valueDate ? dateFormat(fv.valueDate, 'dd/MM/yyyy HH:mm', { locale: es }) : '') || '';

        const row = worksheet.addRow([
          field.label,
          field.unit || '',
          value,
          fv?.enteredBy ? `${fv.enteredBy.firstName} ${fv.enteredBy.lastName}` : '',
          fv?.enteredAt ? dateFormat(fv.enteredAt, 'dd/MM/yyyy HH:mm:ss', { locale: es }) : '',
          field.section?.name || '',
        ]);

        if (idx % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
        rowIndex++;
      });

    // Firmas
    if (record.signatures?.length > 0) {
      const sigSheet = workbook.addWorksheet('Firmas Electrónicas');
      sigSheet.addRow(['FIRMAS ELECTRÓNICAS - 21 CFR Part 11']).font = { bold: true, size: 12 };
      sigSheet.addRow([]);
      const sigHeaders = sigSheet.addRow(['Tipo', 'Nombre', 'Email', 'Cargo', 'Significado', 'Fecha/Hora', 'IP', 'Hash']);
      sigHeaders.eachCell(c => { c.font = { bold: true }; });

      record.signatures.forEach((sig: any) => {
        sigSheet.addRow([
          sig.type,
          `${sig.user.firstName} ${sig.user.lastName}`,
          sig.user.email,
          sig.user.position || '',
          sig.meaning,
          dateFormat(sig.signedAt, 'dd/MM/yyyy HH:mm:ss', { locale: es }),
          sig.ipAddress,
          sig.signatureHash.substring(0, 32) + '...',
        ]);
      });
    }

    worksheet.columns.forEach(col => { col.width = 25; });
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private async generateDOCX(record: any, reportId: string): Promise<string> {
    const filePath = path.join(this.uploadsDir, `${reportId}.docx`);

    if (record.format.templateFile && fs.existsSync(record.format.templateFile)) {
      const templateContent = fs.readFileSync(record.format.templateFile, 'binary');
      const zip = new PizZip(templateContent);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      const fieldValueMap = new Map(record.fieldValues.map((fv: any) => [fv.field.name, fv?.value || fv?.valueNumeric?.toString() || '']));
      doc.render({
        ...Object.fromEntries(fieldValueMap),
        CODIGO: record.code,
        ESTADO: record.status,
        FECHA_CREACION: dateFormat(record.createdAt, 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        ELABORADO_POR: `${record.createdBy.firstName} ${record.createdBy.lastName}`,
        VERSION_FORMATO: record.format.version,
        NUMERO_LOTE: record.batchNumber || '',
        PRODUCTO: record.productName || '',
      });
      fs.writeFileSync(filePath, doc.getZip().generate({ type: 'nodebuffer' }));
      return filePath;
    }

    const fieldValueMap = new Map<string, any>(record.fieldValues.map((fv: any) => [fv.fieldId, fv]));

    const cellBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
    };

    const makeHeaderCell = (text: string) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })] })],
        shading: { type: ShadingType.SOLID, color: '2563EB' },
        borders: cellBorder,
      });

    const makeCell = (text: string, shade = false) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
        shading: shade ? { type: ShadingType.SOLID, color: 'F8FAFC' } : undefined,
        borders: cellBorder,
      });

    // Tabla de metadatos
    const metaRows = [
      ['Código', record.code],
      ['Estado', record.status],
      ['Versión Formato', record.format.version.toString()],
      ['Departamento', record.format.department || 'N/A'],
      ['Número de Lote', record.batchNumber || 'N/A'],
      ['Producto', record.productName || 'N/A'],
      ['Elaborado por', `${record.createdBy.firstName} ${record.createdBy.lastName}`],
      ['Fecha de Creación', dateFormat(record.createdAt, 'dd/MM/yyyy HH:mm:ss', { locale: es })],
    ].map(
      ([label, value], i) =>
        new TableRow({
          children: [makeCell(label, i % 2 === 0), makeCell(value, i % 2 === 0)],
        }),
    );

    // Tabla de campos por sección
    const fieldRows = [
      new TableRow({
        children: [makeHeaderCell('Campo'), makeHeaderCell('Unidad'), makeHeaderCell('Valor'), makeHeaderCell('Ingresado por')],
      }),
    ];

    record.format.fields
      .sort((a: any, b: any) => a.order - b.order)
      .forEach((field: any, i: number) => {
        const fv = fieldValueMap.get(field.id) as any;
        const value =
          fv?.value ||
          fv?.valueNumeric?.toString() ||
          (fv?.valueDate ? dateFormat(fv.valueDate, 'dd/MM/yyyy HH:mm', { locale: es }) : '') ||
          '—';
        const enteredBy = fv?.enteredBy ? `${fv.enteredBy.firstName} ${fv.enteredBy.lastName}` : '—';
        const shade = i % 2 === 0;
        fieldRows.push(
          new TableRow({
            children: [makeCell(field.label, shade), makeCell(field.unit || '', shade), makeCell(value, shade), makeCell(enteredBy, shade)],
          }),
        );
      });

    // Filas de firmas electrónicas
    const sigChildren: any[] = [];
    if (record.signatures?.length > 0) {
      sigChildren.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'FIRMAS ELECTRÓNICAS (21 CFR Part 11)', bold: true })] }),
      );
      const sigRows = [
        new TableRow({
          children: [makeHeaderCell('Tipo'), makeHeaderCell('Firmante'), makeHeaderCell('Significado'), makeHeaderCell('Fecha/Hora'), makeHeaderCell('Hash')],
        }),
        ...record.signatures.map(
          (sig: any, i: number) =>
            new TableRow({
              children: [
                makeCell(sig.type, i % 2 === 0),
                makeCell(`${sig.user.firstName} ${sig.user.lastName}`, i % 2 === 0),
                makeCell(sig.meaning, i % 2 === 0),
                makeCell(dateFormat(sig.signedAt, 'dd/MM/yyyy HH:mm:ss', { locale: es }), i % 2 === 0),
                makeCell(sig.signatureHash.substring(0, 20) + '...', i % 2 === 0),
              ],
            }),
        ),
      ];
      sigChildren.push(new Table({ rows: sigRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    }

    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ recordId: record.id, code: record.code, generatedAt: new Date() }))
      .digest('hex');

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'SISTEMA DE GESTIÓN DE CALIDAD', bold: true, color: '1E3A5F', size: 32 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: record.format.name.toUpperCase(), bold: true, color: '2563EB', size: 26 })],
            }),
            new Paragraph({}),
            new Paragraph({ children: [new TextRun({ text: 'INFORMACIÓN DEL REGISTRO', bold: true, size: 22, color: '1E3A5F' })] }),
            new Paragraph({}),
            new Table({ rows: metaRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
            new Paragraph({}),
            new Paragraph({ children: [new TextRun({ text: 'DATOS DEL FORMULARIO', bold: true, size: 22, color: '1E3A5F' })] }),
            new Paragraph({}),
            new Table({ rows: fieldRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
            new Paragraph({}),
            ...sigChildren,
            new Paragraph({}),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `Generado por PharmaQMS | ${dateFormat(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })} | Hash: ${contentHash.substring(0, 32)}...`, size: 14, color: '9CA3AF' })],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async getReportFile(reportId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report || report.status !== ReportStatus.COMPLETED || !report.filePath) {
      throw new NotFoundException('Reporte no disponible');
    }
    if (!fs.existsSync(report.filePath)) {
      throw new NotFoundException('Archivo de reporte no encontrado');
    }
    return { report, filePath: report.filePath };
  }

  async findAll(userId?: string, recordId?: string) {
    return this.prisma.report.findMany({
      where: {
        ...(userId && { generatedById: userId }),
        ...(recordId && { recordId }),
      },
      include: {
        generatedBy: { select: { firstName: true, lastName: true, email: true } },
        record: { select: { code: true } },
      },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
