import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ErrorLogService } from './error-log.service';
import { S3Service } from './s3.service';
import { SharedController } from './shared.controller';
import { SharedService } from './shared.service';

@Global()
@Module({
  controllers: [SharedController],
  providers: [SharedService, EmailService, ErrorLogService, S3Service],
  exports: [SharedService, EmailService, ErrorLogService, S3Service],
})
export class SharedModule {}
