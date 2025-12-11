import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponse, createSuccessResponse } from '../responses/api-response';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped or has a specific structure, extract the actual data
        // Otherwise, use the data as-is
        const responseData = data?.data !== undefined ? data.data : data;
        return createSuccessResponse(responseData);
      }),
    );
  }
}
