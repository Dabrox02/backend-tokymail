import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NetflixOtpService } from './netflix-otp.service';
import { NetflixOtpQueryDto } from './dto/netflix-otp-query.dto';
import { NetflixOtpResponseDto } from './dto/netflix-otp-response.dto';
import { NetflixErrorResponseDto } from './dto/netflix-error-response.dto';

@ApiTags('Netflix OTP')
@Controller('netflix')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NetflixOtpController {
  private readonly logger = new Logger(NetflixOtpController.name);

  constructor(private readonly netflixOtpService: NetflixOtpService) {}

  @Get('otp')
  @ApiOperation({
    summary: 'Obtener código OTP de Netflix',
    description:
      'Extrae el código OTP de 4 dígitos del último correo de Netflix enviado a la dirección especificada.',
  })
  @ApiQuery({
    name: 'to',
    description: 'Email del destinatario',
    example: 'usuario@example.com',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de correos a revisar (1-20)',
    example: 5,
    required: false,
  })
  @ApiQuery({
    name: 'maxAge',
    description: 'Antigüedad máxima en minutos (1-60)',
    example: 10,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Código OTP encontrado exitosamente',
    type: NetflixOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
    type: NetflixErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido o faltante',
    type: NetflixErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron correos de Netflix o código OTP',
    type: NetflixErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
    type: NetflixErrorResponseDto,
  })
  async getNetflixOtp(
    @Query() query: NetflixOtpQueryDto,
  ): Promise<NetflixOtpResponseDto> {
    const { to, limit, maxAge } = query;

    const otpResult = await this.netflixOtpService.getLatestNetflixOtp({
      to,
      limit,
      maxAgeMinutes: maxAge,
    });

    return {
      ...otpResult,
      extractedAt: new Date().toISOString(),
    };
  }
}
