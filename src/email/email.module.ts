import { Module } from '@nestjs/common';
import { ImapNonBlockingModule } from '../imap-non-blocking/imap-non-blocking.module';
import { EmailController } from './email.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MailboxSecurityService } from './mailbox-security.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [ImapNonBlockingModule, AuthModule, SharedModule],
  controllers: [EmailController],
  providers: [MailboxSecurityService],
  exports: [MailboxSecurityService],
})
export class EmailModule {}
