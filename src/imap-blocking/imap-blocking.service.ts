import { Injectable, Logger } from '@nestjs/common';
import { ImapConnectionPoolService } from '../imap-connection-pool/imap-connection-pool.service';
import {
  CopyResponseObject,
  SearchObject,
  MailboxRenameResponse,
} from 'imapflow';

@Injectable()
export class ImapBlockingService {
  private readonly logger = new Logger(ImapBlockingService.name);

  constructor(
    private readonly imapConnectionPoolService: ImapConnectionPoolService,
  ) {}

  /**
   * Marca mensajes como leídos/no leídos.
   */
  async markMessagesAsRead(
    range: string | number[] | SearchObject,
    read: boolean = true,
    options: { mailbox?: string; uid?: boolean } = {},
  ): Promise<boolean> {
    const { mailbox = 'INBOX', uid = true } = options;

    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        const flag = '\\Seen';

        if (read) {
          await client.messageFlagsAdd(range, [flag], { uid });
        } else {
          await client.messageFlagsRemove(range, [flag], { uid });
        }

        this.logger.log(
          `Mensajes marcados como ${read ? 'leídos' : 'no leídos'} en ${mailbox}`,
        );
        return true;
      },
      mailbox,
    );
  }

  /**
   * Mueve mensajes a otra carpeta.
   */
  async moveMessages(
    range: string | number[] | SearchObject,
    destinationMailbox: string,
    options: { mailbox?: string; uid?: boolean } = {},
  ): Promise<CopyResponseObject> {
    const { mailbox = 'INBOX', uid = true } = options;

    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        const result = await client.messageMove(range, destinationMailbox, {
          uid,
        });

        this.logger.log(
          `Movidos ${result.uidMap?.size} mensajes de ${mailbox} a ${destinationMailbox}`,
        );

        return result;
      },
      mailbox,
    );
  }

  /**
   * Copia mensajes a otra carpeta.
   */
  async copyMessages(
    range: string | number[] | SearchObject,
    destinationMailbox: string,
    options: { mailbox?: string; uid?: boolean } = {},
  ): Promise<CopyResponseObject> {
    const { mailbox = 'INBOX', uid = true } = options;

    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        const result = await client.messageCopy(range, destinationMailbox, {
          uid,
        });

        this.logger.log(
          `Copiados ${result.uidMap?.size} mensajes de ${mailbox} a ${destinationMailbox}`,
        );

        return result;
      },
      mailbox,
    );
  }

  /**
   * Elimina mensajes permanentemente.
   */
  async deleteMessages(
    range: string | number[] | SearchObject,
    options: { mailbox?: string; uid?: boolean } = {},
  ): Promise<boolean> {
    const { mailbox = 'INBOX', uid = true } = options;

    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        await client.messageDelete(range, { uid });

        this.logger.log(`Mensajes eliminados permanentemente de ${mailbox}`);
        return true;
      },
      mailbox,
    );
  }

  /**
   * Añade flags personalizados a mensajes.
   */
  async addFlags(
    range: string | number[] | SearchObject,
    flags: string[],
    options: { mailbox?: string; uid?: boolean } = {},
  ): Promise<boolean> {
    const { mailbox = 'INBOX', uid = true } = options;

    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        await client.messageFlagsAdd(range, flags, { uid });

        this.logger.log(
          `Flags añadidos a mensajes en ${mailbox}: ${flags.join(', ')}`,
        );
        return true;
      },
      mailbox,
    );
  }

  /**
   * Remueve flags de mensajes.
   */
  async removeFlags(
    range: string | number[] | SearchObject,
    flags: string[],
    options: { mailbox?: string; uid?: boolean } = {},
  ): Promise<boolean> {
    const { mailbox = 'INBOX', uid = true } = options;

    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        await client.messageFlagsRemove(range, flags, { uid });

        this.logger.log(
          `Flags removidos de mensajes en ${mailbox}: ${flags.join(', ')}`,
        );
        return true;
      },
      mailbox,
    );
  }

  /**
   * Crea un nuevo mailbox.
   */
  async createMailbox(path: string): Promise<{ path: string }> {
    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        const result = await client.mailboxCreate(path);

        this.logger.log(`Mailbox creado: ${result.path}`);
        return result;
      },
    );
  }

  /**
   * Elimina un mailbox.
   */
  async deleteMailbox(path: string): Promise<{ path: string }> {
    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        const result = await client.mailboxDelete(path);

        this.logger.log(`Mailbox eliminado: ${result.path}`);
        return result;
      },
    );
  }

  /**
   * Renombra un mailbox.
   */
  async renameMailbox(
    oldPath: string,
    newPath: string,
  ): Promise<MailboxRenameResponse> {
    return this.imapConnectionPoolService.executeWithMailboxLock(
      async (client) => {
        const result = await client.mailboxRename(oldPath, newPath);

        this.logger.log(
          `Mailbox renombrado: ${result.path} → ${result.newPath}`,
        );
        return result;
      },
    );
  }
}
