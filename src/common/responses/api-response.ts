// src/common/responses/api-response.ts
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  data?: T;
  error?: string | object;
}

export const createSuccessResponse = <T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
): ApiResponse<T> => ({
  statusCode,
  success: true,
  message,
  data,
});

export const createErrorResponse = (
  message: string,
  error: string | object,
  statusCode: number = 500,
): ApiResponse<null> => ({
  statusCode,
  success: false,
  message,
  error,
});
