import { ApiProperty } from '@nestjs/swagger';

export class NetflixOtpResponseDto {
  @ApiProperty({
    description: 'Código OTP de 4 dígitos encontrado',
    example: '1234',
  })
  otpCode: string;

  @ApiProperty({
    description: 'UID del mensaje donde se encontró el OTP',
    example: '12345',
  })
  messageUid: string;

  @ApiProperty({
    description: 'Fecha del correo en formato ISO',
    example: '2025-06-06T10:30:00.000Z',
  })
  messageDate: string;

  @ApiProperty({
    description: 'Asunto del correo',
    example: 'Netflix - Código de verificación',
  })
  subject: string;

  @ApiProperty({
    description: 'Timestamp de cuando se extrajo el OTP',
    example: '2025-06-06T10:35:00.000Z',
  })
  extractedAt: string;
}
