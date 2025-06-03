import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    // Obtenemos el objeto `Request` de Express desde el contexto de ejecución de NestJS.
    // Gracias a la extensión que hicimos en `src/types/express.d.ts`, TypeScript
    // ya sabe que `request.user` puede ser de tipo `AuthenticatedUser | undefined`.
    const request = ctx.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();

    // El objeto de usuario ya fue adjuntado a `request.user` por el JwtStrategy
    // después de una autenticación exitosa a través del JwtAuthGuard.
    const user = request.user;

    // Si `data` (la clave opcional pasada al decorador) se especifica,
    // retornamos solo esa propiedad del objeto de usuario.
    // De lo contrario, retornamos el objeto de usuario completo.
    // Usamos el operador `?` para manejar el caso en que `user` sea `undefined`
    // (aunque esto no debería ocurrir si el guard se aplica correctamente).
    return data ? user?.[data] : user;
  },
);
