import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database, auth } from '../config/firebase';
import SideMenu from '../components/SideMenu';

const { width } = Dimensions.get('window');

export default function ShopScreen({ route, navigation }) {
  const initialFilter = route?.params?.initialFilter || '';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [filters, setFilters] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Real-time listener will already be up to date, so we just simulate the UI feedback
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    if (route?.params?.initialFilter) {
      setActiveFilter(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  useEffect(() => {
    setIsLoading(true);
    const dbRef = database().ref('assetimage');
    
    const onValueChange = (snapshot) => {
      let fetchedCategories = [];
      let fetchedItems = [];

      if (snapshot.exists()) {
        const data = snapshot.val();
        fetchedCategories = Object.keys(data).filter(key => key !== '_initialized');
        
        fetchedCategories.forEach(catName => {
          const content = data[catName];
          if (content && typeof content === 'object') {
            Object.entries(content).forEach(([id, item]) => {
              if (id === '_initialized') return;

              // ✅ Handle New Product Objects
              if (typeof item === 'object' && item.image) {
                fetchedItems.push({
                  id,
                  title: item.name || `${catName} Design`,
                  weight: item.weight || '',
                  img: { uri: item.image },
                  category: catName,
                  material: 'Premium Collection',
                  createdAt: item.createdAt || 0
                });
              } 
              // 👴 Handle Legacy Strings in Object format
              else if (typeof item === 'string') {
                fetchedItems.push({
                  id: `${catName}_${id}`,
                  title: `${catName} Design`,
                  img: { uri: item },
                  category: catName,
                  material: 'Classic Collection'
                });
              }
            });
          } 
          // 👴 Handle Legacy Arrays
          else if (Array.isArray(content)) {
            content.forEach((url, idx) => {
              if (typeof url === 'string') {
                fetchedItems.push({
                  id: `${catName}_arr_${idx}`,
                  title: `${catName} Design`,
                  img: { uri: url },
                  category: catName,
                  material: 'Classic Collection'
                });
              }
            });
          }
        });
      }

      setFilters(fetchedCategories);
      if (!activeFilter && fetchedCategories.length > 0) setActiveFilter(fetchedCategories[0]);
      setAllItems(fetchedItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setIsLoading(false);
    };

    dbRef.on('value', onValueChange);

    const uid = auth().currentUser?.uid;
    let wishRef = null;
    let unsubWish = null;
    if (uid) {
      wishRef = database().ref(`wishlist/${uid}`);
      unsubWish = (snapshot) => {
        setWishlistIds(new Set(snapshot.exists() ? Object.keys(snapshot.val()) : []));
      };
      wishRef.on('value', unsubWish);
    }

    return () => {
      dbRef.off('value', onValueChange);
      if (wishRef && unsubWish) wishRef.off('value', unsubWish);
    };
  }, []);

  const filteredItems = allItems.filter(item => {
    const matchesTab = !activeFilter || item.category === activeFilter;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleLike = async (item) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const isLiked = wishlistIds.has(item.id);
    const itemRef = database().ref(`wishlist/${uid}/${item.id}`);
    try {
      if (isLiked) await itemRef.remove();
      else await itemRef.set({ ...item, savedAt: Date.now() });
    } catch (e) { console.log('Wishlist error:', e); }
  };

  const viewItem = async (item) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    try {
      await database().ref(`recentViews/${uid}/${item.id}`).set({ ...item, viewedAt: Date.now() });
    } catch (e) { console.log('Recent view error:', e); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}><Ionicons name="menu" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>SHOP COLLECTIONS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#F5B041" 
            colors={["#F5B041"]} 
            backgroundColor="#110F0A"
          />
        }
      >
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9C9281" style={{ marginRight: 10 }} />
            <TextInput placeholder="Search designs..." placeholderTextColor="#9C9281" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((filter) => (
            <TouchableOpacity key={filter} style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]} onPress={() => setActiveFilter(filter)}>
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SHOWING {filteredItems.length} DESIGNS IN {activeFilter.toUpperCase()}</Text>
        </View>

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
                  <TouchableOpacity style={[styles.heartBtn, wishlistIds.has(item.id) && { backgroundColor: '#F5B041' }]} onPress={() => toggleLike(item)}>
                    <Ionicons name={wishlistIds.has(item.id) ? "heart" : "heart-outline"} size={16} color={wishlistIds.has(item.id) ? "black" : "white"} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={styles.productMaterial}>{item.material}</Text>
                  {item?.weight ? <Text style={styles.weightTag}>{item.weight}g</Text> : null}
                </View>
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
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  searchRow: { flexDirection: 'row', marginTop: 10, marginBottom: 20 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1A12', borderRadius: 10, paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, color: 'white', fontSize: 14 },
  filterScroll: { marginBottom: 20 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1F1A12', marginRight: 10, borderWidth: 1, borderColor: '#332A1D' },
  filterChipActive: { backgroundColor: '#F5B041', borderColor: '#F5B041' },
  filterText: { color: '#9C9281', fontSize: 12, fontWeight: 'bold' },
  filterTextActive: { color: 'black' },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { color: '#9C9281', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { width: '48%', marginBottom: 20 },
  productImgContainer: { width: '100%', height: 220, backgroundColor: '#1F1A12', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  productTitle: { color: 'white', fontSize: 14, marginBottom: 2, fontWeight: '500' },
  productMaterial: { color: '#9C9281', fontSize: 10 },
  weightTag: { color: '#F5B041', fontSize: 10, fontWeight: 'bold', backgroundColor: '#332A1D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
