import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { bgGreen, bgYellow } from 'cli-color';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ParamValidationPipe } from './common/pipes/param-validation.pipe';
import { ConfigService } from './config/config.service';
import { setupSwagger } from './swagger';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT') || 8000;

  app.enableCors();

  // Middleware to redirect base URL to api/v1/docs
  app.use((req: Request, res: Response, next: any) => {
    if (req.path === '/') {
      return res.redirect('/docs');
    }
    next();
  });

  app.use(cookieParser());
  app.use(compression());

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
    new ParamValidationPipe(),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');
  setupSwagger(app, configService);

  await app.listen(PORT, () => {
    console.log(`${bgYellow('RUNNING ON PORT: ')}${bgGreen(PORT)}`);
  });

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
