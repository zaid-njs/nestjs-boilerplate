import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnyExceptionFilter } from './common/filters/exception.filter';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { ConfigModule } from './config/config.module';
import { ChatModule } from './modules/chat/chat.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.register({ folder: './env' }),
    UsersModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AnyExceptionFilter },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
