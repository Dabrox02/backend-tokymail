import { Module } from '@nestjs/common';
import { NetflixOtpService } from './netflix-otp.service';
import { NetflixOtpController } from './netflix-otp.controller';
import { ImapNonBlockingModule } from 'src/imap-non-blocking/imap-non-blocking.module';

@Module({
  imports: [ImapNonBlockingModule],
  providers: [NetflixOtpService],
  exports: [NetflixOtpService],
  controllers: [NetflixOtpController],
})
export class NetflixModule {}
