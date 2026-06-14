import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecordsService, CreateRecordDto, SaveFieldValuesDto } from './records.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RecordStatus, UserRole } from '@prisma/client';

@ApiTags('records')
@ApiBearerAuth()
@Controller({ path: 'records', version: '1' })
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo registro (instancia de formulario)' })
  create(@Body() dto: CreateRecordDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.recordsService.create(dto, user.id, (req as any).ip || '0.0.0.0');
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros con filtros' })
  findAll(
    @Query('formatId') formatId?: string,
    @Query('status') status?: RecordStatus,
    @Query('batchNumber') batchNumber?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.recordsService.findAll({ formatId, status, batchNumber, page, limit });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Estadísticas del dashboard' })
  getDashboardStats() {
    return this.recordsService.getDashboardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener registro completo con valores y firmas' })
  findOne(@Param('id') id: string) {
    return this.recordsService.findOne(id);
  }

  @Patch(':id/values')
  @ApiOperation({ summary: 'Guardar/actualizar valores de campos (con audit trail)' })
  saveFieldValues(
    @Param('id') id: string,
    @Body() dto: SaveFieldValuesDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.recordsService.saveFieldValues(id, dto, user.id, (req as any).ip || '0.0.0.0');
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar registro como completado' })
  complete(@Param('id') id: string, @CurrentUser() user: any, @Req() req: Request) {
    return this.recordsService.complete(id, user.id, (req as any).ip || '0.0.0.0');
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar registro (no eliminación física - ALCOA+)' })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.recordsService.cancel(id, reason, user.id, (req as any).ip || '0.0.0.0');
  }

  @Patch(':id/invalidate')
  @Roles(UserRole.ADMIN, UserRole.QUALITY)
  @ApiOperation({ summary: 'Invalidar registro con motivo documentado (ALCOA+)' })
  invalidate(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.recordsService.invalidate(id, reason, user.id, (req as any).ip || '0.0.0.0');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar registro (soft-delete) — requiere contraseña del administrador' })
  remove(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('password') password: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.recordsService.delete(id, reason, password, user.id, (req as any).ip || '0.0.0.0');
  }
}
