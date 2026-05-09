import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity, FlatList, ActivityIndicator, Modal } from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RingScreen({ route, navigation }) {
  const { category } = route.params;
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchImages();
  }, [category]);

  const fetchImages = async () => {
    try {
      const dbRef = ref(database, `assetimage/${category}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        let urls = [];
        if (Array.isArray(data)) {
          urls = data.filter(item => typeof item === 'string');
        } else if (typeof data === 'object') {
          urls = Object.values(data).filter(item => typeof item === 'string');
        }
        setImages(urls);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.log('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openImage = (url) => {
    setSelectedImage(url);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openImage(item)}>
      <Image source={{ uri: item }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{color: 'white', fontSize: 24}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category} Collection</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D6B574" />
        </View>
      ) : images.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: 'white', fontSize: 16 }}>No images available for {category}</Text>
        </View>
      ) : (
        <ImageBackground source={require('../assets/image/background.png')} style={styles.background}>
          <FlatList
            data={images}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.columnWrapper}
          />
        </ImageBackground>
      )}

      {/* Full Screen Image Modal */}
      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
            <Text style={{color: 'white', fontSize: 24}}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 60, backgroundColor: 'black', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  background: { flex: 1, resizeMode: 'cover' },
  listContainer: { padding: 10 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 10 },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '48%',
    height: 200,
    elevation: 4,
    shadowColor: 'white',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
  fullImage: { width: '100%', height: '100%' },
});
