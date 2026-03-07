/**
 * Barrel export for services
 */

export {
    authService,
    getErrorMessage,
    getValidationErrors
} from "./authService";
export type {
    ApiResponse, LoginResponse,
    RegisterResponse, ValidationError
} from "./authService";

