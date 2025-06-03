// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // El guard JWT de Passport se encarga automáticamente de:
  // 1. Extraer el JWT del encabezado de autorización.
  // 2. Verificar la firma del JWT usando el secreto configurado en JwtStrategy.
  // 3. Validar la expiración del token.
  // 4. Si es válido, llama al método `validate` de JwtStrategy.
  // 5. Si `validate` retorna un usuario, permite la solicitud y adjunta el usuario a `req.user`.
  // 6. Si falla, lanza una `UnauthorizedException`.
  // Puedes añadir lógica personalizada aquí si necesitas.
  // Por ejemplo, para manejar errores específicos de autenticación.
  // handleRequest(err, user, info) {
  //   if (err || !user) {
  //     throw err || new UnauthorizedException('Acceso no autorizado. Token inválido o expirado.');
  //   }
  //   return user;
  // }
}
