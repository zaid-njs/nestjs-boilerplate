import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Main')
@Controller({ path: '/', version: '1' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('latest-commit')
  getLatestCommit(): string {
    return this.appService.getLatestCommit();
  }
}
