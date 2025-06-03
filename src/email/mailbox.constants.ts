export const MAILBOX_CONFIG = {
  ALLOWED_MAILBOXES: [
    'INBOX.Netflix',
    'INBOX.Disney',
    'INBOX.Primevideo',
    'INBOX.Max',
  ] as const,

  ROLE_BASED_ACCESS: {
    admin: ['INBOX.Netflix', 'INBOX.Disney', 'INBOX.Primevideo', 'INBOX.Max'],
    user: ['INBOX.Netflix', 'INBOX.Disney', 'INBOX.Primevideo', 'INBOX.Max'],
    readonly: ['INBOX.Netflix', 'INBOX.Disney'],
  } as const,

  SECURITY: {
    MAX_MAILBOX_NAME_LENGTH: 50,
    ALLOWED_MAILBOX_CHARS: /^[a-zA-Z0-9._-]+$/,
    ENABLE_ROLE_VALIDATION: false,
  },
} as const;
