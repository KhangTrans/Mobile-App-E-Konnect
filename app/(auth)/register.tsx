import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAlert } from "@/contexts/AlertContext";
import {
    authService,
    getErrorMessage,
    getValidationErrors,
} from "@/services/authService";
import {
    validateConfirmPassword,
    validateEmail,
    validatePassword,
    validateUsername,
} from "@/utils/validation";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const alert = useAlert();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /**
   * Update form field
   */
  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    let isValid = true;

    // Validate username
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.message || "";
      isValid = false;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message || "";
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || "";
      isValid = false;
    }

    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(
      formData.password,
      formData.confirmPassword,
    );
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.message || "";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle registration
   */
  const handleRegister = async () => {
    // Clear previous errors
    setErrors({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        // Show success message
        alert.showSuccess(
          "Đăng ký thành công!",
          "Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.",
          false,
        );
        setTimeout(() => router.back(), 2000);
      } else {
        // Handle errors
        const errorMessage = getErrorMessage(response);

        if (errorMessage === "Username or email already exists") {
          alert.showError("Lỗi đăng ký", "Username hoặc email đã được sử dụng");
        } else if (response.errors) {
          // Handle validation errors from backend
          const validationErrors = getValidationErrors(response);
          setErrors({ ...errors, ...validationErrors });
          alert.showError("Lỗi", "Vui lòng kiểm tra lại thông tin đã nhập");
        } else if (errorMessage.includes("Gửi email xác thực thất bại")) {
          alert.showWarning(
            "Lỗi gửi email",
            "Tài khoản đã được tạo nhưng không thể gửi email xác thực. Vui lòng liên hệ quản trị viên.",
          );
          setTimeout(() => router.back(), 2000);
        } else {
          alert.showError("Lỗi", errorMessage);
        }
      }
    } catch (error) {
      console.error("Register error:", error);
      alert.showError(
        "Lỗi",
        "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to Login screen
   */
  const handleNavigateToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Đăng ký tài khoản</Text>
          <Text style={styles.headerSubtitle}>
            Tạo tài khoản E-KONNECT của bạn
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Username Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <IconSymbol name="at" size={16} color="#333" />
              <Text style={styles.label}>
                Username <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, errors.username ? styles.inputError : null]}
              placeholder="Nhập username (3-30 ký tự)"
              value={formData.username}
              onChangeText={(text) => updateField("username", text)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {errors.username ? (
              <Text style={styles.errorText}>{errors.username}</Text>
            ) : null}
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <IconSymbol name="envelope.fill" size={16} color="#333" />
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChangeText={(text) => updateField("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <IconSymbol name="lock.fill" size={16} color="#333" />
              <Text style={styles.label}>
                Mật khẩu <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password ? styles.inputError : null,
                ]}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                value={formData.password}
                onChangeText={(text) => updateField("password", text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <IconSymbol
                  name={showPassword ? "eye" : "eye.slash"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <IconSymbol name="lock.fill" size={16} color="#333" />
              <Text style={styles.label}>
                Xác nhận mật khẩu <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.confirmPassword ? styles.inputError : null,
                ]}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChangeText={(text) => updateField("confirmPassword", text)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <IconSymbol
                  name={showConfirmPassword ? "eye" : "eye.slash"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              loading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity
              onPress={handleNavigateToLogin}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  required: {
    color: "#ff3b30",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    backgroundColor: "#99c9ff",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
