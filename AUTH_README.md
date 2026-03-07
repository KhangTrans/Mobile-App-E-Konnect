# 🔐 E-KONNECT Authentication Implementation

Complete authentication system for E-Konnect React Native/Expo app with Login, Register, and Forgot Password functionality.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Implemented Screens

1. **LoginScreen** ✅
   - Email/password authentication
   - Password visibility toggle
   - Form validation
   - Error handling for invalid credentials, deactivated accounts, and unverified emails
   - Google Sign-In button (placeholder)
   - Navigation to Register and Forgot Password screens

2. **RegisterScreen** ✅
   - Username, email, full name, and password inputs
   - Client-side validation matching backend rules
   - Confirm password validation
   - Registration success flow (email verification required)
   - Error handling for duplicate username/email

3. **ForgotPasswordScreen** ✅
   - Two-step process: Send OTP → Reset Password
   - OTP countdown timer (10 minutes)
   - Resend OTP functionality
   - Password reset with OTP validation

### Key Features

- ✅ Token management with AsyncStorage
- ✅ Axios interceptors for auto token attachment
- ✅ Comprehensive validation utilities
- ✅ Error handling for all API responses
- ✅ Loading states and disabled buttons
- ✅ Keyboard-aware forms
- ✅ TypeScript support
- ✅ Automatic logout on 401 errors

## 📦 Installation

### Dependencies Already Installed

```bash
npm install @react-native-async-storage/async-storage axios
```

### Additional Dependencies (Optional)

For Google Sign-In (when implementing):

```bash
npx expo install expo-auth-session expo-web-browser expo-crypto
```

## 📁 Project Structure

```
E-Konnect/
├── config/
│   └── config.tsx                 # API base URL configuration
├── services/
│   └── authService.ts             # Auth API calls
├── utils/
│   ├── tokenManager.ts            # Token & user data management
│   └── validation.ts              # Form validation utilities
├── screens/
│   └── auth/
│       ├── LoginScreen.tsx        # Login screen
│       ├── RegisterScreen.tsx     # Registration screen
│       └── FogotPassWord.tsx      # Forgot password screen
```

## ⚙️ Configuration

### 1. Update API Base URL

Edit [config/config.tsx](config/config.tsx):

```typescript
export const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:5000" // Android Emulator
  : // ? 'http://localhost:5000'   // iOS Simulator (uncomment for iOS)
    // ? 'http://192.168.1.x:5000' // Real device (use your computer's IP)
    "https://backend-node-5re9.onrender.com"; // Production
```

**Important Notes:**

- **Android Emulator**: Use `10.0.2.2` to access localhost
- **iOS Simulator**: Use `localhost`
- **Real Device**: Use your computer's IP address (e.g., `192.168.1.100:5000`)
- Make sure backend is running on the same network

## 🚀 Usage

### Navigation Setup

Make sure your navigation is set up to access these screens. Example with Expo Router:

```typescript
// In your app/_layout.tsx or navigation setup
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/FogotPassWord";
```

### Auto-Login Check

Implement auto-login check in your app entry point:

```typescript
import { useEffect, useState } from 'react';
import { TokenManager } from './utils/tokenManager';
import { authService } from './services/authService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await TokenManager.getToken();
      if (token) {
        // Verify token by calling /me endpoint
        const response = await authService.getMe();
        if (response.success) {
          setIsAuthenticated(true);
        } else {
          // Invalid token, clear it
          await TokenManager.clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <HomeScreen /> : <LoginScreen />;
}
```

### Using Auth Services

```typescript
import { authService } from "../services/authService";
import { TokenManager } from "../utils/tokenManager";

// Login
const handleLogin = async () => {
  const response = await authService.login(email, password);
  if (response.success && response.data) {
    await TokenManager.saveAuthData(response.data.token, response.data.user);
    // Navigate to home
  }
};

// Register
const handleRegister = async () => {
  const response = await authService.register({
    username,
    email,
    password,
    fullName,
  });
  if (response.success) {
    // Show success message, navigate to login
  }
};

// Logout
const handleLogout = async () => {
  await authService.logout();
  // Navigate to login screen
};
```

## 🔌 API Integration

### API Endpoints

| Endpoint                    | Method | Description             |
| --------------------------- | ------ | ----------------------- |
| `/api/auth/login`           | POST   | User login              |
| `/api/auth/register`        | POST   | User registration       |
| `/api/auth/forgot-password` | POST   | Send OTP email          |
| `/api/auth/reset-password`  | POST   | Reset password with OTP |
| `/api/auth/me`              | GET    | Get current user        |
| `/api/auth/google/token`    | POST   | Google Sign-In          |

### Request/Response Examples

#### Login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "johndoe",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "token": "JWT_TOKEN_HERE"
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Invalid credentials"
}
```

## 🧪 Testing

### Testing on Different Platforms

1. **Android Emulator:**

   ```bash
   npm run android
   ```

2. **iOS Simulator (macOS only):**

   ```bash
   npm run ios
   ```

3. **Web:**
   ```bash
   npm run web
   ```

### Test Scenarios

- ✅ Successful login with valid credentials
- ✅ Login with unverified email
- ✅ Login with invalid credentials
- ✅ Registration with new user
- ✅ Registration with duplicate email/username
- ✅ Password reset flow with OTP
- ✅ OTP expiration (10 minutes)
- ✅ Form validation errors
- ✅ Network errors

## 🔧 Troubleshooting

### Common Issues

#### 1. Cannot connect to backend

**Problem:** "Network request failed" or "Cannot connect to server"

**Solutions:**

- Android Emulator: Use `10.0.2.2` instead of `localhost`
- iOS Simulator: Use `localhost` or `127.0.0.1`
- Real device: Use your computer's IP address (e.g., `192.168.1.100`)
- Make sure backend is running
- Check firewall settings

#### 2. Token not persisting

**Problem:** User logged out after app restart

**Solutions:**

- Check AsyncStorage permissions
- Verify TokenManager is saving correctly
- Check if `clearAuthData()` is being called unexpectedly

#### 3. Validation errors not displaying

**Problem:** Form submits without validation

**Solutions:**

- Check that validation functions are called before API calls
- Verify error state is being set correctly
- Check console for any validation errors

#### 4. OTP timer not working

**Problem:** Countdown doesn't start or stops unexpectedly

**Solutions:**

- Check that `setIsTimerActive(true)` is called after OTP sent
- Verify useEffect cleanup is working
- Check for component unmounting issues

### Debug Mode

Enable detailed logging:

```typescript
// In authService.ts, add console logs
const response = await apiClient.post("/login", data);
console.log("Login response:", response.data);
```

## 📝 Validation Rules

### Client-Side Validation

| Field     | Rules                                   |
| --------- | --------------------------------------- |
| Username  | 3-30 characters, only a-z, A-Z, 0-9, \_ |
| Email     | Valid email format                      |
| Password  | Minimum 6 characters                    |
| Full Name | Optional, max 100 characters            |
| OTP       | Exactly 6 digits                        |

**Note:** Client-side validation must match backend validation rules.

## 🔒 Security Considerations

1. **Token Storage**: Tokens are stored in AsyncStorage (encrypted on device)
2. **Auto-logout**: 401 responses automatically clear auth data
3. **Password**: Never logged to console in production
4. **HTTPS**: Production API uses HTTPS
5. **Token Expiration**: Backend handles JWT expiration

## 📱 Screenshots

### Login Screen

- Email input with keyboard type `email-address`
- Password input with show/hide toggle
- Loading state during authentication
- Error messages display below inputs

### Register Screen

- All required fields with validation
- Confirm password matching
- Success alert with email verification reminder

### Forgot Password Screen

- Step 1: Email input and send OTP
- Step 2: OTP input, new password, countdown timer
- Resend OTP functionality

## 🎨 Customization

### Styling

All styles are defined in the StyleSheet at the bottom of each component. Customize colors:

```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: "#007AFF", // Change to your brand color
    // ...
  },
  // ...
});
```

### Validation Messages

Edit messages in [utils/validation.ts](utils/validation.ts):

```typescript
export const ValidationRules = {
  email: {
    messages: {
      required: "Your custom message here",
      invalid: "Your custom message here",
    },
  },
  // ...
};
```

## 📚 Additional Resources

- [Expo AsyncStorage Docs](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Navigation](https://reactnavigation.org/)
- [Expo Router](https://expo.github.io/router/docs/)

## ✅ Checklist

- [x] Install dependencies
- [x] Configure API base URL
- [x] Implement LoginScreen
- [x] Implement RegisterScreen
- [x] Implement ForgotPasswordScreen
- [x] Create auth service layer
- [x] Create token manager
- [x] Create validation utilities
- [x] Test on Android emulator
- [ ] Test on iOS simulator
- [ ] Test on real device
- [ ] Implement Google Sign-In (optional)
- [ ] Add biometric authentication (optional)
- [ ] Implement "Remember Me" (optional)

## 🤝 Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Verify backend API is running and accessible
3. Check console logs for detailed error messages
4. Ensure all dependencies are installed correctly

---

**Created for E-KONNECT Project**
Last updated: March 7, 2026
