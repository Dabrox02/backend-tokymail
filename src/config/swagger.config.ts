import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

interface SwaggerOptions {
  title: string;
  description: string;
  version: string;
  path: string;
  tags?: { name: string; description: string }[];
}

const DEFAULT_SWAGGER_OPTIONS: SwaggerOptions = {
  title: 'API Tokymail',
  description: 'Documentación de la API generada con Swagger',
  version: '1.0.0',
  path: 'api-docs',
};

export function setupSwagger(
  app: INestApplication,
  options: Partial<SwaggerOptions> = {},
): void {
  const configOptions = { ...DEFAULT_SWAGGER_OPTIONS, ...options };

  // Configuración  de Swagger
  const builder = new DocumentBuilder()
    .setTitle(configOptions.title)
    .setDescription(configOptions.description)
    .setVersion(configOptions.version)
    .addBearerAuth({ type: 'http', scheme: 'bearer' });

  // Añadir tags si se proporcionan
  if (configOptions.tags && configOptions.tags.length > 0) {
    configOptions.tags.forEach((tag) =>
      builder.addTag(tag.name, tag.description),
    );
  }

  const documentConfig = builder.build();
  const document = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup(configOptions.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
    },
    customSiteTitle: `${configOptions.title} - Swagger UI`,
  });

  console.log(`Swagger UI disponible en: /${configOptions.path}`);
}
