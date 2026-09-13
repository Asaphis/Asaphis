import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cookieParser());

  const userWeb = (config.get<string>('USER_WEB_URL') ?? 'http://localhost:3000').split(',');
  const adminWeb = (config.get<string>('ADMIN_WEB_URL') ?? 'http://localhost:3001').split(',');
  app.enableCors({
    origin: [...userWeb, ...adminWeb],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Key'],
  });

  const prefix = config.get<string>('API_PREFIX') ?? 'api/v1';
  app.setGlobalPrefix(prefix, { exclude: ['/', '/health', '/ready'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if ((config.get<string>('SWAGGER_ENABLED') ?? 'true') === 'true') {
    const doc = new DocumentBuilder()
      .setTitle('AsaPhis ORG API')
      .setDescription(
        'Modular backend for Africa-focused education/community platform: auth, verification, travel, moderation, payments, audit.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('asaphis_at')
      .build();
    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('docs', app, document);
    SwaggerModule.setup('docs-json', app, document);
  }

  const port = Number(config.get('PORT') ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`AsaPhis API listening on :${port} (prefix=${prefix})`);
}
void bootstrap();
