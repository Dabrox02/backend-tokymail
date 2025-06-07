import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class NetflixOtpQueryDto {
  @ApiProperty({
    description: 'Email del destinatario para filtrar los correos',
    example: 'usuario@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  to: string;

  @ApiProperty({
    description: 'Número máximo de correos a revisar',
    example: 5,
    minimum: 1,
    maximum: 20,
    required: false,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Debe ser un número positivo' })
  @Min(1, { message: 'Mínimo 1 correo' })
  @Max(20, { message: 'Máximo 20 correos' })
  limit?: number;

  @ApiProperty({
    description: 'Antigüedad máxima en minutos para buscar correos',
    example: 10,
    minimum: 1,
    maximum: 60,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Debe ser un número positivo' })
  @Min(1, { message: 'Mínimo 1 minuto' })
  @Max(60, { message: 'Máximo 60 minutos' })
  maxAge?: number;
}
