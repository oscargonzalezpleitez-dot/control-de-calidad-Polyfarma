import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditAction, AuditModule } from '@prisma/client';

@ApiTags('audit')
@ApiBearerAuth()
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener registros de audit log' })
  findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('module') module?: AuditModule,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({
      userId,
      action,
      module,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Historial de cambios de una entidad' })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get('verify/:id')
  @ApiOperation({ summary: 'Verificar integridad de un registro' })
  async verifyIntegrity(@Param('id') id: string) {
    const isValid = await this.auditService.verifyIntegrity(id);
    return { id, integrityValid: isValid };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Estadísticas del audit log' })
  getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getStatistics(
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date(),
    );
  }
}
