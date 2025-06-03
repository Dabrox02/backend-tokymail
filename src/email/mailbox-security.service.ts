import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { MAILBOX_CONFIG } from './mailbox.constants';
import {
  AllowedMailbox,
  MailboxAccessResult,
  MailboxValidationOptions,
  UserRole,
} from './mailbox.types';

@Injectable()
export class MailboxSecurityService {
  private readonly logger = new Logger(MailboxSecurityService.name);

  /**
   * Valida el acceso a un mailbox específico
   * @param mailbox - Nombre del mailbox a validar
   * @param options - Opciones de validación (usuario, rol, etc.)
   * @throws ForbiddenException si el acceso es denegado
   */
  validateMailboxAccess(
    mailbox: string,
    options: MailboxValidationOptions,
  ): void {
    const { userEmail, userRole, requestId } = options;

    // Log de inicio de validación
    this.logger.debug(
      `Validando acceso a mailbox: ${mailbox} para usuario: ${userEmail}${requestId ? ` [Request: ${requestId}]` : ''}`,
    );

    // 1. Validar formato del mailbox
    const sanitizedMailbox = this.sanitizeMailboxName(mailbox);
    if (sanitizedMailbox !== mailbox) {
      this.logSecurityEvent('INVALID_MAILBOX_FORMAT', {
        mailbox,
        sanitizedMailbox,
        userEmail,
        requestId,
      });
      throw new ForbiddenException(
        'Nombre de mailbox contiene caracteres no válidos',
      );
    }

    // 2. Validar contra lista general de mailboxes permitidos
    if (!this.isMailboxGenerallyAllowed(mailbox)) {
      this.logSecurityEvent('MAILBOX_NOT_ALLOWED', {
        mailbox,
        userEmail,
        allowedMailboxes: MAILBOX_CONFIG.ALLOWED_MAILBOXES,
        requestId,
      });
      throw new ForbiddenException(
        `Acceso denegado al mailbox: ${mailbox}. Mailboxes permitidos: ${MAILBOX_CONFIG.ALLOWED_MAILBOXES.join(', ')}`,
      );
    }

    // 3. Validar acceso basado en rol (SOLO SI ESTÁ HABILITADO)
    if (
      MAILBOX_CONFIG.SECURITY.ENABLE_ROLE_VALIDATION &&
      userRole &&
      !this.isMailboxAllowedForRole(mailbox, userRole)
    ) {
      this.logSecurityEvent('ROLE_ACCESS_DENIED', {
        mailbox,
        userEmail,
        userRole,
        allowedForRole: MAILBOX_CONFIG.ROLE_BASED_ACCESS[userRole],
        requestId,
      });
      throw new ForbiddenException(
        `Su rol '${userRole}' no tiene permisos para acceder al mailbox: ${mailbox}`,
      );
    }

    // Log de acceso exitoso
    this.logger.log(
      `✅ Acceso autorizado a mailbox: ${mailbox} para usuario: ${userEmail}${userRole && MAILBOX_CONFIG.SECURITY.ENABLE_ROLE_VALIDATION ? ` (rol: ${userRole})` : ''}${requestId ? ` [Request: ${requestId}]` : ''}`,
    );
  }

  /**
   * Obtiene la lista de mailboxes permitidos para un usuario
   * @param userRole - Rol del usuario (opcional por ahora)
   * @returns Array de mailboxes permitidos
   */
  getAllowedMailboxes(userRole?: UserRole): string[] {
    // Si la validación por roles está deshabilitada, devolver todos los permitidos
    if (!MAILBOX_CONFIG.SECURITY.ENABLE_ROLE_VALIDATION) {
      return [...MAILBOX_CONFIG.ALLOWED_MAILBOXES];
    }

    // Validación por roles (para uso futuro)
    if (userRole && MAILBOX_CONFIG.ROLE_BASED_ACCESS[userRole]) {
      return [...MAILBOX_CONFIG.ROLE_BASED_ACCESS[userRole]];
    }
    return [...MAILBOX_CONFIG.ALLOWED_MAILBOXES];
  }

  /**
   * Valida el acceso sin lanzar excepción
   * @param mailbox - Nombre del mailbox
   * @param options - Opciones de validación
   * @returns Resultado de la validación
   */
  checkMailboxAccess(
    mailbox: string,
    options: MailboxValidationOptions,
  ): MailboxAccessResult {
    try {
      this.validateMailboxAccess(mailbox, options);
      return {
        isAllowed: true,
        mailbox: this.sanitizeMailboxName(mailbox),
      };
    } catch (error) {
      return {
        isAllowed: false,
        mailbox,
        reason:
          error instanceof ForbiddenException
            ? error.message
            : 'Error desconocido',
      };
    }
  }

  /**
   * Sanitiza el nombre del mailbox
   * @param mailbox - Nombre original del mailbox
   * @returns Nombre sanitizado
   */
  sanitizeMailboxName(mailbox: string): string {
    if (!mailbox || typeof mailbox !== 'string') {
      return 'INBOX.Netflix'; // Default al primer mailbox permitido
    }

    return mailbox
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '') // Permitir puntos para INBOX.Netflix
      .substring(0, MAILBOX_CONFIG.SECURITY.MAX_MAILBOX_NAME_LENGTH);
  }

  /**
   * Valida si el mailbox está en la lista general de permitidos
   */
  private isMailboxGenerallyAllowed(mailbox: string): boolean {
    return MAILBOX_CONFIG.ALLOWED_MAILBOXES.includes(mailbox as AllowedMailbox);
  }

  /**
   * Valida si el mailbox está permitido para un rol específico
   */
  private isMailboxAllowedForRole(mailbox: string, role: UserRole): boolean {
    const allowedForRole = MAILBOX_CONFIG.ROLE_BASED_ACCESS[role];
    return (allowedForRole as readonly string[]).includes(mailbox);
  }

  /**
   * Registra eventos de seguridad para auditoría
   */
  private logSecurityEvent(
    event: string,
    details: Record<string, unknown>,
  ): void {
    this.logger.warn(`🚨 EVENTO DE SEGURIDAD: ${event}`, {
      timestamp: new Date().toISOString(),
      event,
      ...details,
    });
  }
}
