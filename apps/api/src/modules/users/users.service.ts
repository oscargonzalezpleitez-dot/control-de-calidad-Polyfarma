import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule, UserRole, UserStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface CreateUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  position?: string;
  employeeId?: string;
  phone?: string;
  password: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  position?: string;
  phone?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, createdById: string, ipAddress: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { username: dto.username }] },
    });

    if (existing) {
      throw new ConflictException('El email o nombre de usuario ya existe.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        department: dto.department,
        position: dto.position,
        employeeId: dto.employeeId,
        phone: dto.phone,
        passwordHash,
        status: UserStatus.ACTIVE,
        signatureEnabled: true,
        mustChangePassword: true,
        createdBy: createdById,
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.passwordHistory.create({
      data: { userId: user.id, passwordHash },
    });

    await this.auditService.log({
      userId: createdById,
      action: AuditAction.CREATE,
      module: AuditModule.USERS,
      description: `Usuario creado: ${user.email} (${user.role})`,
      entityType: 'User',
      entityId: user.id,
      newValue: { email: user.email, role: user.role, status: user.status },
      ipAddress,
    });

    const { passwordHash: _, mfaSecret, signaturePin, ...safeUser } = user;
    return safeUser;
  }

  async findAll(params: { role?: UserRole; status?: UserStatus; page?: number; limit?: number }) {
    const { page: rawPage, limit: rawLimit, ...filters } = params;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const where: Prisma.UserWhereInput = { isDeleted: false };

    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, username: true, firstName: true, lastName: true,
          role: true, status: true, department: true, position: true, employeeId: true,
          mfaEnabled: true, signatureEnabled: true, lastLoginAt: true, createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        role: true, status: true, department: true, position: true, employeeId: true,
        mfaEnabled: true, signatureEnabled: true, lastLoginAt: true, createdAt: true,
        permissions: true,
      },
    });

    if (!user || (await this.prisma.user.findUnique({ where: { id } }))?.isDeleted) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedById: string, ipAddress: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Usuario no encontrado.');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { ...dto },
    });

    await this.auditService.log({
      userId: updatedById,
      action: AuditAction.UPDATE,
      module: AuditModule.USERS,
      description: `Usuario actualizado: ${updated.email}`,
      entityType: 'User',
      entityId: id,
      oldValue: { role: existing.role, status: existing.status },
      newValue: { role: updated.role, status: updated.status },
      ipAddress,
    });

    const { passwordHash, mfaSecret, signaturePin, ...safeUser } = updated;
    return safeUser;
  }

  async deactivate(id: string, deactivatedById: string, reason: string, ipAddress: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deactivatedById,
      },
    });

    // Revocar todas las sesiones activas
    await this.prisma.session.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedBy: deactivatedById },
    });

    await this.auditService.log({
      userId: deactivatedById,
      action: AuditAction.DELETE,
      module: AuditModule.USERS,
      description: `Usuario desactivado: ${user.email}`,
      entityType: 'User',
      entityId: id,
      changeReason: reason,
      ipAddress,
    });
  }

  async updatePermissions(
    userId: string,
    permissions: { module: string; action: string; granted: boolean }[],
    grantedById: string,
    ipAddress: string,
  ) {
    const results = await Promise.all(
      permissions.map((p) =>
        this.prisma.userPermission.upsert({
          where: { userId_module_action: { userId, module: p.module, action: p.action } },
          update: { granted: p.granted },
          create: { userId, module: p.module, action: p.action, granted: p.granted, grantedBy: grantedById },
        }),
      ),
    );

    await this.auditService.log({
      userId: grantedById,
      action: AuditAction.PERMISSION_CHANGE,
      module: AuditModule.USERS,
      description: `Permisos actualizados para usuario ${userId}`,
      entityType: 'User',
      entityId: userId,
      newValue: { permissions },
      ipAddress,
    });

    return results;
  }
}
