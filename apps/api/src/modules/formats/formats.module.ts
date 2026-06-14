import { Module } from '@nestjs/common';
import { FormatsService } from './formats.service';
import { FormatsController } from './formats.controller';
import { AuditModule } from '../audit/audit.module';
import { SignaturesModule } from '../signatures/signatures.module';

@Module({
  imports: [AuditModule, SignaturesModule],
  providers: [FormatsService],
  controllers: [FormatsController],
  exports: [FormatsService],
})
export class FormatsModule {}
