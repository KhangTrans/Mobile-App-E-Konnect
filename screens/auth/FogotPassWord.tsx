import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { authService, getErrorMessage } from "../../services/authService";
import {
    validateConfirmPassword,
    validateEmail,
    validateOTP,
    validatePassword,
} from "../../utils/validation";

type Step = "email" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // OTP Timer (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start countdown timer
   */
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      Alert.alert("Hết hạn", "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerActive, timeLeft]);

  /**
   * Format time left (MM:SS)
   */
  const formatTimeLeft = (): string => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  /**
   * Validate email step
   */
  const validateEmailStep = (): boolean => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setErrors({ ...errors, email: emailValidation.message || "" });
      return false;
    }
    setErrors({ ...errors, email: "" });
    return true;
  };

  /**
   * Validate reset step
   */
  const validateResetStep = (): boolean => {
    const newErrors = {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    };

    let isValid = true;

    // Validate OTP
    const otpValidation = validateOTP(otp);
    if (!otpValidation.isValid) {
      newErrors.otp = otpValidation.message || "";
      isValid = false;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.message || "";
      isValid = false;
    }

    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(
      newPassword,
      confirmPassword,
    );
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.message || "";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle send OTP
   */
  const handleSendOTP = async () => {
    setErrors({ email: "", otp: "", newPassword: "", confirmPassword: "" });

    if (!validateEmailStep()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);

      if (response.success) {
        Alert.alert(
          "Thành công",
          "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
          [
            {
              text: "OK",
              onPress: () => {
                setStep("reset");
                setTimeLeft(600); // Reset timer to 10 minutes
                setIsTimerActive(true);
              },
            },
          ],
        );
      } else {
        const errorMessage = getErrorMessage(response);
        Alert.alert(
          "Lỗi",
          errorMessage || "Không thể gửi mã OTP. Vui lòng thử lại.",
        );
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle resend OTP
   */
  const handleResendOTP = async () => {
    if (timeLeft > 0 && isTimerActive) {
      Alert.alert(
        "Thông báo",
        "Vui lòng đợi cho đến khi mã OTP hiện tại hết hạn.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);

      if (response.success) {
        Alert.alert("Thành công", "Mã OTP mới đã được gửi đến email của bạn.");
        setTimeLeft(600);
        setIsTimerActive(true);
        setOtp(""); // Clear old OTP
      } else {
        const errorMessage = getErrorMessage(response);
        Alert.alert(
          "Lỗi",
          errorMessage || "Không thể gửi mã OTP. Vui lòng thử lại.",
        );
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle reset password
   */
  const handleResetPassword = async () => {
    setErrors({ email: "", otp: "", newPassword: "", confirmPassword: "" });

    if (!validateResetStep()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(email, otp, newPassword);

      if (response.success) {
        Alert.alert(
          "Thành công! 🎉",
          "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.",
          [
            {
              text: "OK",
              onPress: () => {
                // Stop timer
                setIsTimerActive(false);
                if (timerRef.current) {
                  clearTimeout(timerRef.current);
                }
                // Navigate to Login
                router.back();
              },
            },
          ],
        );
      } else {
        const errorMessage = getErrorMessage(response);

        if (errorMessage.includes("OTP không chính xác")) {
          Alert.alert("Lỗi", "Mã OTP không chính xác. Vui lòng kiểm tra lại.");
        } else if (errorMessage.includes("OTP đã hết hạn")) {
          Alert.alert("Hết hạn", "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
          setIsTimerActive(false);
        } else if (errorMessage.includes("Email không tồn tại")) {
          Alert.alert("Lỗi", "Email không tồn tại trong hệ thống.");
        } else {
          Alert.alert("Lỗi", errorMessage);
        }
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle back to login
   */
  const handleBackToLogin = () => {
    if (isTimerActive) {
      setIsTimerActive(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
    router.back();
  };

  /**
   * Render Step 1: Enter Email
   */
  const renderEmailStep = () => (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Quên mật khẩu</Text>
        <Text style={styles.headerSubtitle}>
          Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
        </Text>
      </View>

      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
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

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.primaryButtonDisabled,
          ]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Gửi mã OTP</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login Link */}
        <TouchableOpacity
          onPress={handleBackToLogin}
          disabled={loading}
          style={styles.backToLoginContainer}
        >
          <Text style={styles.backToLoginText}>← Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  /**
   * Render Step 2: Reset Password
   */
  const renderResetStep = () => (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Đặt lại mật khẩu</Text>
        <Text style={styles.headerSubtitle}>
          Mã OTP đã được gửi đến: {email}
        </Text>
      </View>

      <View style={styles.formContainer}>
        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Mã OTP có hiệu lực trong:</Text>
          <Text
            style={[styles.timerText, timeLeft < 60 && styles.timerTextWarning]}
          >
            {formatTimeLeft()}
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mã OTP</Text>
          <TextInput
            style={[styles.input, errors.otp ? styles.inputError : null]}
            placeholder="Nhập mã OTP (6 chữ số)"
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
              setErrors({ ...errors, otp: "" });
            }}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
          {errors.otp ? (
            <Text style={styles.errorText}>{errors.otp}</Text>
          ) : null}
        </View>

        {/* New Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu mới</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                errors.newPassword ? styles.inputError : null,
              ]}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrors({ ...errors, newPassword: "" });
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
              <Text style={styles.eyeButtonText}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.newPassword ? (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          ) : null}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                errors.confirmPassword ? styles.inputError : null,
              ]}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: "" });
              }}
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
              <Text style={styles.eyeButtonText}>
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.primaryButtonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP Link */}
        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={loading || (isTimerActive && timeLeft > 0)}
          style={styles.resendContainer}
        >
          <Text
            style={[
              styles.resendText,
              (loading || (isTimerActive && timeLeft > 0)) &&
                styles.resendTextDisabled,
            ]}
          >
            Gửi lại mã OTP
          </Text>
        </TouchableOpacity>

        {/* Back to Login Link */}
        <TouchableOpacity
          onPress={handleBackToLogin}
          disabled={loading}
          style={styles.backToLoginContainer}
        >
          <Text style={styles.backToLoginText}>← Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const content = step === "email" ? renderEmailStep() : renderResetStep();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {content}
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
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
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
  eyeButtonText: {
    fontSize: 20,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: "#99c9ff",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backToLoginContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  backToLoginText: {
    color: "#007AFF",
    fontSize: 14,
  },
  timerContainer: {
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  timerText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
  },
  timerTextWarning: {
    color: "#ff3b30",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  resendText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: "#ccc",
  },
});
