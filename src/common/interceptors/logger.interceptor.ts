import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';
import { Observable, tap } from 'rxjs';

const SIGNATURE_VISIBLE_LENGTH = 10;
const WALLET_SUFFIX_LENGTH = 6;

const redactSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value && typeof value === 'object') {
    const redactedEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        const lowerKey = key.toLowerCase();

        if (lowerKey === 'authorization') {
          return null;
        }

        if (lowerKey === 'signature' && typeof val === 'string') {
          const visible = val.slice(0, SIGNATURE_VISIBLE_LENGTH);
          const masked =
            val.length > SIGNATURE_VISIBLE_LENGTH ? `${visible}...` : visible;
          return [key, masked];
        }

        if (lowerKey === 'walletaddress' && typeof val === 'string') {
          const suffix = val.slice(-WALLET_SUFFIX_LENGTH);
          const maskedPrefix = val.startsWith('0x') ? '0x...' : '...';
          const masked = suffix ? `${maskedPrefix}${suffix}` : maskedPrefix;
          return [key, masked];
        }

        return [key, redactSensitive(val)];
      })
      .filter((entry): entry is [string, unknown] => entry !== null);

    return Object.fromEntries(redactedEntries);
  }

  return value;
};

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const now = Date.now();
    const safeBody = redactSensitive(body);
    const safeParams = redactSensitive(params);
    const safeQuery = redactSensitive(query);

    this.logger.log(
      `Incoming Request: ${method} ${url} - Body: ${JSON.stringify(
        safeBody,
      )} - Params: ${JSON.stringify(safeParams)} - Query: ${JSON.stringify(
        safeQuery,
      )}`,
    );

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `Outgoing Response: ${method} ${url} - Response Time: ${responseTime}ms`,
        );
      }),
    );
  }
}
