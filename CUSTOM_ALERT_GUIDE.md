# Custom Alert Usage Guide

## Import

```tsx
import { useAlert } from "@/contexts/AlertContext";
```

## Basic Usage

### In Component

```tsx
const MyComponent = () => {
  const alert = useAlert();

  // Success alert (auto close after 2s)
  alert.showSuccess("Thành công!", "Đăng nhập thành công");

  // Error alert
  alert.showError("Lỗi", "Email hoặc mật khẩu không đúng");

  // Warning alert
  alert.showWarning("Cảnh báo", "Vui lòng kiểm tra lại thông tin");

  // Info alert
  alert.showInfo("Thông báo", "Email xác thực đã được gửi");

  // Confirm dialog
  alert.showConfirm(
    "Xác nhận đăng xuất",
    "Bạn có chắc chắn muốn đăng xuất?",
    () => {
      // On confirm
      console.log("Confirmed");
    },
    () => {
      // On cancel (optional)
      console.log("Cancelled");
    },
  );
};
```

## Replace All Alert.alert

### Before (React Native Alert)

```tsx
Alert.alert("Thành công", "Đăng ký thành công");
```

### After (Custom Alert)

```tsx
alert.showSuccess("Thành công", "Đăng ký thành công");
```

## Features

- ✅ Beautiful animations (spring & fade)
- ✅ 5 types: success, error, warning, info, confirm
- ✅ Auto close for success/info
- ✅ Custom icons with colors
- ✅ Backdrop blur effect
- ✅ Multiple buttons support
- ✅ TypeScript support
- ✅ Global context (use anywhere)

## API

### Methods

- `showSuccess(title, message?, autoClose?)` - Green checkmark
- `showError(title, message?)` - Red X mark
- `showWarning(title, message?)` - Orange warning
- `showInfo(title, message?, autoClose?)` - Blue info
- `showConfirm(title, message?, onConfirm?, onCancel?)` - Question mark
- `showAlert(options)` - Custom options
- `hideAlert()` - Manually close

### Custom Options

```tsx
alert.showAlert({
  type: "success",
  title: "Custom Title",
  message: "Custom message",
  autoClose: true,
  autoCloseDuration: 3000,
  buttons: [
    { text: "Cancel", style: "cancel", onPress: () => {} },
    { text: "OK", style: "default", onPress: () => {} },
    { text: "Delete", style: "destructive", onPress: () => {} },
  ],
});
```
