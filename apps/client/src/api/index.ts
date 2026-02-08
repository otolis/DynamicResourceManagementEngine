// API barrel export

export { apiClient, type ApiError } from './client';
export { authApi, type User, type LoginResponse, type LoginCredentials, type RegisterCredentials, type RegisterResponse, type VerifyEmailResponse, type ForgotPasswordResponse, type ResetPasswordResponse } from './auth';
export { entityTypesApi, type EntityType, type EntityTypeListResponse } from './entityTypes';
