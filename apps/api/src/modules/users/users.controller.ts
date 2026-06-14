import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.usersService.create(dto, user.id, (req as any).ip || '0.0.0.0');
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.QUALITY, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Listar usuarios' })
  findAll(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll({ role, status, page, limit });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.QUALITY, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.usersService.update(id, dto, user.id, (req as any).ip || '0.0.0.0');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desactivar usuario (no eliminación física - ALCOA+)' })
  deactivate(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.usersService.deactivate(id, user.id, reason, (req as any).ip || '0.0.0.0');
  }

  @Patch(':id/permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar permisos granulares del usuario' })
  updatePermissions(
    @Param('id') userId: string,
    @Body() body: { permissions: { module: string; action: string; granted: boolean }[] },
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.usersService.updatePermissions(userId, body.permissions, user.id, (req as any).ip || '0.0.0.0');
  }
}
