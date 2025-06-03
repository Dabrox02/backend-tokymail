import { MAILBOX_CONFIG } from './mailbox.constants';

export type AllowedMailbox = (typeof MAILBOX_CONFIG.ALLOWED_MAILBOXES)[number];
export type UserRole = keyof typeof MAILBOX_CONFIG.ROLE_BASED_ACCESS;

export interface MailboxValidationOptions {
  userEmail: string;
  userRole?: UserRole;
  requestId?: string;
}

export interface MailboxAccessResult {
  isAllowed: boolean;
  mailbox: string;
  reason?: string;
}
