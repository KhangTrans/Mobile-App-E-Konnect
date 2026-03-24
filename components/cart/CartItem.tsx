import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItemType } from '@/services/cartService';
import { formatPrice } from '@/services/productService'; // Utility format tiền tệ (VND)
import { useAlert } from '@/contexts/AlertContext';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

const CartItem = React.memo(function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const alert = useAlert();
  
  // Parsing product from items array
  const activeProduct = typeof item.productId === 'object' ? item.productId : null;
  const name = activeProduct?.name || 'Sản phẩm không rõ';
  const price = item.price || (activeProduct ? activeProduct.price : 0);
  
  // Xử lý lấy ảnh từ format images: [{ imageUrl: "..." }]
  const imageObj = activeProduct?.images?.[0];
  const imageUrlRaw = imageObj?.imageUrl || imageObj;
  const imageUrl = typeof imageUrlRaw === 'string' ? imageUrlRaw : 'https://via.placeholder.com/150';

  // --- State số lượng ---
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Sync state nội bộ khi props thay đổi 
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  // Hành động tăng / giảm số lượng
  const handleIncrease = () => {
    const newQty = localQuantity + 1;
    setLocalQuantity(newQty);
    onUpdateQuantity(item._id, newQty);
  };

  const handleDecrease = () => {
    if (localQuantity <= 1) {
      // Hiển thị Popup xác nhận Xóa The item 
      alert.showConfirm(
        'Xóa sản phẩm',
        'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?',
        () => onRemove(item._id)
      );
    } else {
      const newQty = localQuantity - 1;
      setLocalQuantity(newQty);
      onUpdateQuantity(item._id, newQty);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* ẢNH */}
      <View style={styles.imageBox}>
        <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
      </View>

      {/* THÔNG TIN */}
      <View style={styles.infoBox}>
        {/* Header: Tên và nút xoá (Thùng rác) */}
        <View style={styles.infoHeader}>
          <Text style={styles.productName} numberOfLines={2}>
            {name}
          </Text>
          <TouchableOpacity 
            style={styles.trashBtn} 
            onPress={() => onRemove(item._id)}
          >
            <Ionicons name="trash-outline" size={20} color="#E63946" />
          </TouchableOpacity>
        </View>

        {/* Footer: Giá và Bộ tăng giảm số lượng */}
        <View style={styles.infoFooter}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          <View style={styles.quantityPicker}>
            <TouchableOpacity style={styles.pickerBtn} onPress={handleDecrease}>
              <Ionicons name="remove" size={16} color="#1E3A5F" />
            </TouchableOpacity>
            
            <View style={styles.quantityValueBox}>
              <Text style={styles.quantityValue}>{localQuantity}</Text>
            </View>

            <TouchableOpacity style={styles.pickerBtn} onPress={handleIncrease}>
              <Ionicons name="add" size={16} color="#1E3A5F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

export default CartItem;

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImage: { width: '100%', height: '100%' },
  infoBox: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    marginRight: 10,
    lineHeight: 20,
  },
  trashBtn: {
    padding: 6,
    backgroundColor: '#FFF1F0',
    borderRadius: 8,
    marginTop: -4,
    marginRight: -4,
  },
  infoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#26C6DA',
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quantityValueBox: {
    minWidth: 28,
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
});
