import { Module } from '@nestjs/common';
import { ImapNonBlockingService } from './imap-non-blocking.service';
import { ImapConnectionPoolModule } from 'src/imap-connection-pool/imap-connection-pool.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [ImapConnectionPoolModule, SharedModule],
  providers: [ImapNonBlockingService],
  exports: [ImapNonBlockingService],
})
export class ImapNonBlockingModule {}
