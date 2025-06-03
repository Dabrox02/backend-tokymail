import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchEmailsBySubjectDto {
  @ApiProperty({ description: 'Correo electrónico del remitente.' })
  @IsEmail({}, { message: 'El campo fromEmail debe ser un email válido.' })
  @IsNotEmpty({ message: 'El campo fromEmail no puede estar vacío.' })
  fromEmail: string;

  @ApiProperty({
    description: 'Asunto del email a buscar (puede ser parcial).',
  })
  @IsString({ message: 'subject debe ser un texto.' })
  @IsNotEmpty({ message: 'El campo subject no puede estar vacío.' })
  subject: string;

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
    description: 'Mailbox donde buscar (ej: "INBOX").',
    default: 'INBOX',
  })
  @IsOptional()
  @IsString({ message: 'mailbox debe ser un texto.' })
  mailbox?: string = 'INBOX';
}
