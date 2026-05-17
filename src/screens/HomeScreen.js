import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ImageBackground, FlatList, useWindowDimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database, auth } from '../config/firebase';
import SideMenu from '../components/SideMenu';

const BANNERS = [
  { id: '1', img: { uri: 'https://res.cloudinary.com/dhvsickga/image/upload/v1743499679/omornamentasset/Haar/ane0psszhxsolspgypba.jpg' }, title: 'Luxurious Haar', subtitle: 'Royal Collection' },
  { id: '2', img: { uri: 'https://res.cloudinary.com/dhvsickga/image/upload/v1747205159/omornamentasset/Kada/defu464ep7wh0z0tjbgw.jpg' }, title: 'Elegant Bangles', subtitle: 'Diamond Filigree' },
  { id: '3', img: { uri: 'https://res.cloudinary.com/dhvsickga/image/upload/v1743232256/omornamentasset/Ring/shfy9g49opgrm6tsx2wk.jpg' }, title: 'Classic Rings', subtitle: 'Timeless Beauty' },
  { id: '4', img: { uri: 'https://res.cloudinary.com/dhvsickga/image/upload/v1746445959/omornamentasset/Mang%20Tika/hgb72j1inttqek4apzft.jpg' }, title: 'Exquisite Mangtika', subtitle: 'Bridal Essentials' },
];

export default function HomeScreen({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();
  // Cap the carousel width for better tablet support while maintaining 1:1 ratio
  const carouselWidth = screenWidth > 600 ? 600 : screenWidth;
  const bannerWidth = carouselWidth - 40;

  const [banners, setBanners] = useState(BANNERS);
  const [rates, setRates] = useState({ goldApi: '...', silverApi: '...', rtgsRate: '...', silverBatiya: '...', numberRate: '...', breadRate: '...' });
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [activeBanner, setActiveBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  const fetchLiveRates = async () => {
    const apiKey = process.env.EXPO_PUBLIC_GOLD_API_KEY;
    if (!apiKey) return;
    try {
      const headers = { 'x-access-token': apiKey, 'Content-Type': 'application/json' };
      const goldRes = await fetch('https://www.goldapi.io/api/XAU/INR', { headers });
      const goldData = await goldRes.json();
      const goldPerGram = goldData.price_gram_24k ? goldData.price_gram_24k.toFixed(2) : '...';

      const silverRes = await fetch('https://www.goldapi.io/api/XAG/INR', { headers });
      const silverData = await silverRes.json();
      const silverPerGram = silverData.price_gram_24k ? silverData.price_gram_24k.toFixed(2) : '...';

      setRates(prev => ({ ...prev, goldApi: goldPerGram, silverApi: silverPerGram }));
    } catch (err) {
      console.log("Error fetching live rates:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLiveRates();
    // Re-triggering listeners isn't strictly necessary since they are real-time,
    // but we can do it to ensure everything is perfectly in sync.
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    // Fetch Categories
    const catRef = database().ref('assetimage');
    catRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const catList = Object.keys(data).filter(k => k !== '_initialized').map(name => {
          const content = data[name];
          let firstImg = null;
          if (Array.isArray(content) && content.length > 0) firstImg = content[0];
          else if (typeof content === 'object') {
            const firstKey = Object.keys(content).find(k => k !== '_initialized');
            if (firstKey) {
              const item = content[firstKey];
              firstImg = typeof item === 'object' ? item.image : item;
            }
          }
          return {
            id: name,
            name: name,
            img: firstImg ? { uri: firstImg } : BANNERS[0].img
          };
        });
        setCategories(catList);
      }
    });

    // Fetch Dynamic Banners
    const bannerRef = database().ref('data/carousel');
    bannerRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const bannerList = (Array.isArray(data) ? data : Object.values(data)).filter(item => item && item.img);
        if (bannerList.length > 0) {
          setBanners(bannerList.map((item, i) => ({ 
            id: item.id || item.createdAt?.toString() || item.img || `dyn_${i}`, 
            img: { uri: item.img }, 
            title: item.title || 'Latest Piece', 
            subtitle: item.subtitle || 'Exclusive Collection' 
          })));
        } else {
          setBanners(BANNERS);
        }
      } else {
        setBanners(BANNERS);
      }
    });
    // Fetch Rates
    const dbRef = database().ref('data/rates');
    const onRatesChange = (snapshot) => {
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
    };
    dbRef.on('value', onRatesChange);

    fetchLiveRates();

    // Fetch Featured Items from assetimage
    const imgRef = database().ref('assetimage');
    const onFeaturedChange = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let allFeatured = [];
        Object.keys(data).forEach(cat => {
          if (cat === '_initialized') return;
          const content = data[cat];
          if (Array.isArray(content)) {
            content.forEach((url, i) => {
              if (typeof url === 'string') allFeatured.push({ id: `feat_${cat}_${i}`, img: { uri: url }, title: `${cat} Design` });
            });
          } else if (typeof content === 'object') {
            Object.entries(content).forEach(([id, item]) => {
              if (id === '_initialized') return;
              if (typeof item === 'object' && item.image) {
                allFeatured.push({ id, img: { uri: item.image }, title: item.name || `${cat} Design` });
              } else if (typeof item === 'string') {
                allFeatured.push({ id: `feat_${cat}_${id}`, img: { uri: item }, title: `${cat} Design` });
              }
            });
          }
        });
        setFeatured(allFeatured.sort(() => 0.5 - Math.random()).slice(0, 10));
      } else {
        setFeatured([]);
      }
    };
    imgRef.on('value', onFeaturedChange);

    // Wishlist Listener
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
      catRef.off('value');
      bannerRef.off('value');
      dbRef.off('value', onRatesChange);
      imgRef.off('value', onFeaturedChange);
      if (wishRef && unsubWish) wishRef.off('value', unsubWish);
    };
  }, []);

  // Auto-scroll Carousel - Separate effect to handle dynamic banners and avoid crashes
  useEffect(() => {
    if (banners.length <= 1) return;

    const carouselTimer = setInterval(() => {
      setActiveBanner((prev) => {
        const nextIndex = (prev + 1) % banners.length;
        try {
          flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        } catch (e) {
          console.log("Carousel scroll error:", e);
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(carouselTimer);
  }, [banners]);

  const renderBanner = ({ item }) => (
    <ImageBackground 
      source={item.img} 
      style={[styles.heroBanner, { width: bannerWidth, height: bannerWidth, marginHorizontal: (screenWidth - bannerWidth) / 2 }]} 
      imageStyle={{ borderRadius: 10 }}
      resizeMode="cover"
    >
      <View style={styles.heroOverlay}>
        <View style={styles.newCollectionBadge}>
          <Text style={styles.newCollectionText}>NEW COLLECTION</Text>
        </View>
        <Text style={[styles.heroTitle, { fontSize: carouselWidth * 0.065 }]}>{item.title}</Text>
        <Text style={[styles.heroTitleHighlight, { fontSize: carouselWidth * 0.055 }]}>{item.subtitle}</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('SHOP')}>
          <Text style={styles.exploreBtnText}>Explore Now</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Image source={require('../../assets/logo_om.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>OM ORNAMENTS</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SHOP')} style={styles.searchBtn}>
          <Ionicons name="search" size={24} color="#F5B041" />
        </TouchableOpacity>
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
        
        {/* Carousel Banner */}
        <View style={[styles.carouselContainer, { width: screenWidth, height: bannerWidth + 20 }]}>
          <FlatList
            key={banners.length}
            ref={flatListRef}
            data={banners}
            renderItem={renderBanner}
            keyExtractor={(item) => item.id}
            extraData={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveBanner(index);
            }}
          />
          <View style={styles.pagination}>
            {banners.map((_, i) => (
              <View key={i} style={[styles.paginationDot, activeBanner === i && styles.paginationDotActive]} />
            ))}
          </View>
        </View>

        {/* Live Market Rates */}
        <View style={styles.ratesGrid}>
          <RateCard name="NUMBER RATE" rate="99.99" price={`₹${rates.numberRate}`} unit="/10g" change="" isUp={true} />
          <RateCard name="BREAD RATE" rate="99.50" price={`₹${rates.breadRate}`} unit="/10g" change="" isUp={true} />
          <RateCard name="RTGS RATE" rate="99.50" price={`₹${rates.rtgsRate}`} unit="/10g" change="" isUp={true} />
          <RateCard name="SILVER BATIYA" rate="99.99" price={`₹${rates.silverBatiya}`} unit="/kg" change="" isUp={false} />

          <View style={styles.miniHeadingContainer}>
            <Text style={styles.miniHeading}>LIVE MARKET RATES</Text>
          </View>

          <RateCard name="LIVE GOLD" rate="(24K)" price={`₹${rates.goldApi}`} unit="/10g" change="Live" isUp={true} />
          <RateCard name="LIVE SILVER" rate="" price={`₹${rates.silverApi}`} unit="/10g" change="Live" isUp={true} />
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

const RateCard = ({ name, rate, price, unit, change, isUp }) => (
  <View style={styles.rateCard}>
    <Text style={styles.rateTitle}>{name}</Text>
    <Text style={styles.rateSubtitle}>{rate}</Text>
    <Text style={styles.ratePrice}>{price} <Text style={{fontSize: 10, color: '#9C9281'}}>{unit}</Text></Text>
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
      <TouchableOpacity style={[styles.heartBtn, isLiked && { backgroundColor: '#F5B041' }]} onPress={onLike}>
        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "black" : "white"} />
      </TouchableOpacity>
    </View>
    <Text style={styles.featuredTitle} numberOfLines={1}>{title}</Text>
  </View>
);

const viewItem = async (item) => {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  try {
    await database().ref(`recentViews/${uid}/${item.id}`).set({ ...item, viewedAt: Date.now() });
  } catch (e) { console.log('Error tracking view:', e); }
};

const toggleLike = async (item, isLiked) => {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  const itemRef = database().ref(`wishlist/${uid}/${item.id}`);
  try {
    if (isLiked) await itemRef.remove();
    else await itemRef.set({ ...item, savedAt: Date.now() });
  } catch (error) { console.log('Error wishlist:', error); }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#1F1A12' },
  menuBtn: { position: 'absolute', left: 20 },
  searchBtn: { position: 'absolute', right: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 42, height: 42, marginRight: 8, resizeMode: 'contain' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { paddingBottom: 30 },
  
  carouselContainer: { marginTop: 10 },
  heroBanner: { justifyContent: 'flex-end', overflow: 'hidden' },
  heroOverlay: { padding: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10 },
  newCollectionBadge: { backgroundColor: '#F5B041', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 10 },
  newCollectionText: { fontSize: 10, fontWeight: 'bold', color: 'black' },
  heroTitle: { color: 'white', fontWeight: 'bold' },
  heroTitleHighlight: { color: '#F5B041', fontWeight: '300', marginBottom: 15 },
  exploreBtn: { borderWidth: 1, borderColor: '#F5B041', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(31, 26, 18, 0.8)' },
  exploreBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  pagination: { flexDirection: 'row', position: 'absolute', bottom: 20, alignSelf: 'center' },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  paginationDotActive: { backgroundColor: '#F5B041', width: 12 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15, paddingHorizontal: 20 },
  sectionTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  viewAllText: { color: '#F5B041', fontSize: 12, fontWeight: 'bold' },

  ratesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 20 },
  rateCard: { width: '48%', backgroundColor: '#1F1A12', borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#332A1D' },
  rateTitle: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  rateSubtitle: { color: '#9C9281', fontSize: 10, marginBottom: 5 },
  ratePrice: { color: '#F5B041', fontSize: 18, fontWeight: 'bold' },
  rateChange: { fontSize: 10, marginLeft: 2 },

  miniHeadingContainer: { width: '100%', marginTop: 5, marginBottom: 15 },
  miniHeading: { color: '#F5B041', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  categoryScroll: { paddingLeft: 20 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#332A1D', marginBottom: 10 },
  categoryName: { color: 'white', fontSize: 9, fontWeight: 'bold' },

  featuredGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  featuredCard: { width: '48%' },
  featuredImgContainer: { width: '100%', height: 180, backgroundColor: '#1F1A12', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  featuredImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
  featuredTitle: { color: 'white', fontSize: 12, marginBottom: 5 },
});
