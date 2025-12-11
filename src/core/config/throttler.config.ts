import { ThrottlerModule } from '@nestjs/throttler';

export const ThrottlerConfig = ThrottlerModule.forRoot([
  {
    ttl: 60000,
    limit: 10,
  },
]);
