import { Module, Global } from '@nestjs/common';
import { ImapConnectionPoolService } from './imap-connection-pool.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ImapConnectionPoolService],
  exports: [ImapConnectionPoolService],
})
export class ImapConnectionPoolModule {}
