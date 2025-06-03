import { AES, enc } from 'crypto-js';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLIENT_RENEG_LIMIT } from 'tls';

@Injectable()
export class EncryptionService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('EMAIL_UID_SECRET_KEY');

    if (!secret) {
      throw new InternalServerErrorException('EMAIL_UID_SECRET_KEY_MISSING');
    }

    this.secret = secret;
  }

  // Codifica en Base64 URL-safe
  private base64UrlEncode(input: string): string {
    return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Decodifica de Base64 URL-safe
  private base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    return base64 + padding;
  }

  encrypt(uid: string): string {
    const encrypted = AES.encrypt(uid, this.secret).toString();
    return this.base64UrlEncode(encrypted);
  }

  decrypt(encryptedUrlSafe: string): string {
    const encrypted = this.base64UrlDecode(encryptedUrlSafe);
    const bytes = AES.decrypt(encrypted, this.secret);
    const decrypted = bytes.toString(enc.Utf8);

    if (!decrypted) {
      throw new Error('Decryption failed. Invalid or tampered input.');
    }

    return decrypted;
  }
}
