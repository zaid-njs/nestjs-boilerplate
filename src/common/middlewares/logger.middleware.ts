import { Injectable, NestMiddleware } from '@nestjs/common';
import { bgCyan, green, yellow } from 'cli-color';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      const contentLength = res.get('content-length');
      const logMessage = `${green(method)} ${yellow(
        originalUrl,
      )} ${statusCode} - ${bgCyan(
        userAgent.split(' ')[0],
      )} ${ip} - ${yellow(contentLength)} ${responseTime}ms`;

      if (process.env.NODE_ENV !== 'production') console.log(logMessage);
    });

    next();
  }
}
