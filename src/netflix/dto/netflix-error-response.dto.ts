import { ApiProperty } from '@nestjs/swagger';

export class NetflixErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'No se encontraron correos de Netflix recientes',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Not Found',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp del error',
    example: '2025-06-06T10:35:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Ruta de la API que generó el error',
    example: '/netflix/otp',
  })
  path: string;
}
