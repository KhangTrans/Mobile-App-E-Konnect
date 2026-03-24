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
import { useRouter } from "expo-router";
import { useAlert } from "@/contexts/AlertContext";
import { addressService, CustomerAddress, CreateAddressInput } from "@/services/addressService";
import { Ionicons } from "@expo/vector-icons";

export default function AddressesScreen() {
  const router = useRouter();
  const alert = useAlert();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateAddressInput>({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    label: "",
    isDefault: false
  });

  // --- Location Selection API State ---
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  // Selection Modal
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<"city" | "district" | "ward">("city");

  useEffect(() => {
    loadData();
    fetchProvinces();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const addrRes = await addressService.getAddresses();
      if (addrRes.success && addrRes.data) {
        setAddresses(addrRes.data);
      } else {
        alert.showError("Lỗi", addrRes.message || "Không thể tải danh sách địa chỉ");
      }
    } catch (error: any) {
      console.error("Error loading addresses:", error);
      alert.showError("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Provinces using free open API
  const fetchProvinces = async () => {
    try {
      const response = await fetch('https://provinces.open-api.vn/api/?depth=3');
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      fullName: "",
      phoneNumber: "",
      address: "",
      city: "",
      district: "",
      ward: "",
      label: "",
      isDefault: addresses.length === 0
    });
    setDistricts([]);
    setWards([]);
    setModalVisible(true);
  };

  const openEditModal = (address: CustomerAddress) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      address: address.address,
      city: address.city,
      district: address.district || "",
      ward: address.ward || "",
      label: address.label || "",
      isDefault: address.isDefault
    });

    // Attempt to preload districts and wards if data exists
    if (provinces.length > 0) {
      const foundCity = provinces.find(p => p.name === address.city);
      if (foundCity) {
        setDistricts(foundCity.districts);
        const foundDistrict = foundCity.districts.find((d: any) => d.name === address.district);
        if (foundDistrict) {
          setWards(foundDistrict.wards);
        }
      }
    }
    setModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.fullName || !formData.phoneNumber || !formData.address || !formData.city || !formData.district || !formData.ward) {
      alert.showError("Lỗi", "Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    setActionLoading(true);
    try {
      if (editingAddress) {
        const res = await addressService.updateAddress(editingAddress._id, formData);
        if (res.success) {
          alert.showSuccess("Thành công", "Đã cập nhật địa chỉ");
          setModalVisible(false);
          loadData();
        } else {
          alert.showError("Lỗi", res.message || "Cập nhật thất bại");
        }
      } else {
        const res = await addressService.createAddress(formData);
        if (res.success) {
          alert.showSuccess("Thành công", "Đã thêm địa chỉ mới");
          setModalVisible(false);
          loadData();
        } else {
          alert.showError("Lỗi", res.message || "Thêm mới thất bại");
        }
      }
    } catch (error: any) {
      alert.showError("Lỗi", error.response?.data?.message || "Đã xảy ra lỗi hệ thống");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    alert.showConfirm("Xác nhận", "Bạn có chắc chắn muốn xóa địa chỉ này?", async () => {
      setActionLoading(true);
      try {
        const res = await addressService.deleteAddress(id);
        if (res.success) {
          alert.showSuccess("Thành công", "Đã xóa địa chỉ");
          loadData();
        } else {
          alert.showError("Lỗi", res.message || "Xóa thất bại");
        }
      } catch (error) {
        alert.showError("Lỗi", "Xóa địa chỉ thất bại");
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleSetDefault = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await addressService.setDefaultAddress(id);
      if (res.success) {
        alert.showSuccess("Thành công", "Đã đặt làm địa chỉ mặc định");
        loadData();
      } else {
        alert.showError("Lỗi", res.message || "Thao tác thất bại");
      }
    } catch (error) {
      alert.showError("Lỗi", "Đặt địa chỉ mặc định thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Selection Handlers ---
  const openSelectionModal = (type: "city" | "district" | "ward") => {
    if (type === "district" && !formData.city) {
      alert.showError("Thông báo", "Vui lòng chọn Tỉnh/Thành phố trước.");
      return;
    }
    if (type === "ward" && !formData.district) {
      alert.showError("Thông báo", "Vui lòng chọn Quận/Huyện trước.");
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý địa chỉ</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addIconBtn}>
          <Ionicons name="add" size={24} color="#26C6DA" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#26C6DA" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {addresses.length === 0 ? (
            <View style={styles.emptyAddress}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào.</Text>
              <TouchableOpacity onPress={openAddModal} style={styles.emptyAddBtn}>
                <Text style={styles.emptyAddBtnText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((address) => (
              <View key={address._id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressName} numberOfLines={1}>{address.fullName}</Text>
                  <Text style={styles.addressSeparator}> | </Text>
                  <Text style={styles.addressPhone}>{address.phoneNumber}</Text>
                </View>

                <Text style={styles.addressText}>{address.address}</Text>
                <Text style={styles.addressText}>
                  {[address.ward, address.district, address.city].filter(Boolean).join(", ")}
                </Text>

                <View style={styles.addressTags}>
                  {address.label ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{address.label}</Text>
                    </View>
                  ) : null}
                  {address.isDefault && (
                    <View style={[styles.tag, styles.defaultTag]}>
                      <Text style={styles.defaultTagText}>Mặc định</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.addressActions}>
                  {!address.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(address._id)}
                      style={styles.setDefaultBtn}
                      disabled={actionLoading}
                    >
                      <Text style={styles.setDefaultText}>Thiết lập mặc định</Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={() => openEditModal(address)}
                    style={[styles.actionBtn, { marginRight: 16 }]}
                    disabled={actionLoading}
                  >
                    <Ionicons name="create-outline" size={18} color="#1E3A5F" />
                    <Text style={[styles.actionText, { color: '#1E3A5F', marginLeft: 4 }]}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(address._id)}
                    style={styles.actionBtn}
                    disabled={actionLoading}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionText, { color: "#ef4444", marginLeft: 4 }]}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Address Form Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</Text>
            <TouchableOpacity onPress={handleSaveAddress} style={styles.saveBtn} disabled={actionLoading}>
              {actionLoading ? (
                <ActivityIndicator size="small" color="#26C6DA" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
                <Ionicons name="chevron-down-outline" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Quận/Huyện *</Text>
                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openSelectionModal("district")}>
                  <Text style={[styles.dropdownSelectorText, !formData.district && styles.dropdownSelectorPlaceholder]} numberOfLines={1}>
                    {formData.district || "Chọn Quận/Huyện"}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Phường/Xã *</Text>
                <TouchableOpacity style={styles.dropdownSelector} onPress={() => openSelectionModal("ward")}>
                  <Text style={[styles.dropdownSelectorText, !formData.ward && styles.dropdownSelectorPlaceholder]} numberOfLines={1}>
                    {formData.ward || "Chọn Phường/Xã"}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={20} color="#94a3b8" />
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nhãn địa chỉ (Tùy chọn)</Text>
              <View style={styles.labelChips}>
                {["Nhà riêng", "Văn phòng"].map((lb) => (
                  <TouchableOpacity
                    key={lb}
                    style={[styles.chipObj, formData.label === lb && styles.chipActive]}
                    onPress={() => setFormData(prev => ({ ...prev, label: lb }))}
                  >
                    <Text style={[styles.chipText, formData.label === lb && styles.chipTextActive]}>{lb}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
              <Switch
                value={formData.isDefault}
                onValueChange={(val) => setFormData(prev => ({ ...prev, isDefault: val }))}
                trackColor={{ false: "#767577", true: "#fbc2ba" }}
                thumbColor={formData.isDefault ? "#26C6DA" : "#f4f3f4"}
                disabled={editingAddress?.isDefault}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

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
                <Ionicons name="close" size={24} color="#1E3A5F" />
              </TouchableOpacity>
            </View>
            {getSelectionData().length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#26C6DA" />
                <Text style={{ marginTop: 10, color: '#666' }}>Đang tải dữ liệu...</Text>
              </View>
            ) : (
              <FlatList
                data={getSelectionData()}
                keyExtractor={(item: any) => item.code.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.selectionItem}
                    onPress={() => handleSelectItem(item)}
                  >
                    <Text style={styles.selectionItemText}>{item.name}</Text>
                    {((selectionType === "city" && formData.city === item.name) ||
                      (selectionType === "district" && formData.district === item.name) ||
                      (selectionType === "ward" && formData.ward === item.name)) && (
                        <Ionicons name="checkmark" size={20} color="#26C6DA" />
                      )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E3A5F",
  },
  addIconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  scrollContent: {
    padding: 16,
  },
  emptyAddress: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyText: {
    marginTop: 12,
    color: "#94a3b8",
    marginBottom: 16,
  },
  emptyAddBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#26C6DA",
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  addressCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E3A5F",
    flexShrink: 1,
  },
  addressSeparator: {
    color: "#ccc",
    marginHorizontal: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: "#64748b",
  },
  addressText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 4,
  },
  addressTags: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 16,
  },
  tag: {
    borderWidth: 1,
    borderColor: "#26C6DA",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagText: {
    color: "#26C6DA",
    fontSize: 12,
  },
  defaultTag: {
    borderColor: "#26C6DA",
  },
  defaultTagText: {
    color: "#26C6DA",
    fontSize: 12,
  },
  addressActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#64748b",
  },
  setDefaultBtn: {
    borderWidth: 1,
    borderColor: "#26C6DA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  setDefaultText: {
    fontSize: 12,
    color: "#26C6DA",
    fontWeight: "bold",
  },

  // ------------ Modal Styles ------------
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: "#64748b",
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E3A5F",
  },
  saveBtn: {
    padding: 4,
    minWidth: 40,
    alignItems: "flex-end",
  },
  saveBtnText: {
    color: "#26C6DA",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#1E3A5F",
    backgroundColor: "#FAFAFA",
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownSelectorText: {
    fontSize: 15,
    color: "#1E3A5F",
    flex: 1,
  },
  dropdownSelectorPlaceholder: {
    color: "#999",
  },
  labelChips: {
    flexDirection: "row",
    gap: 12,
  },
  chipObj: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  chipActive: {
    borderColor: "#26C6DA",
    backgroundColor: "#FFF3F0",
  },
  chipText: {
    color: "#64748b",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#26C6DA",
    fontWeight: "bold",
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  switchLabel: {
    fontSize: 15,
    color: "#1E3A5F",
  },

  // --- Bottom Sheet Selection Styles ---
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
    borderBottomColor: "#EEE",
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "bold",
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
    borderBottomColor: "#F0F0F0",
  },
  selectionItemText: {
    fontSize: 15,
    color: "#1E3A5F",
  }
});
