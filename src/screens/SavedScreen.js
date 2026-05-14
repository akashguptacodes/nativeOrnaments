import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database, auth } from '../config/firebase';
import SideMenu from '../components/SideMenu';



export default function SavedScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All Items');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      return;
    }

    const wishRef = database().ref(`wishlist/${uid}`);
    const unsubWish = (snapshot) => {
      if (snapshot.exists()) {
        const items = Object.values(snapshot.val());
        items.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        setWishlistItems(items);
      } else {
        setWishlistItems([]);
      }
      setIsLoading(false);
    };
    wishRef.on('value', unsubWish);

    const recentRef = database().ref(`recentViews/${uid}`);
    const unsubRecent = (snapshot) => {
      if (snapshot.exists()) {
        const items = Object.values(snapshot.val());
        items.sort((a, b) => (b.viewedAt || 0) - (a.viewedAt || 0));
        setRecentItems(items.slice(0, 10)); // Top 10 recent
      } else {
        setRecentItems([]);
      }
    };
    recentRef.on('value', unsubRecent);

    return () => {
      wishRef.off('value', unsubWish);
      recentRef.off('value', unsubRecent);
    };
  }, []);

  const removeFromWishlist = async (itemId) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    try {
      await database().ref(`wishlist/${uid}/${itemId}`).remove();
    } catch (e) {
      console.log('Error removing from wishlist', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}><Ionicons name="menu" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>WISHLIST</Text>
        <TouchableOpacity><Ionicons name="search" size={24} color="#F5B041" /></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => setActiveTab('All Items')} style={styles.tabItem}>
          <Text style={[styles.tabText, activeTab === 'All Items' && styles.tabTextActive]}>All Items ({wishlistItems.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('COLLECTIONS')} style={styles.tabItem}>
          <Text style={[styles.tabText, activeTab === 'COLLECTIONS' && styles.tabTextActive]}>COLLECTIONS</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Wishlist Items */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#F5B041" style={{ marginTop: 50 }} />
        ) : wishlistItems.length === 0 ? (
          <Text style={{ color: '#9C9281', textAlign: 'center', marginTop: 30 }}>Your wishlist is empty.</Text>
        ) : (
          wishlistItems.map((item) => (
            <View key={item.id} style={styles.wishlistCard}>
              <Image source={item.img} style={styles.wishlistImg} />
              <View style={styles.wishlistInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.wishlistTitle} numberOfLines={2}>{item.title}</Text>
                  <TouchableOpacity onPress={() => removeFromWishlist(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#9C9281" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Recently Viewed */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>RECENTLY VIEWED</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
          {recentItems.map((item) => (
            <View key={item.id} style={styles.recentCard}>
              <View style={styles.recentImgContainer}>
                <Image source={item.img} style={styles.recentImg} />
              </View>
              <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10 },
  tabItem: { marginRight: 30 },
  tabText: { color: '#9C9281', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#F5B041' },
  tabDivider: { height: 1, backgroundColor: '#1F1A12', marginVertical: 10 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  wishlistCard: { flexDirection: 'row', backgroundColor: '#1F1A12', borderRadius: 10, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#332A1D' },
  wishlistImg: { width: 90, height: 90, borderRadius: 8, resizeMode: 'cover' },
  wishlistInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  wishlistTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', paddingRight: 10, flex: 1, marginBottom: 10 },
  wishlistPrice: { color: '#F5B041', fontSize: 16, fontWeight: 'bold' },

  sectionDivider: { height: 1, backgroundColor: '#1F1A12', marginVertical: 20 },
  sectionTitle: { color: '#F5B041', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
  
  recentScroll: { marginLeft: -5 },
  recentCard: { width: 140, marginHorizontal: 5 },
  recentImgContainer: { width: '100%', height: 140, backgroundColor: '#1F1A12', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  recentImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  recentTitle: { color: 'white', fontSize: 10, marginBottom: 2 },
  recentPrice: { color: '#F5B041', fontSize: 12, fontWeight: 'bold' },
});
