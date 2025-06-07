import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SearchObject } from 'imapflow';
import { ImapNonBlockingService } from '../imap-non-blocking/imap-non-blocking.service';

export interface NetflixOtpParams {
  /** Email del destinatario (opcional para filtrar) */
  to?: string;
  /** Número de correos a revisar (por defecto 5) */
  limit?: number;
  /** Antigüedad máxima en minutos (por defecto 10) */
  maxAgeMinutes?: number;
}

export interface NetflixOtpResult {
  /** Código OTP de 4 dígitos */
  otpCode: string;
  /** UID del mensaje */
  messageUid: string;
  /** Fecha del mensaje */
  messageDate: string;
  /** Asunto del mensaje */
  subject: string;
}

@Injectable()
export class NetflixOtpService {
  private readonly logger = new Logger(NetflixOtpService.name);

  constructor(private readonly imapService: ImapNonBlockingService) {}

  /**
   * Obtiene el último código OTP de Netflix de 4 dígitos
   */
  async getLatestNetflixOtp(
    params: NetflixOtpParams = {},
  ): Promise<NetflixOtpResult> {
    const { to, limit = 5, maxAgeMinutes = 10 } = params;

    const criteria = this.buildSearchCriteria(to);

    const messages = await this.imapService.searchEmails(criteria, {
      limit,
      mailbox: 'INBOX.Netflix',
    });

    if (messages.length === 0) {
      throw new NotFoundException('NOT_FOUND_NETFLIX_OTP');
    }

    const recentEmails = this.filterRecentEmails(messages, maxAgeMinutes);

    if (recentEmails.length === 0) {
      throw new NotFoundException(`NOT_FOUND_NETFLIX_OTP_RECENTLY`);
    }

    const result = await this.extractOtpFromMessages(recentEmails);

    if (!result) {
      throw new NotFoundException('NOT_FOUND_NETFLIX_OTP');
    }

    return result;
  }

  /**
   * Construye los criterios de búsqueda para correos de Netflix
   */
  private buildSearchCriteria(recipientEmail?: string): SearchObject {
    const criteria: SearchObject = {
      or: [
        {
          from: 'info@account.netflix.com',
          subject: 'Netflix: Tu código de inicio de sesión',
        },
      ],
    };

    if (recipientEmail) {
      criteria.to = recipientEmail;
    }

    return criteria;
  }

  /**
   * Filtra los correos por antigüedad máxima permitida
   */
  private filterRecentEmails(
    emails: { date?: string }[],
    maxAgeMinutes: number,
  ) {
    const now = Date.now();
    const threshold = now - maxAgeMinutes * 60 * 1000;

    return emails.filter((email) => {
      const receivedAt = new Date(String(email.date)).getTime();
      return receivedAt >= threshold;
    });
  }

  /**
   * Procesa los correos y extrae el código OTP válido
   */
  private async extractOtpFromMessages(
    emails: { uid?: string; date?: string; envelope?: { subject?: string } }[],
  ): Promise<NetflixOtpResult | null> {
    for (const message of emails.reverse()) {
      const fullMessage = await this.imapService.getMessageByUid(
        message.uid ?? '',
        {
          mailbox: 'INBOX.Netflix',
          fetchOptions: { source: true },
        },
      );

      if (!fullMessage) continue;

      const otp = this.extractOtp(
        fullMessage.text || '',
        fullMessage.html || '',
      );

      if (otp) {
        this.logger.log(`OTP encontrado: ${otp} en mensaje ${message.uid}`);
        return {
          otpCode: otp,
          messageUid: message.uid ?? '',
          messageDate: message.date ?? '',
          subject: message.envelope?.subject || 'Sin asunto',
        };
      }
    }

    return null;
  }

  /**
   * Une contenido de texto y HTML y busca el OTP en el contenido
   */
  private extractOtp(text: string, html: string): string | null {
    const content = `${text} ${html}`;

    const otpPatterns = [
      /\b(\d{4})\b/g, // 4 dígitos sueltos
      /(?:código|code|pin)[\s:]*(\d{4})\b/gi,
      /verification[\s]*code[\s:]*(\d{4})/gi,
      /código[\s]*de[\s]*verificación[\s:]*(\d{4})/gi,
      /<[^>]*>(\d{4})<\/[^>]*>/g,
    ];

    for (const pattern of otpPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const digits = match.replace(/\D/g, '');
          if (digits.length === 4) {
            this.logger.debug(
              `Patrón encontrado: "${match}" -> OTP: ${digits}`,
            );
            return digits;
          }
        }
      }
    }

    // Fallback: cualquier grupo de 4 dígitos
    const fallback = content.match(/\b\d{4}\b/g);
    if (fallback?.length) {
      const lastCode = fallback[fallback.length - 1];
      this.logger.debug(`Fallback OTP encontrado: ${lastCode}`);
      return lastCode;
    }

    return null;
  }
}
