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
    ApiResponse, LoginResponse,
    RegisterResponse, ValidationError
} from "./authService";

// Product service
export {
    productService,
    formatPrice,
    getProductImageUrl,
    isLowStock,
    isOutOfStock,
} from "./productService";
export type {
    Product,
    ProductImage,
    ProductVariant,
    Category,
    ProductPagination,
} from "./productService";

// Address service
export {
    addressService,
} from "./addressService";
export type {
    CustomerAddress,
    CreateAddressInput,
} from "./addressService";

// Order service
export {
    orderService,
} from "./orderService";
export type {
    BuyNowPayload,
    Order,
    OrderItem,
    OrderStatus,
    PaymentStatus,
    MyOrdersResponse,
} from "./orderService";

// Voucher service
export {
    voucherService,
} from "./voucherService";
export type {
    Voucher,
} from "./voucherService";
