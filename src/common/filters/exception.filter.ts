import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';
import { ApiErrorResponse } from '../responses/api-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.formatErrorResponse(exception, status);

    this.logger.error(
      `[Exception] ${request.method} ${request.url} - status: ${status} - code: ${errorResponse.error.code} - message: ${errorResponse.error.message}`,
      exception instanceof Error ? exception.stack : undefined,
      AllExceptionsFilter.name,
    );

    response.status(status).json(errorResponse);
  }

  private formatErrorResponse(
    exception: unknown,
    status: number,
  ): ApiErrorResponse {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const message = this.extractMessage(exceptionResponse);
      const details = this.extractDetails(exceptionResponse);

      let errorCode: string;
      if (exception instanceof BadRequestException) {
        errorCode = 'VALIDATION_ERROR';
      } else if (exception instanceof UnauthorizedException) {
        errorCode = 'UNAUTHORIZED';
      } else if (exception instanceof ForbiddenException) {
        errorCode = 'FORBIDDEN';
      } else if (exception instanceof NotFoundException) {
        errorCode = 'NOT_FOUND';
      } else if (exception instanceof ConflictException) {
        errorCode = 'CONFLICT';
      } else {
        errorCode = this.getErrorCodeFromStatus(status);
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message,
          ...(details.length > 0 && { details }),
        },
        timestamp,
      };
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'Internal server error'
      : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    return {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
      timestamp,
    };
  }

  private extractMessage(exceptionResponse: unknown): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message: unknown }).message;
      if (Array.isArray(message)) {
        return message.length > 0 && typeof message[0] === 'string'
          ? message[0]
          : 'Validation failed';
      }
      if (typeof message === 'string') {
        return message;
      }
    }

    return 'An error occurred';
  }

  private extractDetails(exceptionResponse: unknown): unknown[] {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message: unknown }).message;
      if (Array.isArray(message)) {
        return message;
      }
    }

    return [];
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusCodeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }
}
