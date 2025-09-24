/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable, ConsoleLogger, OnModuleInit } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import stringify from 'safe-stable-stringify';

@Injectable()
export class LoggerService extends ConsoleLogger implements OnModuleInit {
  private readonly logDir = path.join(__dirname, '..', '..', 'log');

  private readonly logger = createLogger({
    level: 'debug',
    format: format.combine(
      format.timestamp(),
      format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label', 'stack'],
      }),
      ...[
        format.colorize({
          all: true,
          colors: {
            debug: 'green',
            info: 'blue',
            warning: 'yellow',
            error: 'red',
          },
        }),
        format.printf(
          ({ timestamp, level, message, metadata = {}, stack = '' }) => {
            const extraData = Object.keys(metadata as object).length
              ? `\n${stringify(metadata, null, 2)}`
              : '';
            const stackData = stack ? `\n${stack}` : '';
            return `${timestamp} [${level}]: ${message}${extraData}${stackData}`;
          },
        ),
      ],
    ),
    transports: [
      new transports.Console({
        level: 'debug',
      }),
      new transports.File({
        filename: path.join(this.logDir, 'development.log'),
        level: 'debug',
      }),
      new transports.File({
        filename: path.join(this.logDir, 'dev_errors.log'),
        level: 'error',
      }),
    ],
  });

  constructor() {
    super();
  }

  onModuleInit() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  error(message: any, trace?: string, context?: string) {
    const errorMessage =
      typeof message === 'object' ? stringify(message) : message;
    this.logger.error(errorMessage, { trace, context });
    super.error(errorMessage, trace, context);
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
    super.warn(message, context);
  }

  log(message: any) {
    this.logger.info(message);
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
    super.debug(message, context);
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
    super.verbose(message, context);
  }
}
