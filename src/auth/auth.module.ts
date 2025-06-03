import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt'; // Solo necesario si vas a GENERAR tus propios JWTs en NestJS.
import { ConfigModule, ConfigService } from '@nestjs/config'; // Para acceder a variables de entorno
import { JwtStrategy } from './strategies/jwt.strategy'; // Importa nuestra estrategia

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Registra Passport y define la estrategia por defecto
    ConfigModule, // Asegúrate de que ConfigModule esté disponible para acceder a SUPABASE_JWT_SECRET
    // JwtModule.registerAsync es opcional si solo usas el secreto en JwtStrategy directamente.
    // Sin embargo, si tuvieras tu propia generación de tokens en NestJS, lo necesitarías.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('SUPABASE_JWT_SECRET'),
      }),
    }),
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}
