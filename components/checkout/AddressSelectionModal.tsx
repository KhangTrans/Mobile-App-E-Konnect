import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addressService, CustomerAddress, CreateAddressInput } from "@/services/addressService";

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: CustomerAddress) => void;
  selectedAddressId?: string;
}

export default function AddressSelectionModal({
  visible,
  onClose,
  onSelect,
  selectedAddressId,
}: AddressSelectionModalProps) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAddressInput>({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    label: "",
    isDefault: false,
  });

  // Location Selection API State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<"city" | "district" | "ward">("city");
  
  // Local Alert state for modal context
  const [alertMsg, setAlertMsg] = useState<{ title: string; message: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (visible) {
      loadAddresses();
      fetchProvinces();
    }
  }, [visible]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressService.getAddresses();
      if (res.success && res.data) {
        setAddresses(res.data);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      if (provinces.length > 0) return;
      const response = await fetch("https://provinces.open-api.vn/api/?depth=3");
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  const openAddForm = () => {
    setFormData({
      fullName: "",
      phoneNumber: "",
      address: "",
      city: "",
      district: "",
      ward: "",
      label: "",
      isDefault: addresses.length === 0,
    });
    setDistricts([]);
    setWards([]);
    setShowAddForm(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.fullName || !formData.phoneNumber || !formData.address || !formData.city || !formData.district || !formData.ward) {
      showAlert("Lỗi", "Vui lòng điền đầy đủ các thông tin bắt buộc (*)", true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await addressService.createAddress(formData);
      if (res.success && res.data) {
        // Find if backend returns newly created address. If not, reload and select.
        // Assuming the list needs a refresh anyway.
        const newAddressesRes = await addressService.getAddresses();
        let createdAddr = res.data;
        if (newAddressesRes.success && newAddressesRes.data) {
          setAddresses(newAddressesRes.data);
          // Auto select the new one if we can identify it, else just pick the first
          createdAddr = newAddressesRes.data.find(a => a._id === res.data?._id) || newAddressesRes.data[0];
        }
        
        setShowAddForm(false);
        if (createdAddr) {
          onSelect(createdAddr);
        }
      } else {
        showAlert("Lỗi", res.message || "Thêm mới thất bại", true);
      }
    } catch (error: any) {
      showAlert("Lỗi", error.response?.data?.message || "Đã xảy ra lỗi hệ thống", true);
    } finally {
      setActionLoading(false);
    }
  };

  const showAlert = (title: string, message: string, isError: boolean = false) => {
    setAlertMsg({ title, message, isError });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const openSelectionModal = (type: "city" | "district" | "ward") => {
    if (type === "district" && !formData.city) {
      showAlert("Thông báo", "Vui lòng chọn Tỉnh/Thành phố trước.", true);
      return;
    }
    if (type === "ward" && !formData.district) {
      showAlert("Thông báo", "Vui lòng chọn Quận/Huyện trước.", true);
      return;
    }
    setSelectionType(type);
    setSelectionModalVisible(true);
  };

  const handleSelectItem = (item: any) => {
    if (selectionType === "city") {
      setFormData(prev => ({ ...prev, city: item.name, district: "", ward: "" }));
      setDistricts(item.districts || []);
      setWards([]);
    } else if (selectionType === "district") {
      setFormData(prev => ({ ...prev, district: item.name, ward: "" }));
      setWards(item.wards || []);
    } else if (selectionType === "ward") {
      setFormData(prev => ({ ...prev, ward: item.name }));
    }
    setSelectionModalVisible(false);
  };

  const getSelectionData = () => {
    if (selectionType === "city") return provinces;
    if (selectionType === "district") return districts;
    if (selectionType === "ward") return wards;
    return [];
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={showAddForm ? () => setShowAddForm(false) : onClose} style={styles.headerBtn}>
            <Ionicons name={showAddForm ? "arrow-back" : "close"} size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{showAddForm ? "Thêm địa chỉ mới" : "Chọn địa chỉ giao hàng"}</Text>
          <View style={styles.headerBtn} />
        </View>

        {alertMsg && (
          <View style={[styles.alertBox, alertMsg.isError ? styles.alertError : styles.alertSuccess]}>
            <Text style={styles.alertText}>{alertMsg.message}</Text>
          </View>
        )}

        {showAddForm ? (
          // Add Address Form View
          <>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                  placeholder="Ví dụ: 0912345678"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tỉnh/Thành phố *</Text>
                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openSelectionModal("city")}>
                  <Text style={[styles.dropdownSelectorText, !formData.city && styles.dropdownSelectorPlaceholder]}>
                    {formData.city || "Chọn Tỉnh/Thành phố"}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={20} color="#888" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quận/Huyện *</Text>
                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openSelectionModal("district")}>
                    <Text style={[styles.dropdownSelectorText, !formData.district && styles.dropdownSelectorPlaceholder]} numberOfLines={1}>
                      {formData.district || "Chọn Quận/Huyện"}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Phường/Xã *</Text>
                  <TouchableOpacity style={styles.dropdownSelector} onPress={() => openSelectionModal("ward")}>
                    <Text style={[styles.dropdownSelectorText, !formData.ward && styles.dropdownSelectorPlaceholder]} numberOfLines={1}>
                      {formData.ward || "Chọn Phường/Xã"}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#888" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ cụ thể *</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  placeholder="Số nhà, tên đường..."
                  multiline
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
                <Switch
                  value={formData.isDefault}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, isDefault: val }))}
                  trackColor={{ false: "#767577", true: "#fbc2ba" }}
                  thumbColor={formData.isDefault ? "#EE4D2D" : "#f4f3f4"}
                />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveAddress} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Lưu và Chọn</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Address List View
          <>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#EE4D2D" />
                <Text style={{ marginTop: 12, color: "#666" }}>Đang tải địa chỉ...</Text>
              </View>
            ) : (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {addresses.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Ionicons name="location-outline" size={48} color="#ccc" />
                    <Text style={{ marginTop: 12, color: "#888", marginBottom: 16 }}>Bạn chưa có địa chỉ nào.</Text>
                  </View>
                ) : (
                  addresses.map((addr) => (
                    <TouchableOpacity
                      key={addr._id}
                      style={[styles.addressCard, selectedAddressId === addr._id && styles.addressCardSelected]}
                      onPress={() => onSelect(addr)}
                    >
                      <View style={styles.addressCardHeader}>
                        <View style={styles.addressHeaderLeft}>
                          <Text style={styles.addressName}>{addr.fullName}</Text>
                          <Text style={styles.addressPhone}> | {addr.phoneNumber}</Text>
                        </View>
                        {selectedAddressId === addr._id && (
                          <Ionicons name="checkmark-circle" size={24} color="#EE4D2D" />
                        )}
                      </View>
                      <Text style={styles.addressText}>{addr.address}</Text>
                      <Text style={styles.addressText}>
                        {[addr.ward, addr.district, addr.city].filter(Boolean).join(", ")}
                      </Text>
                      {addr.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Mặc định</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
            
            <View style={styles.footer}>
              <TouchableOpacity style={styles.outlineButton} onPress={openAddForm}>
                <Ionicons name="add" size={20} color="#EE4D2D" />
                <Text style={styles.outlineButtonText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Select Location Modal */}
      <Modal visible={selectionModalVisible} animationType="slide" transparent={true}>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>
                {selectionType === "city"
                  ? "Chọn Tỉnh/Thành phố"
                  : selectionType === "district"
                    ? "Chọn Quận/Huyện"
                    : "Chọn Phường/Xã"}
              </Text>
              <TouchableOpacity onPress={() => setSelectionModalVisible(false)} style={styles.bottomSheetClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {getSelectionData().length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#EE4D2D" />
                <Text style={{ marginTop: 10, color: '#666' }}>Đang tải dữ liệu...</Text>
              </View>
            ) : (
              <FlatList
                data={getSelectionData()}
                keyExtractor={(item: any) => item.code.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.selectionItem} onPress={() => handleSelectItem(item)}>
                    <Text style={styles.selectionItemText}>{item.name}</Text>
                    {((selectionType === "city" && formData.city === item.name) ||
                      (selectionType === "district" && formData.district === item.name) ||
                      (selectionType === "ward" && formData.ward === item.name)) && (
                        <Ionicons name="checkmark" size={20} color="#EE4D2D" />
                      )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  addressCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addressCardSelected: {
    borderColor: "#EE4D2D",
    backgroundColor: "#FFF8F6",
  },
  addressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  addressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  addressPhone: {
    fontSize: 14,
    color: "#64748B",
  },
  addressText: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
    lineHeight: 20,
  },
  defaultBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#EE4D2D",
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: "#EE4D2D",
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EE4D2D",
    backgroundColor: "#FFF",
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EE4D2D",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EE4D2D",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  
  // Form Styles
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#FFF",
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 48,
  },
  dropdownSelectorText: {
    fontSize: 15,
    color: "#0F172A",
    flex: 1,
  },
  dropdownSelectorPlaceholder: {
    color: "#94A3B8",
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },
  
  // Alert
  alertBox: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  alertError: {
    backgroundColor: "#FEE2E2",
  },
  alertSuccess: {
    backgroundColor: "#DCFCE7",
  },
  alertText: {
    fontSize: 14,
    color: "#1E293B",
    textAlign: "center",
  },

  // Bottom Sheet
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === "ios" ? 24 : 0,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  bottomSheetClose: {
    padding: 4,
  },
  selectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  selectionItemText: {
    fontSize: 15,
    color: "#1E293B",
  }
});
