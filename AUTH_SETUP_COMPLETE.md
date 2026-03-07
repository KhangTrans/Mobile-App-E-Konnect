# ✅ Auth Guard Đã Setup Xong!

## 🎯 Đã Làm Gì?

### 1. Tạo Auth Routes trong app/(auth)/

- ✅ `app/(auth)/login.tsx` - Màn hình đăng nhập
- ✅ `app/(auth)/register.tsx` - Màn hình đăng ký
- ✅ `app/(auth)/forgot-password.tsx` - Màn hình quên mật khẩu
- ✅ `app/(auth)/_layout.tsx` - Layout cho auth group

### 2. Thêm Auth Guard vào app/\_layout.tsx

- ✅ Kiểm tra token khi app khởi động
- ✅ Nếu **KHÔNG CÓ TOKEN** → Redirect đến **(auth)/login**
- ✅ Nếu **CÓ TOKEN** → Redirect đến **(tabs)** (trang chủ)
- ✅ Loading screen trong khi kiểm tra auth

## 🚀 Cách Hoạt Động

### Khi Mở App Lần Đầu:

1. App hiển thị loading spinner
2. Kiểm tra token trong AsyncStorage
3. **Không có token** → Chuyển đến màn hình LOGIN
4. User đăng nhập thành công → Lưu token → Chuyển đến trang chủ

### Khi Mở App Lần Sau:

1. App hiển thị loading spinner
2. Kiểm tra token trong AsyncStorage
3. **Có token** → Gọi API `/api/auth/me` để verify
4. Token hợp lệ → Chuyển đến trang chủ
5. Token không hợp lệ → Xóa token → Chuyển đến LOGIN

### Navigation Flow:

```
App Start
   ↓
[Loading Screen]
   ↓
Token?
   ├─ Không → (auth)/login
   │           ↓
   │        Đăng nhập thành công
   │           ↓
   │        Lưu token
   │           ↓
   └─ Có → Verify token?
            ├─ Hợp lệ → (tabs) [Trang chủ]
            └─ Không hợp lệ → Xóa token → (auth)/login
```

## 📱 Test Ngay

### 1. Khởi động app:

```bash
npm start
```

### 2. Test Flow:

1. **Mở app lần đầu** → Sẽ thấy màn hình LOGIN
2. **Chưa có tài khoản** → Nhấn "Đăng ký"
3. **Đăng ký xong** → Về LOGIN và đăng nhập
4. **Đăng nhập thành công** → Chuyển đến trang chủ
5. **Tắt app và mở lại** → Vẫn ở trang chủ (không cần login lại)

## 🔐 Các Màn Hình Auth

### 1. Login Screen - (auth)/login

- Email input
- Password input (có show/hide)
- Nút "Đăng nhập"
- Link "Quên mật khẩu?" → Chuyển đến forgot-password
- Link "Chưa có tài khoản? Đăng ký" → Chuyển đến register
- Nút "Đăng nhập bằng Google" (placeholder)

### 2. Register Screen - (auth)/register

- Username input (3-30 ký tự)
- Email input
- Họ tên (optional)
- Password input
- Confirm password input
- Nút "Đăng ký"
- Link "Đã có tài khoản? Đăng nhập" → Về login

### 3. Forgot Password - (auth)/forgot-password

**Bước 1: Nhập Email**

- Email input
- Nút "Gửi mã OTP"

**Bước 2: Reset Password**

- Hiển thị email đã nhập
- OTP input (6 số)
- Countdown timer (10 phút)
- Mật khẩu mới input
- Confirm mật khẩu input
- Nút "Đặt lại mật khẩu"
- Link "Gửi lại mã OTP"

## ⚙️ Cấu Hình Backend

### Cập nhật URL Backend trong `config/config.tsx`:

```typescript
export const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:5000" // Android Emulator
  : // ? 'http://localhost:5000'   // iOS Simulator
    // ? 'http://192.168.1.X:5000' // Real device
    "https://backend-node-5re9.onrender.com";
```

**Quan trọng:**

- **Android Emulator**: Dùng `10.0.2.2` thay vì `localhost`
- **iOS Simulator**: Dùng `localhost`
- **Real Device**: Dùng IP máy tính (cùng WiFi)

### Lấy IP máy tính:

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Tìm địa chỉ IPv4, ví dụ: `192.168.1.100`

## 🔄 Logout Function

Thêm nút logout ở màn hình home:

```typescript
import { TokenManager } from "@/utils/tokenManager";
import { useRouter } from "expo-router";

const handleLogout = async () => {
  await TokenManager.clearAuthData();
  router.replace("/(auth)/login");
};
```

## 🎨 Customize

### Thay đổi màu sắc:

Sửa trong mỗi file screen:

```typescript
const styles = StyleSheet.create({
  loginButton: {
    backgroundColor: "#007AFF", // Đổi màu ở đây
    // ...
  },
});
```

### Thay đổi logo:

Trong `login.tsx`:

```typescript
<Text style={styles.logoText}>E-KONNECT</Text>
```

## 🐛 Troubleshooting

### Vấn đề: App không hiện màn hình login

**Giải pháp:**

1. Stop server: Ctrl+C
2. Clear cache: `npm start -- --clear`
3. Reload app: Nhấn `r` trong terminal

### Vấn đề: "Cannot connect to server"

**Giải pháp:**

1. Kiểm tra backend đang chạy
2. Kiểm tra URL trong `config/config.tsx`
3. Android Emulator phải dùng `10.0.2.2`
4. Real device phải cùng WiFi và dùng IP máy tính

### Vấn đề: Token không save

**Giải pháp:**

1. Check console có lỗi AsyncStorage không
2. Verify `TokenManager.saveAuthData()` được gọi sau login
3. Clear app data và thử lại

## 📝 Test Checklist

- [ ] Mở app lần đầu → Hiển thị login screen
- [ ] Nhấn "Đăng ký" → Chuyển đến register screen
- [ ] Đăng ký tài khoản mới → Thành công, về login
- [ ] Đăng nhập với tài khoản mới → Chuyển đến home
- [ ] Tắt app và mở lại → Vẫn ở home (không cần login)
- [ ] Logout → Về login screen
- [ ] "Quên mật khẩu" → Chuyển đến forgot password
- [ ] Gửi OTP → Nhận email và nhập OTP
- [ ] Reset password → Thành công

## 🎉 Hoàn Tất!

Bây giờ app của bạn đã có:

- ✅ Auth Guard tự động
- ✅ Login/Register/Forgot Password
- ✅ Token persistence
- ✅ Auto-login khi có token
- ✅ Redirect về login khi token hết hạn
- ✅ Loading state khi check auth

## 📚 Tài Liệu

- [AUTH_README.md](AUTH_README.md) - Chi tiết đầy đủ
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Code examples
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Hướng dẫn

---

**Lưu ý:** Nhớ update API URL trong `config/config.tsx` cho đúng với backend của bạn!
