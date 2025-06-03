import { FetchMessageObject } from 'imapflow';

export interface EmailMessage
  extends Omit<FetchMessageObject, 'uid' | 'source'> {
  uid?: string;
  date?: string;
  html?: string;
  text?: string;
}
