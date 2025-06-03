import { Module } from '@nestjs/common';
import { ImapConnectionPoolModule } from 'src/imap-connection-pool/imap-connection-pool.module';
import { ImapBlockingService } from './imap-blocking.service';

@Module({
  imports: [ImapConnectionPoolModule],
  providers: [ImapBlockingService],
  exports: [ImapBlockingService],
})
export class ImapBlockingModule {}
