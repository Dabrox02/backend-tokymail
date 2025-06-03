import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchSentEmailsDto {
  @ApiProperty({ description: 'Correo electrónico del destinatario.' })
  @IsEmail({}, { message: 'El campo toEmail debe ser un email válido.' })
  @IsNotEmpty({ message: 'El campo toEmail no puede estar vacío.' })
  toEmail: string;

  @ApiProperty({ description: 'Correo electrónico del remitente.' })
  @IsEmail({}, { message: 'El campo fromEmail debe ser un email válido.' })
  @IsNotEmpty({ message: 'El campo fromEmail no puede estar vacío.' })
  fromEmail: string;

  @ApiPropertyOptional({
    description:
      'Buscar emails desde esta fecha (formato ISO 8601: YYYY-MM-DD).',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'fromDate debe ser una fecha válida en formato YYYY-MM-DD.' },
  )
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Límite de emails a retornar.',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser al menos 1.' })
  @Max(100, { message: 'limit no puede ser mayor a 100.' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Mailbox donde buscar (ej: "Sent", "Sent Items", "[Gmail]/Sent Mail").',
    default: 'Sent',
  })
  @IsOptional()
  @IsString({ message: 'mailbox debe ser un texto.' })
  mailbox?: string = 'Sent';
}
