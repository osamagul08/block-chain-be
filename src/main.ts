import './core/polyfills/crypto.polyfill';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { LoggerService } from './core/logger/logger.service';
import { SwaggerDoc } from './common/constants/swagger.constants';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new LoggerInterceptor(logger));
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle(SwaggerDoc.Title)
    .setDescription(SwaggerDoc.Description)
    .setVersion('1.0.0')
    .addBearerAuth({
      type: SwaggerDoc.Bearer.type,
      scheme: 'bearer',
      bearerFormat: SwaggerDoc.Bearer.bearerFormat,
      description: SwaggerDoc.Bearer.description,
    })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SwaggerDoc.DocsPath, app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
