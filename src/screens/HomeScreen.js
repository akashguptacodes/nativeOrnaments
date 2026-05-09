import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, get, set, remove } from 'firebase/database';
import { database, auth } from '../config/firebase';
import SideMenu from '../components/SideMenu';

const { width } = Dimensions.get('window');



export default function HomeScreen({ navigation }) {
  const [rates, setRates] = useState({ gold24: '...', gold22: '...', gold18: '...', silver: '...' });
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    // Fetch Rates
    const dbRef = ref(database, 'data/rates');
    const unsubscribeRates = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRates(prev => ({
          ...prev,
          rtgsRate: data['RTGS Rate'] || '...',
          silverBatiya: data['चांदी बटिया Rate'] || '...',
          numberRate: data['नंबर Rate'] || '...',
          breadRate: data['ब्रेड Rate'] || '...'
        }));
      }
    });

    // Fetch Live API Rates (GoldAPI.io - requires API Key)
    const fetchLiveRates = async () => {
      const apiKey = process.env.EXPO_PUBLIC_GOLD_API_KEY;
      if (!apiKey) return;
      try {
        const headers = { 'x-access-token': apiKey, 'Content-Type': 'application/json' };
        
        // Fetch Gold
        const goldRes = await fetch('https://www.goldapi.io/api/XAU/INR', { headers });
        const goldData = await goldRes.json();
        const goldPerGram = goldData.price_gram_24k ? goldData.price_gram_24k.toFixed(2) : '...';

        // Fetch Silver
        const silverRes = await fetch('https://www.goldapi.io/api/XAG/INR', { headers });
        const silverData = await silverRes.json();
        const silverPerGram = silverData.price_gram_24k ? silverData.price_gram_24k.toFixed(2) : '...';

        setRates(prev => ({ ...prev, goldApi: goldPerGram, silverApi: silverPerGram }));
      } catch (err) {
        console.log("Error fetching live rates:", err);
      }
    };
    fetchLiveRates();

    // Fetch Images for Categories and Featured
    const imgRef = ref(database, 'assetimage');
    get(imgRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const keys = Object.keys(data);
        
        // Use all categories
        const finalCats = keys;
        
        const uiCategories = finalCats.map((key, index) => {
          const urls = Array.isArray(data[key]) ? data[key] : Object.values(data[key]);
          return {
            id: index,
            name: key,
            img: { uri: urls[0] } // First image as thumbnail
          };
        });
        setCategories(uiCategories);

        // Pick 2 random items for featured
        let allItems = [];
        keys.forEach(k => {
          const urls = Array.isArray(data[k]) ? data[k] : Object.values(data[k]);
          urls.forEach(url => {
            if(typeof url === 'string') allItems.push({ category: k, url });
          });
        });

        allItems = allItems.sort(() => Math.random() - 0.5);
        if (allItems.length >= 10) {
          const tenItems = allItems.slice(0, 10).map((item, idx) => ({
            id: `f${idx}`,
            title: `${item.category} ${idx + 1}`,
            img: { uri: item.url }
          }));
          setFeatured(tenItems);
        }
      }
    });

    // Listen to wishlist
    const uid = auth.currentUser?.uid;
    if (uid) {
      const wishRef = ref(database, `wishlist/${uid}`);
      const unsubWish = onValue(wishRef, (snapshot) => {
        if (snapshot.exists()) {
          setWishlistIds(new Set(Object.keys(snapshot.val())));
        } else {
          setWishlistIds(new Set());
        }
      });
      return () => {
        unsubscribeRates();
        unsubWish();
      };
    }

    return () => unsubscribeRates();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}><Ionicons name="menu" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>ADORNIA</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Banner */}
        <ImageBackground source={require('../assets/image/har.jpg')} style={styles.heroBanner} imageStyle={{ borderRadius: 10 }}>
          <View style={styles.heroOverlay}>
            <View style={styles.newCollectionBadge}>
              <Text style={styles.newCollectionText}>NEW COLLECTION</Text>
            </View>
            <Text style={styles.heroTitle}>Elevate Your</Text>
            <Text style={styles.heroTitleHighlight}>Radiance</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('SHOP')}>
              <Text style={styles.exploreBtnText}>Explore New Arrivals</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Live Market Rates */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LIVE MARKET RATES</Text>
          <View style={styles.liveIndicator}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE DATA</Text></View>
        </View>
        
        <View style={styles.ratesGrid}>
          {/* Row 1 */}
          <RateCard title="NUMBER RATE 99.99" price={`₹${rates.numberRate}`} change="" isUp={true} />
          <RateCard title="BREAD RATE 99.50" price={`₹${rates.breadRate}`} change="" isUp={true} />
          
          {/* Row 2 */}
          <RateCard title="RTGS RATE 99.50" price={`₹${rates.rtgsRate}`} change="" isUp={true} />
          <RateCard title="SILVER BATIYA RATE 99.99" price={`₹${rates.silverBatiya}`} change="" isUp={false} />

          {/* Row 3 */}
          <RateCard title="LIVE GOLD (24K)" price={`₹${rates.goldApi}`} change="Live" isUp={true} />
          <RateCard title="LIVE SILVER" price={`₹${rates.silverApi}`} change="Live" isUp={true} />
        </View>

        {/* Shop by Category */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => navigation.navigate('SHOP', { initialFilter: cat.name })}>
              <Image source={cat.img} style={styles.categoryImage} />
              <Text style={styles.categoryName}>{cat.name.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Pieces */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>FEATURED PIECES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Featured', { items: featured })}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.featuredGrid}>
          {featured.slice(0, 2).map(item => (
            <FeaturedCard 
              key={item.id} 
              title={item.title} 
              img={item.img} 
              onPress={() => viewItem(item)} 
              isLiked={wishlistIds.has(item.id)}
              onLike={() => toggleLike(item, wishlistIds.has(item.id))}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

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

const toggleLike = async (item, isLiked) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  
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

const RateCard = ({ title, price, change, isUp }) => (
  <View style={styles.rateCard}>
    <Text style={styles.rateTitle}>{title}</Text>
    <Text style={styles.ratePrice}>{price} <Text style={{fontSize: 12, color: '#9C9281'}}>/g</Text></Text>
    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
      <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={14} color={isUp ? '#22C55E' : '#EF4444'} />
      <Text style={[styles.rateChange, { color: isUp ? '#22C55E' : '#EF4444' }]}> {change}</Text>
    </View>
  </View>
);

const FeaturedCard = ({ title, img, onPress, isLiked, onLike }) => (
  <View style={styles.featuredCard}>
    <View style={styles.featuredImgContainer}>
      <TouchableOpacity onPress={onPress} style={{ width: '100%', height: '100%' }}>
        <Image source={img} style={styles.featuredImg} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.heartBtn, isLiked && { backgroundColor: '#F5B041' }]} 
        onPress={onLike}
      >
        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "black" : "white"} />
      </TouchableOpacity>
    </View>
    <Text style={styles.featuredTitle} numberOfLines={1}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  
  heroBanner: { width: '100%', height: 400, marginTop: 10, justifyContent: 'flex-end' },
  heroOverlay: { padding: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10 },
  newCollectionBadge: { backgroundColor: '#F5B041', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 10 },
  newCollectionText: { fontSize: 10, fontWeight: 'bold', color: 'black' },
  heroTitle: { fontSize: 28, color: 'white', fontWeight: '300' },
  heroTitleHighlight: { fontSize: 32, color: '#F5B041', fontWeight: 'bold', marginBottom: 15 },
  exploreBtn: { borderWidth: 1, borderColor: '#F5B041', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(31, 26, 18, 0.8)' },
  exploreBtnText: { color: 'white', fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15 },
  sectionTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 5 },
  liveText: { color: '#9C9281', fontSize: 10 },
  viewAllText: { color: '#F5B041', fontSize: 12, fontWeight: 'bold' },

  ratesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  rateCard: { width: '48%', backgroundColor: '#1F1A12', borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#332A1D' },
  rateTitle: { color: '#9C9281', fontSize: 10, marginBottom: 5 },
  ratePrice: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  rateChange: { fontSize: 12, marginLeft: 2 },

  categoryScroll: { marginLeft: -5 },
  categoryItem: { alignItems: 'center', marginHorizontal: 10 },
  categoryImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#332A1D', marginBottom: 10 },
  categoryName: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  featuredGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  featuredCard: { width: '48%' },
  featuredImgContainer: { width: '100%', height: 200, backgroundColor: '#1F1A12', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  featuredImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
  featuredTitle: { color: 'white', fontSize: 12, marginBottom: 5 },
  featuredPrice: { color: '#F5B041', fontSize: 14, fontWeight: 'bold' },
});
