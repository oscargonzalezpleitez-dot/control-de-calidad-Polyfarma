import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // Seguridad - Helmet (headers HTTP seguros)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  // Compresión
  app.use(compression());

  // CORS — soporta múltiples orígenes separados por coma
  const allowedOrigins = frontendUrl
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((allowed) =>
        allowed === origin ||
        (allowed.includes('*') && origin.endsWith(allowed.replace('*', '')))
      )) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido → ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // Versionado de API
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Filtros e interceptores globales
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
  );

  // Swagger (Documentación API - solo en desarrollo)
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PharmaQMS API')
      .setDescription('Sistema de Gestión de Calidad Farmacéutica - 21 CFR Part 11 Compliant')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticación y Sesiones')
      .addTag('users', 'Gestión de Usuarios')
      .addTag('formats', 'Gestión de Formatos')
      .addTag('records', 'Captura de Datos')
      .addTag('signatures', 'Firmas Electrónicas')
      .addTag('audit', 'Audit Trail')
      .addTag('reports', 'Generación de Reportes')
      .addTag('attachments', 'Adjuntos')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Health check rápido para Railway / load balancers
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await app.listen(port, '0.0.0.0');
  console.log(`Lab. Control de Calidad Polyfarma API → http://0.0.0.0:${port}`);
  if (configService.get('NODE_ENV') !== 'production') {
    console.log(`Docs → http://localhost:${port}/api/docs`);
  }
}

bootstrap();
