# 🚀 Quick Reference Guide - E-KONNECT Auth

## 📌 Essential Imports

```typescript
// Services
import { authService, getErrorMessage } from "@/services/authService";

// Utils
import { TokenManager } from "@/utils/tokenManager";
import { validateEmail, validatePassword } from "@/utils/validation";
```

## 🔐 Common Use Cases

### 1. Login User

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authService.login(email, password);

    if (response.success && response.data) {
      // Save auth data
      await TokenManager.saveAuthData(response.data.token, response.data.user);

      // Navigate to home
      router.replace("/(tabs)");
    } else {
      // Show error
      Alert.alert("Error", getErrorMessage(response));
    }
  } catch (error) {
    Alert.alert("Error", "Cannot connect to server");
  }
};
```

### 2. Register User

```typescript
const handleRegister = async (userData) => {
  try {
    const response = await authService.register({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName, // optional
    });

    if (response.success) {
      Alert.alert("Success", "Please check your email to verify your account", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Error", getErrorMessage(response));
    }
  } catch (error) {
    Alert.alert("Error", "Cannot connect to server");
  }
};
```

### 3. Forgot Password (Send OTP)

```typescript
const handleSendOTP = async (email: string) => {
  try {
    const response = await authService.forgotPassword(email);

    if (response.success) {
      Alert.alert("Success", "OTP sent to your email");
      setStep("reset"); // Move to step 2
    } else {
      Alert.alert("Error", getErrorMessage(response));
    }
  } catch (error) {
    Alert.alert("Error", "Cannot connect to server");
  }
};
```

### 4. Reset Password with OTP

```typescript
const handleResetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  try {
    const response = await authService.resetPassword(email, otp, newPassword);

    if (response.success) {
      Alert.alert("Success", "Password reset successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Error", getErrorMessage(response));
    }
  } catch (error) {
    Alert.alert("Error", "Cannot connect to server");
  }
};
```

### 5. Logout User

```typescript
const handleLogout = async () => {
  try {
    await TokenManager.clearAuthData();
    router.replace("/(auth)/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};
```

### 6. Check Authentication Status

```typescript
const checkAuth = async () => {
  try {
    const token = await TokenManager.getToken();

    if (token) {
      const response = await authService.getMe();

      if (response.success && response.data) {
        return response.data; // User is authenticated
      } else {
        await TokenManager.clearAuthData();
        return null;
      }
    }

    return null; // Not authenticated
  } catch (error) {
    console.error("Auth check failed:", error);
    return null;
  }
};
```

### 7. Get Current User Data

```typescript
// From AsyncStorage (fast, but may be outdated)
const userData = await TokenManager.getUserData();

// From API (slower, but always current)
const response = await authService.getMe();
if (response.success && response.data) {
  const userData = response.data;
}
```

## ✅ Validation Functions

```typescript
// Email validation
const emailResult = validateEmail(email);
if (!emailResult.isValid) {
  console.log(emailResult.message);
}

// Password validation
const passwordResult = validatePassword(password);
if (!passwordResult.isValid) {
  console.log(passwordResult.message);
}

// Username validation
const usernameResult = validateUsername(username);
if (!usernameResult.isValid) {
  console.log(usernameResult.message);
}

// Confirm password validation
const confirmResult = validateConfirmPassword(password, confirmPassword);
if (!confirmResult.isValid) {
  console.log(confirmResult.message);
}

// OTP validation
const otpResult = validateOTP(otp);
if (!otpResult.isValid) {
  console.log(otpResult.message);
}
```

## 🎨 Common Patterns

### Form with Loading State

```typescript
const [loading, setLoading] = useState(false);
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleSubmit = async () => {
  setError('');
  setLoading(true);

  try {
    // Your API call
    const response = await authService.login(email, password);

    if (response.success) {
      // Handle success
    } else {
      setError(getErrorMessage(response));
    }
  } catch (error) {
    setError('Cannot connect to server');
  } finally {
    setLoading(false);
  }
};

// In render
<TouchableOpacity
  onPress={handleSubmit}
  disabled={loading}
  style={[styles.button, loading && styles.buttonDisabled]}
>
  {loading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text>Submit</Text>
  )}
</TouchableOpacity>
```

### Password Toggle

```typescript
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);

// In render
<View style={styles.passwordContainer}>
  <TextInput
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
    style={styles.input}
  />
  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
  </TouchableOpacity>
</View>
```

### Form Validation

```typescript
const [errors, setErrors] = useState({
  email: "",
  password: "",
});

const validateForm = () => {
  const newErrors = { email: "", password: "" };
  let isValid = true;

  // Email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    newErrors.email = emailValidation.message || "";
    isValid = false;
  }

  // Password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    newErrors.password = passwordValidation.message || "";
    isValid = false;
  }

  setErrors(newErrors);
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return; // Validation failed
  }

  // Continue with API call
};
```

## 🔗 API Endpoints

| Endpoint                    | Method | Auth Required | Description      |
| --------------------------- | ------ | ------------- | ---------------- |
| `/api/auth/login`           | POST   | ❌            | Login user       |
| `/api/auth/register`        | POST   | ❌            | Register user    |
| `/api/auth/forgot-password` | POST   | ❌            | Send OTP         |
| `/api/auth/reset-password`  | POST   | ❌            | Reset password   |
| `/api/auth/me`              | GET    | ✅            | Get current user |
| `/api/auth/google/token`    | POST   | ❌            | Google login     |

## 🔧 Environment Configuration

```typescript
// config/config.tsx

// Development
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000'                        // Android Emulator
  : 'https://backend-node-5re9.onrender.com';     // Production

// Platform-specific
Android Emulator → http://10.0.2.2:5000
iOS Simulator   → http://localhost:5000
Real Device     → http://192.168.1.X:5000 (your computer's IP)
```

## 🐛 Debugging

```typescript
// Enable detailed logging
console.log("Login request:", { email, password });
console.log("Login response:", response);
console.log("Token saved:", await TokenManager.getToken());
console.log("User data:", await TokenManager.getUserData());

// Check network requests
// Use React Native Debugger or Flipper to see network tab
```

## ⚠️ Common Errors

| Error                  | Cause                      | Solution                               |
| ---------------------- | -------------------------- | -------------------------------------- |
| Network request failed | Cannot reach backend       | Check API_BASE_URL configuration       |
| Invalid credentials    | Wrong email/password       | Verify credentials                     |
| Email not verified     | User hasn't verified email | Check inbox for verification email     |
| Token expired          | JWT expired                | Call `clearAuthData()` and login again |
| Validation error       | Invalid input              | Check validation messages              |

## 📦 File Locations

```
config/config.tsx           → API configuration
services/authService.ts     → API calls
utils/tokenManager.ts       → Token management
utils/validation.ts         → Form validation
screens/auth/LoginScreen.tsx
screens/auth/RegisterScreen.tsx
screens/auth/FogotPassWord.tsx
```

---

**Quick Links:**

- [Full Documentation](AUTH_README.md)
- [Implementation Guide](IMPLEMENTATION_SUMMARY.md)
- [Auth Guard Examples](examples/authGuardExample.tsx)
