import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImapBlockingModule } from './imap-blocking/imap-blocking.module';
import { ImapNonBlockingModule } from './imap-non-blocking/imap-non-blocking.module';
import { ImapConnectionPoolModule } from './imap-connection-pool/imap-connection-pool.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ImapConnectionPoolModule,
    ImapBlockingModule,
    ImapNonBlockingModule,
    EmailModule,
    AuthModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
