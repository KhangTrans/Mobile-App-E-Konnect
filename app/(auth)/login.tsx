import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAlert } from "@/contexts/AlertContext";
import { authService, getErrorMessage } from "@/services/authService";
import { TokenManager } from "@/utils/tokenManager";
import { validateEmail, validatePassword } from "@/utils/validation";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function LoginScreen() {
  const router = useRouter();
  const alert = useAlert();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Check if user is already logged in
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await TokenManager.getToken();

      if (token) {
        // Token exists, verify it's still valid
        const response = await authService.getMe();

        if (response.success && response.data) {
          // User is still logged in, redirect to home
          router.replace("/(tabs)");
          return;
        } else {
          // Token invalid or expired, clear it
          await TokenManager.clearAuthData();
        }
      }
    } catch (error) {
      console.log("No existing session");
      // Continue to login screen
    } finally {
      setCheckingAuth(false);
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang kiểm tra...</Text>
      </View>
    );
  }

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    const newErrors = {
      email: "",
      password: "",
    };

    let isValid = true;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message || "";
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message || "";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle login
   */
  const handleLogin = async () => {
    // Clear previous errors
    setErrors({ email: "", password: "" });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(email, password);

      if (response.success && response.data) {
        // Save token and user data
        await TokenManager.saveAuthData(
          response.data.token,
          response.data.user,
        );

        // Navigate to home screen
        router.replace("/(tabs)");
      } else {
        // Handle specific error messages
        const errorMessage = getErrorMessage(response);

        if (errorMessage === "Invalid credentials") {
          alert.showError("Lỗi đăng nhập", "Email hoặc mật khẩu không đúng");
        } else if (errorMessage === "Account has been deactivated") {
          alert.showError(
            "Tài khoản bị vô hiệu hóa",
            "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
          );
        } else if (errorMessage.includes("xác thực email")) {
          alert.showWarning(
            "Chưa xác thực email",
            "Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập.",
          );
        } else {
          alert.showError("Lỗi", errorMessage);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert.showError(
        "Lỗi",
        "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to Register screen
   */
  const handleNavigateToRegister = () => {
    router.push("/(auth)/register");
  };

  /**
   * Navigate to Forgot Password screen
   */
  const handleNavigateToForgotPassword = () => {
    router.push("/(auth)/forgot-password");
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>E-KONNECT</Text>
          <Text style={styles.logoSubtitle}>Đăng nhập để tiếp tục</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <IconSymbol name="envelope.fill" size={16} color="#333" />
              <Text style={styles.label}>Email</Text>
            </View>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="Nhập email của bạn"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: "" });
              }}
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
              <Text style={styles.label}>Mật khẩu</Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password ? styles.inputError : null,
                ]}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: "" });
                }}
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

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleNavigateToForgotPassword}
            disabled={loading}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity
              onPress={handleNavigateToRegister}
              disabled={loading}
            >
              <Text style={styles.registerLink}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() =>
              alert.showInfo(
                "Thông báo",
                "Tính năng đăng nhập Google đang được phát triển",
              )
            }
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>
              🔷 Đăng nhập bằng Google
            </Text>
          </TouchableOpacity>
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
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  logoSubtitle: {
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#99c9ff",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#999",
    fontSize: 12,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});
