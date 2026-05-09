import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ref, get, set, remove, onValue } from 'firebase/database';
import { database, auth } from '../config/firebase';
import SideMenu from '../components/SideMenu';

const { width } = Dimensions.get('window');

export default function ShopScreen({ route, navigation }) {
  const initialFilter = route?.params?.initialFilter || 'All';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [filters, setFilters] = useState(['All']);
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Filter Modal States
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('None'); // 'LowToHigh', 'HighToLow'
  const [selectedTypes, setSelectedTypes] = useState([]); // Multiple category selection
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    if (route?.params?.initialFilter) {
      setActiveFilter(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  useEffect(() => {
    fetchItems();
    
    // Listen to wishlist
    const uid = auth.currentUser?.uid;
    if (uid) {
      const wishRef = ref(database, `wishlist/${uid}`);
      const unsub = onValue(wishRef, (snapshot) => {
        if (snapshot.exists()) {
          const keys = Object.keys(snapshot.val());
          setWishlistIds(new Set(keys));
        } else {
          setWishlistIds(new Set());
        }
      });
      return () => unsub();
    }
  }, []);

  const fetchItems = async () => {
    try {
      const dbRef = ref(database, 'assetimage');
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        let fetchedItems = [];
        let fetchedCategories = ['All'];

        Object.keys(data).forEach(categoryName => {
          fetchedCategories.push(categoryName);
          const urls = Array.isArray(data[categoryName]) ? data[categoryName] : Object.values(data[categoryName]);
          
          urls.forEach((url, index) => {
            if (typeof url === 'string') {
              fetchedItems.push({
                id: `${categoryName}_${index}`,
                title: `${categoryName} ${index + 1}`,
                material: 'Premium Quality',
                img: { uri: url },
                category: categoryName
              });
            }
          });
        });

        // Set the dynamic filters and items
        setFilters(fetchedCategories);
        fetchedItems = fetchedItems.sort(() => Math.random() - 0.5); // Shuffle for 'All'
        setAllItems(fetchedItems);
      }
    } catch (error) {
      console.log('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  let filteredItems = allItems;
  
  // Apply Horizontal Capsule Filter (if not 'All')
  if (activeFilter !== 'All') {
    filteredItems = filteredItems.filter(item => item.category === activeFilter);
  }

  // Apply Multi-select Filter (if any are checked)
  if (selectedTypes.length > 0) {
    filteredItems = filteredItems.filter(item => selectedTypes.includes(item.category));
  }

  if (searchQuery) {
    filteredItems = filteredItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.material.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const toggleLike = async (item) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const isLiked = wishlistIds.has(item.id);
    const itemRef = ref(database, `wishlist/${uid}/${item.id}`);
    
    try {
      if (isLiked) {
        await remove(itemRef);
      } else {
        await set(itemRef, {
          ...item,
          savedAt: Date.now()
        });
      }
    } catch (error) {
      console.log('Error toggling wishlist:', error);
    }
  };

  const viewItem = async (item) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await set(ref(database, `recentViews/${uid}/${item.id}`), {
        ...item,
        viewedAt: Date.now()
      });
    } catch (e) {
      console.log('Error tracking recent view:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}><Ionicons name="menu" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>OM ORNAMENTS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9C9281" style={{ marginRight: 10 }} />
            <TextInput 
              placeholder="Search jewelry..." 
              placeholderTextColor="#9C9281" 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(!filterModalVisible)}>
            <Ionicons name="options-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Filter Modal Panel */}
        {filterModalVisible && (
          <View style={styles.filterPanel}>

            <Text style={styles.filterPanelTitle}>Jewellery Type</Text>
            <View style={styles.sortChips}>
              {filters.filter(f => f !== 'All').map(type => (
                <TouchableOpacity key={type} onPress={() => toggleType(type)} style={[styles.filterChip, selectedTypes.includes(type) && styles.filterChipActive]}>
                  <Text style={[styles.filterText, selectedTypes.includes(type) && styles.filterTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Collections Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>COLLECTIONS ({filteredItems.length})</Text>
        </View>

        {/* Grid */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#F5B041" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.productCard}>
                <View style={styles.productImgContainer}>
                  <TouchableOpacity onPress={() => viewItem(item)} style={{ width: '100%', height: '100%' }}>
                    <Image source={item.img} style={styles.productImg} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.heartBtn, wishlistIds.has(item.id) && { backgroundColor: '#F5B041' }]}
                    onPress={() => toggleLike(item)}
                  >
                    <Ionicons name={wishlistIds.has(item.id) ? "heart" : "heart-outline"} size={16} color={wishlistIds.has(item.id) ? "black" : "white"} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.productMaterial} numberOfLines={1}>{item.material}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { color: '#F5B041', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#F5B041', borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'black', fontSize: 10, fontWeight: 'bold' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  
  searchRow: { flexDirection: 'row', marginTop: 10, marginBottom: 20 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1A12', borderRadius: 10, paddingHorizontal: 15, height: 50, marginRight: 15 },
  searchInput: { flex: 1, color: 'white', fontSize: 14 },
  filterBtn: { width: 50, height: 50, backgroundColor: '#F5B041', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  filterScroll: { marginBottom: 20 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1F1A12', marginRight: 10, borderWidth: 1, borderColor: '#332A1D' },
  filterChipActive: { backgroundColor: '#F5B041', borderColor: '#F5B041' },
  filterText: { color: '#9C9281', fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: 'black' },
  
  filterPanel: { backgroundColor: '#1F1A12', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#332A1D' },
  filterPanelTitle: { color: '#F5B041', fontWeight: 'bold', marginBottom: 10 },
  sortChips: { flexDirection: 'row', flexWrap: 'wrap' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#9C9281', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  sortBtn: { flexDirection: 'row', alignItems: 'center' },
  sortText: { color: '#F5B041', fontSize: 12, fontWeight: 'bold', marginRight: 5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { width: '48%', marginBottom: 20 },
  productImgContainer: { width: '100%', height: 220, backgroundColor: '#1F1A12', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  productTitle: { color: 'white', fontSize: 14, marginBottom: 2 },
  productMaterial: { color: '#9C9281', fontSize: 10, marginBottom: 5 },
  productPrice: { color: '#F5B041', fontSize: 16, fontWeight: 'bold' },
});
