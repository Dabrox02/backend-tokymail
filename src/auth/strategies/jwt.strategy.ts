import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from '../auth.types';

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  role?: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    // Constructor: Configura la estrategia JWT
    super({
      // Extrae el JWT del encabezado de autorización como un token de portador
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Ignora la expiración del token (NO recomendado para producción, solo si manejas la expiración de otra forma)
      // En producción, siempre debes validar la expiración del token.
      ignoreExpiration: false,
      // Secreto utilizado para verificar la firma del JWT.
      // Supabase utiliza un secreto interno para firmar sus JWTs.
      // Debes obtener la clave pública de Supabase para verificarlo.
      // La clave pública de Supabase se encuentra en el Dashboard de tu proyecto, en la sección de autenticación.
      // Busca la clave pública del JWT (`JWT Secret` o `JWT Signing Secret`).
      // ¡IMPORTANTE! Esto no es el mismo que la `Anon Key`. Es un secreto interno de Supabase para la firma.
      // Obtén el secreto y lanza un error si no está definido
      secretOrKey: (() => {
        const secret = configService.get<string>('SUPABASE_JWT_SECRET');
        if (!secret) {
          throw new Error(
            'SUPABASE_JWT_SECRET is not defined in environment variables',
          );
        }
        return secret;
      })(),
      // Puedes pasar el objeto de solicitud a la función validate si lo necesitas
      passReqToCallback: false,
    });
  }

  /**
   * Método de validación de la estrategia JWT.
   * Se ejecuta después de que el JWT ha sido extraído y verificado.
   *
   * @param payload El payload decodificado del JWT.
   * @returns Un objeto de usuario que se adjuntará a `req.user`.
   * @throws UnauthorizedException si la validación falla (ej. usuario no encontrado o inactivo).
   */
  validate(payload: SupabaseJwtPayload) {
    // Aquí puedes realizar validaciones adicionales si es necesario.
    // Por ejemplo, verificar si el usuario aún existe en tu base de datos
    // o si tiene los roles necesarios.

    // Si Supabase se encarga de la autenticación de usuarios y la seguridad de la base de datos
    // a través de RLS, simplemente verificar la validez del token y el `sub` (ID de usuario)
    // es suficiente para la mayoría de los casos.

    // Siempre asegúrate de que el 'sub' (ID de usuario de Supabase) esté presente.
    if (!payload.sub) {
      throw new UnauthorizedException(
        'Payload del JWT inválido: falta el ID de usuario.',
      );
    }

    const user: AuthenticatedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    // Este objeto 'user' se adjuntará a 'req.user' en tu controlador
    return user;
  }
}
