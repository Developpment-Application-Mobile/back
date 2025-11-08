import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Edu-Kid API')
    .setDescription('API documentation for Edu-Kid application - Parent, Child, Quiz, and Question management')
    .setVersion('1.0')
    .addTag('parents', 'Parent management endpoints')
    .addTag('children', 'Child management endpoints')
    .addTag('quizzes', 'Quiz management endpoints')
    .addTag('questions', 'Question management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
