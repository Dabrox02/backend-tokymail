import { Injectable, Logger } from '@nestjs/common';
import { FetchQueryObject, SearchObject } from 'imapflow';
import { ParsedMail, simpleParser } from 'mailparser';
import { ImapConnectionPoolService } from '../imap-connection-pool/imap-connection-pool.service';
import { EmailMessage } from './imap-non-blocking.types';

@Injectable()
export class ImapNonBlockingService {
  private readonly logger = new Logger(ImapNonBlockingService.name);

  constructor(
    private readonly imapConnectionPoolService: ImapConnectionPoolService,
  ) {}

  /**
   * Busca emails con criterios personalizados.
   */
  async searchEmails(
    searchCriteria: SearchObject,
    options: {
      limit?: number;
      mailbox?: string;
      fetchOptions?: FetchQueryObject;
    } = {},
  ): Promise<EmailMessage[]> {
    const {
      limit = 10,
      mailbox = 'INBOX',
      fetchOptions = { envelope: true, headers: true },
    } = options;

    return this.imapConnectionPoolService.executeWithMailboxOpen(
      async (client) => {
        const uids = await client.search(searchCriteria);

        if (uids.length === 0) {
          return [];
        }

        const recentUids = uids.slice(-limit);
        const messages: EmailMessage[] = [];

        for await (const msg of client.fetch(recentUids, fetchOptions)) {
          const { ...rest } = msg;
          const date = msg.envelope?.date?.toISOString() || '';

          messages.push({
            ...rest,
            uid: msg.uid.toString(),
            date,
          });
        }
        return messages;
      },
      mailbox,
    );
  }

  /**
   * Obtiene un mensaje específico por UID.
   */
  async getMessageByUid(
    decryptedUid: string,
    options: {
      mailbox?: string;
      fetchOptions?: FetchQueryObject;
    } = {},
  ): Promise<EmailMessage | null> {
    const { mailbox = 'INBOX', fetchOptions = { envelope: true } } = options;

    return this.imapConnectionPoolService.executeWithMailboxOpen(
      async (client) => {
        try {
          const message = await client.fetchOne(
            decryptedUid.toString(),
            fetchOptions,
            {
              uid: true,
            },
          );

          if (!message) return null;

          let parsedEmail: ParsedMail | undefined;
          const { uid, source, ...rest } = message;

          if (source) {
            const sourceBuffer = Buffer.isBuffer(source)
              ? source
              : Buffer.from(source);
            parsedEmail = await simpleParser(sourceBuffer);
          }

          return {
            ...rest,
            text: parsedEmail?.text || '',
            html: parsedEmail?.html || '',
          };
        } catch (error) {
          return null;
        }
      },
      mailbox,
    );
  }
}
