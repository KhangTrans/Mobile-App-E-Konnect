import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '@/config/config';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Lấy kích thước màn hình
const { width } = Dimensions.get('window');

// Interface mô tả danh mục
interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch API lấy danh sách Danh Mục Nổi Bật từ backend-node
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/featured`);
        const json = await response.json();
        if (json.success) {
          setCategories(json.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top + 20 }]} 
      showsVerticalScrollIndicator={false}
    >
      {/* SECTION 1: Nâng Tầm Phong Cách Công Nghệ */}
      <View style={styles.introSection}>
        <Text style={styles.introTitle}>Nâng Tầm{'\n'}Phong Cách{'\n'}Công Nghệ.</Text>
        <Text style={styles.introDesc}>
          Khám phá bộ sưu tập thiết bị và phụ kiện công nghệ định hình tương lai. Trải nghiệm mua sắm đẳng cấp và khác biệt ngay hôm nay.
        </Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/explore')}>
          <Text style={styles.shopButtonText}>Bắt Đầu Mua Sắm </Text>
          <Ionicons name="arrow-forward" size={16} color="black" />
        </TouchableOpacity>
        
        <View style={styles.introImageContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.introImage} 
            resizeMode="cover"
          />
        </View>
      </View>

      {/* SECTION 2: Danh Mục Nổi Bật */}
      <View style={styles.categorySection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Danh Mục Nổi Bật</Text>
          <View style={styles.titleUnderline} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginVertical: 40 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((item, index) => (
              <TouchableOpacity key={item._id} style={styles.categoryCard}>
                <View style={styles.categoryImageContainer}>
                  <Image 
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
                    style={styles.categoryImage} 
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.categorySubtitle}>COLLECTION 0{index + 1}</Text>
                <Text style={styles.categoryName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* SECTION 3: Trải Nghiệm Mua Sắm Hoàn Hảo */}
      <View style={styles.experienceSection}>
        <View style={styles.experienceBox}>
          <Text style={styles.experienceBoxTitle}>Trải Nghiệm{'\n'}Mua Sắm{'\n'}Hoàn Hảo</Text>
        </View>
        
        <View style={styles.experienceList}>
          <View style={styles.experienceItem}>
            <Text style={[styles.expItemTitle, { color: '#4285F4' }]}>TƯ VẤN CHUYÊN SÂU</Text>
            <Text style={styles.expItemText}>Đội ngũ chuyên gia công nghệ của chúng tôi luôn sẵn sàng lắng nghe và tư vấn giải pháp tối ưu nhất cho nhu cầu của bạn.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.experienceItem}>
            <Text style={[styles.expItemTitle, { color: '#A159FF' }]}>TRẢI NGHIỆM THỰC TẾ</Text>
            <Text style={styles.expItemText}>Không gian showroom hiện đại cho phép bạn trải nghiệm tận tay mọi sản phẩm công nghệ mới nhất trước khi quyết định.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.experienceItem}>
            <Text style={[styles.expItemTitle, { color: '#0F9D58' }]}>BẢO HÀNH TRỌN ĐỜI</Text>
            <Text style={styles.expItemText}>Cam kết hỗ trợ kỹ thuật và bảo hành chính hãng trọn đời sản phẩm, mang lại sự an tâm tuyệt đối cho khách hàng.</Text>
          </View>
        </View>
      </View>

      {/* SECTION 4: Hỗ Trợ Khách Hàng */}
      <View style={styles.supportSection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Hỗ Trợ Khách Hàng</Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.supportCardsContainer}>
          {supportItems.map((item, index) => (
            <View key={index} style={styles.supportCard}>
              <View style={styles.supportCardTop}>
                <Text style={styles.supportCardQuestion}>{item.question}</Text>
              </View>
              <View style={styles.supportCardBottom}>
                <Text style={styles.supportCardAnswer}>{item.answer}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {/* Padding cho Floating Tab Bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// Data giả cho phần Hỗ Trợ Khách Hàng
const supportItems = [
  {
    question: 'Chính sách đổi trả sản phẩm?',
    answer: 'Chúng tôi hỗ trợ đổi mới 1-1 trong vòng 30 ngày đầu nếu có lỗi từ nhà sản xuất. Hoàn tiền 100% nếu bạn không hài lòng.'
  },
  {
    question: 'Thời gian giao hàng bao lâu?',
    answer: 'Giao hàng hỏa tốc 2h trong nội thành Hà Nội & TP.HCM. 1-3 ngày đối với các tỉnh thành khác. Miễn phí vận chuyển toàn quốc.'
  },
  {
    question: 'Có hỗ trợ trả góp không?',
    answer: 'Chúng tôi liên kết với hơn 20 ngân hàng, hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng hoặc công ty tài chính. Duyệt hồ sơ trong 5 phút.'
  }
];

// Stylesheet giống với phong cách của Web nhưng trên Mobile
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF5FC', // Màu nền xanh nhạt giống bản thiết kế
  },
  introSection: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  introTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000',
    lineHeight: 52,
    letterSpacing: -1.5,
    marginBottom: 16,
  },
  introDesc: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
    marginBottom: 24,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  introImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#000',
    overflow: 'hidden',
    backgroundColor: '#778899', 
  },
  introImage: {
    width: '100%',
    height: '100%',
  },
  categorySection: {
    paddingVertical: 24,
  },
  sectionTitleContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A5F', // Màu xanh đen sậm
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#26C6DA', // Nét gạch dưới xanh lam
    marginTop: 8,
  },
  categoryScroll: {
    paddingHorizontal: 24, // Padding trượt mượt mà
    gap: 16,
  },
  categoryCard: {
    width: 220, // Kích thước thẻ danh mục
  },
  categoryImageContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#000',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categorySubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  experienceSection: {
    padding: 24,
    paddingVertical: 16,
  },
  experienceBox: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 24,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  experienceBoxTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#000',
    lineHeight: 44,
    letterSpacing: -1,
    textAlign: 'center',
  },
  experienceList: {
    gap: 24,
  },
  experienceItem: {
    gap: 8,
  },
  expItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  expItemText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  supportSection: {
    paddingVertical: 16,
  },
  supportCardsContainer: {
    paddingHorizontal: 24,
    gap: 20,
  },
  supportCard: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
  },
  supportCardTop: {
    backgroundColor: '#DFECFD', // Xanh nhạt phần trên thẻ
    padding: 24,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
  },
  supportCardQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 24,
  },
  supportCardBottom: {
    padding: 24,
    backgroundColor: '#FFF',
  },
  supportCardAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  }
});
