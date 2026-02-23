export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface AuthResponse {
  token: string;
  user: import('./user').User;
  is_new_user: boolean;
}
