import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { SharedModule } from 'src/shared/shared.module';
import { ImapNonBlockingModule } from '../imap-non-blocking/imap-non-blocking.module';
import { EmailController } from './email.controller';
import { MailboxSecurityService } from './mailbox-security.service';

@Module({
  imports: [ImapNonBlockingModule, AuthModule, SharedModule],
  controllers: [EmailController],
  providers: [MailboxSecurityService],
  exports: [MailboxSecurityService],
})
export class EmailModule {}
