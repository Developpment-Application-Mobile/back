import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Edu-Kid API')
    .setDescription(
      'API documentation for Edu-Kid application - Parent, Child, Quiz, and Question management',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('parents', 'Parent management endpoints')

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
