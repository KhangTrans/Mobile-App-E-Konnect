import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAlert } from "@/contexts/AlertContext";
import { authService } from "@/services/authService";
import { TokenManager, UserData } from "@/utils/tokenManager";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const alert = useAlert();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Check if token exists
      const token = await TokenManager.getToken();
      if (!token) {
        alert.showError(
          "Lỗi",
          "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        );
        router.replace("/(auth)/login");
        return;
      }

      const response = await authService.getMe();

      if (response.success && response.data) {
        setUserData(response.data);
      } else {
        console.error("Get user data failed:", response);
        alert.showError(
          "Lỗi",
          response.message || "Không thể tải thông tin người dùng",
        );
      }
    } catch (error: any) {
      console.error("Load user data error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể kết nối đến server";
      alert.showError("Lỗi", errorMessage);

      // If token is invalid, redirect to login
      if (error?.response?.status === 401) {
        await TokenManager.clearAuthData();
        router.replace("/(auth)/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    alert.showConfirm(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      async () => {
        try {
          await TokenManager.clearAuthData();
          router.replace("/(auth)/login");
        } catch (err) {
          console.error("Logout error:", err);
          alert.showError("Lỗi", "Không thể đăng xuất");
        }
      },
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EE4D2D" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {userData?.avatar ? (
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData?.fullName?.charAt(0).toUpperCase() ||
                    userData?.username?.charAt(0).toUpperCase() ||
                    "U"}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {userData?.fullName || userData?.username || "User"}
            </Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
            {userData?.isEmailVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Đã xác thực</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đơn hàng của tôi</Text>
        <MenuList>
          <MenuItem
            icon="clipboard.fill"
            title="Lịch sử đơn hàng"
            onPress={() => router.push("/orders/history" as any)}
            showArrow
          />
          <MenuItem
            icon="shippingbox.fill"
            title="Đơn hàng đang giao"
            badge="2"
            onPress={() =>
              alert.showInfo("🚧 Đang phát triển", "Chức năng này đang được phát triển và sẽ có sớm. Vui lòng chờ trong phên bản tiếp theo.")
            }
            showArrow
          />
          <MenuItem
            icon="star.fill"
            title="Đánh giá sản phẩm"
            onPress={() =>
              alert.showInfo("🚧 Đang phát triển", "Chức năng này đang được phát triển và sẽ có sớm. Vui lòng chờ trong phên bản tiếp theo.")
            }
            showArrow
          />
        </MenuList>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <MenuList>
          <MenuItem
            icon="person.fill"
            title="Thông tin cá nhân"
            onPress={() => router.push("/profile/edit" as any)}
            showArrow
          />
          <MenuItem
            icon="location.fill"
            title="Quản lý địa chỉ"
            onPress={() => router.push("/profile/addresses" as any)}
            showArrow
          />
          <MenuItem
            icon="bell.fill"
            title="Thông báo"
            onPress={() => router.push("/notifications" as any)}
            showArrow
          />
          <MenuItem
            icon="creditcard.fill"
            title="Phương thức thanh toán"
            onPress={() =>
              alert.showInfo("🚧 Đang phát triển", "Chức năng này đang được phát triển và sẽ có sớm.")
            }
            showArrow
          />
        </MenuList>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        <MenuList>
          <MenuItem
            icon="lock.fill"
            title="Đổi mật khẩu"
            onPress={() =>
              alert.showInfo("🚧 Đang phát triển", "Chức năng này đang được phát triển và sẽ có sớm.")
            }
            showArrow
          />
          <MenuItem
            icon="globe"
            title="Ngôn ngữ"
            value="Tiếng Việt"
            onPress={() =>
              alert.showInfo("Thông báo", "Tính năng đang phát triển")
            }
            showArrow
          />
          <MenuItem
            icon="questionmark.circle.fill"
            title="Trợ giúp & Hỗ trợ"
            onPress={() =>
              alert.showInfo("🚧 Đang phát triển", "Chức năng này đang được phát triển và sẽ có sớm.")
            }
            showArrow
          />
          <MenuItem
            icon="doc.fill"
            title="Điều khoản & Chính sách"
            onPress={() =>
              alert.showInfo("🚧 Đang phát triển", "Chức năng này đang được phát triển và sẽ có sớm.")
            }
            showArrow
          />
        </MenuList>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Phiên bản 1.0.0</Text>
      </View>

      {/* Padding cho Floating Tab Bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// Menu List Component
function MenuList({ children }: { children: React.ReactNode }) {
  return <View style={styles.menuList}>{children}</View>;
}

// Menu Item Component
interface MenuItemProps {
  icon: any;
  title: string;
  value?: string;
  badge?: string;
  onPress: () => void;
  showArrow?: boolean;
}

function MenuItem({
  icon,
  title,
  value,
  badge,
  onPress,
  showArrow = false,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <IconSymbol
          name={icon}
          size={24}
          color="#666"
          style={styles.menuIcon}
        />
        <Text style={styles.menuTitle}>{title}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {showArrow && <Text style={styles.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  header: {
    backgroundColor: "#fff",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EE4D2D",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  verifiedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#EE4D2D",
    borderRadius: 4,
  },
  editButtonText: {
    color: "#EE4D2D",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  menuList: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  badge: {
    backgroundColor: "#EE4D2D",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuValue: {
    fontSize: 14,
    color: "#999",
    marginRight: 8,
  },
  arrow: {
    fontSize: 24,
    color: "#ccc",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#fff",
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EE4D2D",
  },
  logoutText: {
    color: "#EE4D2D",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
});
