import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { MAILBOX_CONFIG } from '../mailbox.constants';
import { AllowedMailbox } from '../mailbox.types';

export class GetEmailsDto {
  @ApiProperty({ required: false, description: 'Email del destinatario' })
  @IsOptional()
  @IsEmail()
  to?: string;

  @ApiProperty({ required: false, description: 'Email del remitente' })
  @IsOptional()
  @IsEmail()
  from?: string;

  @ApiProperty({
    required: false,
    description: 'Fecha desde cuando buscar (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiProperty({
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Límite de emails a retornar',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    required: false,
    default: 'INBOX',
    enum: MAILBOX_CONFIG.ALLOWED_MAILBOXES,
    description: 'Mailbox a consultar',
  })
  @IsOptional()
  @IsIn(MAILBOX_CONFIG.ALLOWED_MAILBOXES, {
    message: `Mailbox debe ser uno de: ${MAILBOX_CONFIG.ALLOWED_MAILBOXES.join(', ')}`,
  })
  mailbox?: AllowedMailbox = 'INBOX.Netflix';
}
