import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FormatsService, CreateFormatDto } from './formats.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FormatStatus, FormatType, UserRole } from '@prisma/client';

@ApiTags('formats')
@ApiBearerAuth()
@Controller({ path: 'formats', version: '1' })
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.QUALITY, UserRole.REGULATORY_AFFAIRS)
  @ApiOperation({ summary: 'Crear nuevo formato de formulario' })
  create(@Body() dto: CreateFormatDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.formatsService.create(dto, user.id, (req as any).ip || '0.0.0.0');
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los formatos' })
  findAll(
    @Query('status') status?: FormatStatus,
    @Query('type') type?: FormatType,
    @Query('department') department?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.formatsService.findAll({ status, type, department, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener formato por ID con todos sus campos' })
  findOne(@Param('id') id: string) {
    return this.formatsService.findOne(id);
  }

  @Patch(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.QUALITY, UserRole.REGULATORY_AFFAIRS)
  @ApiOperation({ summary: 'Enviar formato a flujo de aprobación' })
  submitForApproval(@Param('id') id: string, @CurrentUser() user: any, @Req() req: Request) {
    return this.formatsService.submitForApproval(id, user.id, (req as any).ip || '0.0.0.0');
  }

  @Patch(':id/approve/:approvalId')
  @ApiOperation({ summary: 'Aprobar formato (firma electrónica implícita)' })
  approve(
    @Param('id') id: string,
    @Param('approvalId') approvalId: string,
    @Body('comments') comments: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.formatsService.approve(id, approvalId, comments, user.id, (req as any).ip || '0.0.0.0');
  }

  @Post(':id/new-version')
  @Roles(UserRole.ADMIN, UserRole.QUALITY)
  @ApiOperation({ summary: 'Crear nueva versión del formato (control de versiones)' })
  createNewVersion(@Param('id') id: string, @CurrentUser() user: any, @Req() req: Request) {
    return this.formatsService.createNewVersion(id, user.id, (req as any).ip || '0.0.0.0');
  }

  @Patch(':id/obsolete')
  @Roles(UserRole.ADMIN, UserRole.QUALITY)
  @ApiOperation({ summary: 'Marcar formato como obsoleto' })
  obsolete(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.formatsService.obsolete(id, reason, user.id, (req as any).ip || '0.0.0.0');
  }
}
