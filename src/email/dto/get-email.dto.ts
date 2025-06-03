import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { MAILBOX_CONFIG } from '../mailbox.constants';
import { AllowedMailbox } from '../mailbox.types';

export class GetEmailDto {
  @ApiProperty({
    required: false,
    default: 'INBOX.Netflix',
    enum: MAILBOX_CONFIG.ALLOWED_MAILBOXES,
    description: 'Mailbox donde buscar el email',
  })
  @IsOptional()
  @IsIn(MAILBOX_CONFIG.ALLOWED_MAILBOXES, {
    message: `Mailbox debe ser uno de: ${MAILBOX_CONFIG.ALLOWED_MAILBOXES.join(', ')}`,
  })
  mailbox?: AllowedMailbox = 'INBOX.Netflix';
}
