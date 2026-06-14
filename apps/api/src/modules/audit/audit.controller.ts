import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditAction, AuditModule, UserRole } from '@prisma/client';

@ApiTags('audit')
@ApiBearerAuth()
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.QUALITY, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Obtener registros de audit trail' })
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
  @Roles(UserRole.ADMIN, UserRole.QUALITY, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Historial de cambios de una entidad específica' })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get('verify/:id')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Verificar integridad de un registro de audit trail' })
  async verifyIntegrity(@Param('id') id: string) {
    const isValid = await this.auditService.verifyIntegrity(id);
    return { id, integrityValid: isValid };
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.QUALITY, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Estadísticas del audit trail' })
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
