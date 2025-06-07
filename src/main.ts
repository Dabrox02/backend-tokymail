import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { BigIntInterceptor } from './shared/interceptors/bigint.interceptor';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new BigIntInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOrigins =
    process.env.NODE_ENV === 'production'
      ? ['https://tokymail.vercel.app/', 'https://jtvprem.xyz']
      : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: corsOrigins,
  });

  setupSwagger(app, {
    title: 'API de Servicio tokens de correo electrónico',
    description: 'API para gestionar tokens de correo electrónico.',
    version: '1.1.0',
    path: 'api/docs',
    tags: [
      {
        name: 'Emails',
        description:
          'Operaciones relacionadas con el servicio de correos electrónicos',
      },
    ],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicación corriendo en: http://localhost:${port}`);
}

bootstrap().catch((err) => console.error('Error during bootstrap:', err));
