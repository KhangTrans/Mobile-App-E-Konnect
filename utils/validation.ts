/**
 * Validation Rules - Must match Backend validation
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const ValidationRules = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    messages: {
      required: "Vui lòng nhập username",
      minLength: "Username phải có ít nhất 3 ký tự",
      maxLength: "Username không được quá 30 ký tự",
      pattern: "Username chỉ được chứa chữ cái, số và dấu gạch dưới (_)",
    },
  },
  email: {
    pattern: /^\S+@\S+\.\S+$/,
    messages: {
      required: "Vui lòng nhập email",
      invalid: "Email không hợp lệ",
    },
  },
  password: {
    minLength: 6,
    messages: {
      required: "Vui lòng nhập mật khẩu",
      minLength: "Mật khẩu phải có ít nhất 6 ký tự",
    },
  },
  fullName: {
    maxLength: 100,
    messages: {
      maxLength: "Họ tên không được quá 100 ký tự",
    },
  },
  otp: {
    length: 6,
    pattern: /^\d{6}$/,
    messages: {
      required: "Vui lòng nhập mã OTP",
      invalid: "Mã OTP phải có đúng 6 chữ số",
    },
  },
};

/**
 * Validation Functions
 */

export const validateUsername = (username: string): ValidationResult => {
  if (!username || username.trim() === "") {
    return {
      isValid: false,
      message: ValidationRules.username.messages.required,
    };
  }

  const trimmed = username.trim();

  if (trimmed.length < ValidationRules.username.minLength) {
    return {
      isValid: false,
      message: ValidationRules.username.messages.minLength,
    };
  }

  if (trimmed.length > ValidationRules.username.maxLength) {
    return {
      isValid: false,
      message: ValidationRules.username.messages.maxLength,
    };
  }

  if (!ValidationRules.username.pattern.test(trimmed)) {
    return {
      isValid: false,
      message: ValidationRules.username.messages.pattern,
    };
  }

  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === "") {
    return { isValid: false, message: ValidationRules.email.messages.required };
  }

  const trimmed = email.trim();

  if (!ValidationRules.email.pattern.test(trimmed)) {
    return { isValid: false, message: ValidationRules.email.messages.invalid };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return {
      isValid: false,
      message: ValidationRules.password.messages.required,
    };
  }

  if (password.length < ValidationRules.password.minLength) {
    return {
      isValid: false,
      message: ValidationRules.password.messages.minLength,
    };
  }

  return { isValid: true };
};

export const validateFullName = (fullName: string): ValidationResult => {
  // Full name is optional
  if (!fullName || fullName.trim() === "") {
    return { isValid: true };
  }

  if (fullName.length > ValidationRules.fullName.maxLength) {
    return {
      isValid: false,
      message: ValidationRules.fullName.messages.maxLength,
    };
  }

  return { isValid: true };
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: "Vui lòng xác nhận mật khẩu" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: "Mật khẩu xác nhận không khớp" };
  }

  return { isValid: true };
};

export const validateOTP = (otp: string): ValidationResult => {
  if (!otp || otp.trim() === "") {
    return { isValid: false, message: ValidationRules.otp.messages.required };
  }

  if (!ValidationRules.otp.pattern.test(otp)) {
    return { isValid: false, message: ValidationRules.otp.messages.invalid };
  }

  return { isValid: true };
};
