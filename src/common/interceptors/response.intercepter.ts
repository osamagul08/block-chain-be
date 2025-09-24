import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse,
} from '../responses/api-response';

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
        const response = context.switchToHttp().getResponse();
        response.statusCode =
          data?.statusCode || response.statusCode || HttpStatus.OK;
        return createSuccessResponse(
          data?.data,
          response.locals.message || data?.message || 'Success',
          data?.statusCode || response.statusCode || HttpStatus.OK,
        );
      }),
      catchError((err) => {
        const statusCode =
          err instanceof HttpException
            ? err.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const errorMessage =
          err instanceof Error ? err.message : 'Internal Server Error';
        const errorResponse =
          err instanceof HttpException ? err.getResponse() : null;
        // Create the error response
        const formattedErrorResponse = createErrorResponse(
          errorMessage,
          errorResponse || errorMessage,
          statusCode,
        );
        return throwError(() => formattedErrorResponse);
      }),
    );
  }
}
