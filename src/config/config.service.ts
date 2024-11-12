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

    if (!fs.existsSync(envFile)) {
      throw new Error(`Config file ${envFile} does not exist`);
    }

    try {
      const config = dotenv.parse(fs.readFileSync(envFile));
      this.envConfig = { ...config, ...process.env };
    } catch (error) {
      throw new Error(`Error reading config file ${envFile}: ${error.message}`);
    }
  }

  get(key: string): string {
    const value = this.envConfig[key];
    if (!value) {
      console.log(`Config key "${key}" not found`);
      return '';
    }
    return value;
  }
}
