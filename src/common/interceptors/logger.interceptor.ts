import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';
import { Observable, tap } from 'rxjs';

const REDACT_FIELDS = ['authorization', 'password', 'token', 'signature'];

const redactSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, val]) => [
        key,
        REDACT_FIELDS.includes(key.toLowerCase())
          ? '[REDACTED]'
          : redactSensitive(val),
      ],
    );
    return Object.fromEntries(entries);
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
