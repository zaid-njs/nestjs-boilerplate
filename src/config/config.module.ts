import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { green, yellow } from 'cli-color';
import { ConfigService } from './config.service';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule.register({ folder: './env' })],
      useFactory: async (configService: ConfigService) => {
        const uri: string = String(configService.get('MONGODB_URI')).replace(
          '<PASSWORD>',
          configService.get('MONGODB_PASSWORD'),
        );
        return {
          uri,
          onConnectionCreate: () => {
            console.log(green('DATABASE CONNECTED SUCCESSFULLY'));
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class ConfigModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
        EmailService,
      ],
      exports: [ConfigService, EmailService],
    };
  }
}
