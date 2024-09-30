import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { ConfigService } from './config/config.service';

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  const appName = configService.get('APP_NAME');
  const appVersion = configService.get('APP_VERSION');

  const config = new DocumentBuilder()
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .setTitle(`${appName} Backend`)
    .setDescription(`API documentation for ${appName} Backend Services`)
    .setVersion(appVersion)
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true, // Ensure it picks up versioned routes
  });

  const swaggerUser = configService.get('SWAGGER_USERNAME');
  const swaggerPassword = configService.get('SWAGGER_PASSWORD');

  if (process.env.NODE_ENV === 'production') {
    if (!swaggerUser || !swaggerPassword) {
      throw new Error(
        'SWAGGER_USERNAME and SWAGGER_PASSWORD must be set in production.',
      );
    }

    app.use(
      ['/docs', '/docs-json'],
      basicAuth({
        challenge: true,
        users: { [swaggerUser]: swaggerPassword },
      }),
    );
  }

  // Setup Swagger UI and JSON documentation
  SwaggerModule.setup('/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keeps the token persistent
    },
    customSiteTitle: `${appName} API Docs`, // Custom Swagger title
  });
}
