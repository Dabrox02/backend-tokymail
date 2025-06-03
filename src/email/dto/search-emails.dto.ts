import {
  IsOptional,
  IsString,
  IsNumberString,
  IsBooleanString,
} from 'class-validator';

export class SearchEmailsDto {
  @IsOptional()
  @IsString()
  from?: string; // Búsqueda por remitente

  @IsOptional()
  @IsString()
  to?: string; // Búsqueda por destinatario

  @IsOptional()
  @IsString()
  subject?: string; // Búsqueda por asunto

  @IsOptional()
  @IsString()
  body?: string; // Búsqueda en el cuerpo del mensaje

  @IsOptional()
  @IsString()
  since?: string; // Fecha de inicio (e.g., '2023-01-01')

  @IsOptional()
  @IsString()
  before?: string; // Fecha de fin (e.g., '2023-12-31')

  @IsOptional()
  @IsString()
  mailbox?: string; // Mailbox a buscar, por defecto 'INBOX'

  @IsOptional()
  @IsNumberString() // Usamos string porque viene de la URL, luego lo parseamos
  limit?: string; // Límite de resultados, por defecto 10

  @IsOptional()
  @IsBooleanString() // Para booleans de query params
  fetchEnvelope?: string; // Para incluir el sobre (from, to, subject, date)

  @IsOptional()
  @IsBooleanString()
  fetchBodyStructure?: string; // Para incluir la estructura del cuerpo

  @IsOptional()
  @IsBooleanString()
  fetchSize?: string; // Para incluir el tamaño del mensaje
}
