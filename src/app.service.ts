import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Visit /docs to view swagger documentation!';
  }

  getLatestCommit(): string {
    try {
      // Get the latest commit hash and message
      const commit = execSync('git log -1 --pretty=format:"%h - %s"')
        .toString()
        .trim();
      return commit;
    } catch (error) {
      return 'Unable to retrieve commit information';
    }
  }
}
