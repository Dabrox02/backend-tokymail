import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SearchObject } from 'imapflow';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ImapNonBlockingService } from '../imap-non-blocking/imap-non-blocking.service';
import { GetEmailsDto } from './dto/get-emails.dto';
import { GetEmailDto } from './dto/get-email.dto';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { EncryptionService } from 'src/shared/encryption.service';
import { EmailMessage } from 'src/imap-non-blocking/imap-non-blocking.types';

@ApiTags('Emails')
@Controller('emails')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly imapNonBlockingService: ImapNonBlockingService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Get('search')
  async getEmails(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetEmailsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { to, from, since, limit, mailbox } = query;

    this.logger.log(
      `Consulta de Emails [Bandeja: ${mailbox} | Usuario: ${user.email}]`,
    );

    const searchCriteria: SearchObject = {};

    if (to) {
      searchCriteria.to = to;
    }
    if (from) {
      searchCriteria.from = from;
    }
    if (since) {
      searchCriteria.since = new Date(since);
    }

    this.logger.log(
      `Buscando emails [Bandeja: ${mailbox} | Criterios: ${JSON.stringify(searchCriteria)} | Límite: ${limit}]`,
    );

    try {
      const messages = await this.imapNonBlockingService.searchEmails(
        searchCriteria,
        {
          limit,
          mailbox,
          fetchOptions: { envelope: true, bodyStructure: false, source: false },
        },
      );

      return messages.reduce((acc: EmailMessage[], message) => {
        if (!message) return acc;
        if (message.envelope?.to?.[0]?.address !== to) return [];

        const encryptedUid = this.encryptionService.encrypt(
          message?.uid?.toString() || '',
        );

        acc.push({
          ...message,
          uid: encryptedUid ?? '',
        });

        return acc;
      }, []);
    } catch (error) {
      this.logger.error(`Falló búsqueda de emails [Error: ${error}]`);
      throw new InternalServerErrorException('FAILED_FETCHING_EMAILS');
    }
  }

  @Get(':uid')
  async getEmailByUid(
    @Param('uid') encryptedUid: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    let uid: string;
    const { mailbox } = query;

    try {
      uid = this.encryptionService.decrypt(encryptedUid);
    } catch (error) {
      this.logger.warn(
        `Fallo la desencriptación [UID: ${encryptedUid} | Error: ${error}]`,
      );
      throw new BadRequestException('INVALID_UID');
    }

    this.logger.log(
      `Consulta de Email [UID: ${uid} | Bandeja: ${mailbox} | Usuario: ${user.email}]`,
    );

    const message = await this.imapNonBlockingService.getMessageByUid(uid, {
      mailbox,
      fetchOptions: { envelope: true, bodyStructure: true, source: true },
    });

    if (!message) {
      this.logger.warn(
        `Email no encontrado [UID: ${uid} | Bandeja: ${mailbox}]`,
      );
      throw new NotFoundException(`UID_NOT_FOUND`);
    }

    return {
      uid: encryptedUid,
      date: message.envelope?.date?.toISOString(),
      envelope: message.envelope,
      html: message.html,
      text: message.text,
    };
  }
}
