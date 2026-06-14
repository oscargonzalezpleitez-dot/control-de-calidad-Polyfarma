import { Controller, Post, Get, Patch, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SignaturesService } from './signatures.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, SignatureType, SignaturePurpose } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsNotEmpty, MinLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateSignatureDto {
  @ApiProperty() @IsString() @IsNotEmpty() password: string;
  @ApiProperty({ enum: SignatureType }) @IsEnum(SignatureType) type: SignatureType;
  @ApiProperty({ enum: SignaturePurpose }) @IsEnum(SignaturePurpose) purpose: SignaturePurpose;
  @ApiProperty() @IsString() @MinLength(5) meaning: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comments?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recordId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() approvalId?: string;
  @IsOptional() @IsObject() dataToSign?: Record<string, any>;
}

@ApiTags('signatures')
@ApiBearerAuth()
@Controller({ path: 'signatures', version: '1' })
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear firma electrónica (21 CFR Part 11)' })
  createSignature(
    @Body() dto: CreateSignatureDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.signaturesService.createSignature({
      ...dto,
      userId: user.id,
      ipAddress: (req as any).ip || '0.0.0.0',
      userAgent: (req as any).headers?.['user-agent'],
    });
  }

  @Get('record/:recordId')
  @ApiOperation({ summary: 'Obtener firmas de un registro' })
  getSignaturesForRecord(@Param('recordId') recordId: string) {
    return this.signaturesService.getSignaturesForRecord(recordId);
  }

  @Get(':id/verify')
  @ApiOperation({ summary: 'Verificar integridad de firma electrónica' })
  verifySignature(@Param('id') id: string) {
    return this.signaturesService.verifySignature(id);
  }

  @Patch(':id/revoke')
  @Roles(UserRole.ADMIN, UserRole.QUALITY)
  @ApiOperation({ summary: 'Revocar firma electrónica (con auditoría)' })
  revokeSignature(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.signaturesService.revokeSignature(
      id,
      reason,
      user.id,
      (req as any).ip || '0.0.0.0',
    );
  }
}
