import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAlert } from "@/contexts/AlertContext";
import { authService, getErrorMessage } from "@/services/authService";
import {
  validateConfirmPassword,
  validateEmail,
  validateOTP,
  validatePassword,
} from "@/utils/validation";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Fallback if expo-linear-gradient isn't installed
let LinearGradient: any = View;
try {
  const ExpoLinearGradient = require("expo-linear-gradient").LinearGradient;
  if (ExpoLinearGradient) {
    LinearGradient = ExpoLinearGradient;
  }
} catch (e) {
  // Use View if expo-linear-gradient is not available
}

const { width } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const alert = useAlert();

  // Step Management: 1 = Email, 2 = Reset (OTP + Password)
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errors State
  const [errors, setErrors] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // OTP Timer (optional but helps UX)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerActive, timeLeft]);

  /**
   * Transition between steps with animation
   */
  const transitionToStep = (targetStep: 1 | 2) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: targetStep === 2 ? -width : 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(targetStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  /**
   * Step 1: Handle Send OTP
   */
  const handleSendOTP = async () => {
    // Basic validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setErrors({ ...errors, email: emailValidation.message || "Email không hợp lệ" });
      return;
    }
    setErrors({ ...errors, email: "" });

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        alert.showSuccess("Thành công", "Mã xác thực đã được gửi đến email của bạn.");
        setStep(2);
        setIsTimerActive(true);
        setTimeLeft(600);
      } else {
        alert.showError("Lỗi", getErrorMessage(response));
      }
    } catch (error) {
      alert.showError("Lỗi hệ thống", "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Handle Reset Password
   */
  const handleResetPassword = async () => {
    // Validate inputs
    const otpValidation = validateOTP(otp);
    const passwordValidation = validatePassword(newPassword);
    const confirmValidation = validateConfirmPassword(newPassword, confirmPassword);

    const newErrors = {
      email: "",
      otp: otpValidation.isValid ? "" : (otpValidation.message || "Mã OTP không hợp lệ"),
      newPassword: passwordValidation.isValid ? "" : (passwordValidation.message || "Mật khẩu không hợp lệ"),
      confirmPassword: confirmValidation.isValid ? "" : (confirmValidation.message || "Mật khẩu không khớp"),
    };

    setErrors(newErrors);

    if (!otpValidation.isValid || !passwordValidation.isValid || !confirmValidation.isValid) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(email, otp, newPassword);
      if (response.success) {
        alert.showSuccess("Thành công!", "Mật khẩu của bạn đã được cập nhật.");
        setTimeout(() => router.replace("/(auth)/login"), 1500);
      } else {
        alert.showError("Lỗi", getErrorMessage(response));
      }
    } catch (error) {
      alert.showError("Lỗi hệ thống", "Đã xảy ra lỗi khi đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format countdown time
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderEmailStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.iconCircle}>
        <AntDesign name="mail" size={40} color="#6366f1" />
      </View>
      <Text style={styles.title}>Quên mật khẩu?</Text>
      <Text style={styles.subtitle}>
        Đừng lo lắng! Hãy nhập email liên kết với tài khoản của bạn để nhận mã OTP.
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <AntDesign name="user" size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            placeholder="Email Address"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
          />
        </View>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleSendOTP}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#6366f1", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Gửi mã OTP</Text>
              <AntDesign name="arrowright" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderResetStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="shield-key-outline" size={40} color="#6366f1" />
      </View>
      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      <Text style={styles.subtitle}>
        Mã OTP đã được gửi về email <Text style={styles.emailHighlight}>{email}</Text>. Vui lòng kiểm tra và nhập bên dưới.
      </Text>

      {/* OTP Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mã xác thực (6 chữ số)</Text>
        <View style={styles.inputWrapper}>
          <AntDesign name="calculator" size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/[^0-9]/g, ""));
              if (errors.otp) setErrors({ ...errors, otp: "" });
            }}
          />
        </View>
        {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
      </View>

      {/* New Password */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mật khẩu mới</Text>
        <View style={styles.inputWrapper}>
          <AntDesign name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            placeholder="Ít nhất 6 ký tự"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <IconSymbol 
              name={showPassword ? "eye" : "eye.slash"} 
              size={20} 
              color="#94a3b8" 
            />
          </TouchableOpacity>
        </View>
        {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
        <View style={styles.inputWrapper}>
          <AntDesign name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
            }}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <IconSymbol 
              name={showConfirmPassword ? "eye" : "eye.slash"} 
              size={20} 
              color="#94a3b8" 
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
      </View>

      {/* Timer & Resend */}
      <View style={styles.resendWrapper}>
        <Text style={styles.resendText}>Không nhận được mã?</Text>
        {isTimerActive ? (
          <Text style={styles.timerText}> Gửi lại sau {formatTime(timeLeft)}</Text>
        ) : (
          <TouchableOpacity onPress={handleSendOTP}>
            <Text style={styles.resendLink}> Gửi lại mã</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#6366f1", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Xác nhận thay đổi</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(1)}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>← Quay lại bước trước</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={["#f8fafc", "#f1f5f9"]}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Background shapes for Premium look */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? renderEmailStep() : renderResetStep()}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bgCircle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99, 102, 241, 0.03)",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    justifyContent: "center",
  },
  stepContainer: {
    width: "100%",
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    // Shadow for iOS
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    // Shadow for Android
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  emailHighlight: {
    color: "#6366f1",
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  primaryButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginTop: 12,
    overflow: "hidden",
    backgroundColor: "#6366f1", // Fallback background color
    // Premium Shadow
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 24,
    padding: 8,
  },
  backButtonText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
  resendWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  resendText: {
    color: "#64748b",
    fontSize: 14,
  },
  resendLink: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "700",
  },
  timerText: {
    color: "#94a3b8",
    fontSize: 14,
    fontStyle: "italic",
  },
});

