/**
 * Barrel export for services
 */

// Auth service
export {
    authService,
    getErrorMessage,
    getValidationErrors
} from "./authService";
export type {
    ApiResponse,
    LoginResponse,
    RegisterResponse,
    ValidationError
} from "./authService";

// Product service
export {
    formatPrice,
    getProductImageUrl,
    isLowStock,
    isOutOfStock, productService
} from "./productService";
export type {
    Category, Product,
    ProductImage, ProductPagination, ProductVariant
} from "./productService";

// Address service
export { addressService } from "./addressService";
export type { CreateAddressInput, CustomerAddress } from "./addressService";

// Order service
export { orderService } from "./orderService";
export type {
    BuyNowPayload, MyOrdersResponse, Order,
    OrderItem,
    OrderStatus,
    PaymentStatus
} from "./orderService";

// Voucher service
export { voucherService } from "./voucherService";
export type { Voucher } from "./voucherService";

// Notification service
export { notificationService } from "./notificationService";
export type {
    Notification,
    NotificationsResponse
} from "./notificationService";

// Review service
export { reviewService } from "./reviewService";
export type {
    ProductReview,
    ReviewStats,
    ReviewUser,
    ReviewReply
} from "./reviewService";

