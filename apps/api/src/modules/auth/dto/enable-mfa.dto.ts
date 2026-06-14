import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableMfaDto {
  @ApiProperty({ description: 'Código TOTP de 6 dígitos para verificar configuración MFA' })
  @IsString()
  @Length(6, 6)
  token: string;
}
