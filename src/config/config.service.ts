import { Inject, Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { EnvConfig } from './config.interface';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {
    const filePath = `.env.${process.env.NODE_ENV || 'development'}`;
    const envFile = path.resolve(
      __dirname,
      `${process.env.NODE_ENV === 'production' ? '../../' : '../'}`,
      options.folder,
      filePath,
    );
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
