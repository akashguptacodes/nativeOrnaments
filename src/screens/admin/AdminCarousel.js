import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { database } from '../../config/firebase';
import { uploadToCloudinary } from '../../utils/cloudinary';

const { width } = Dimensions.get('window');

export default function AdminCarousel({ navigation }) {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    const dbRef = database().ref('data/carousel');
    dbRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setBanners(Array.isArray(data) ? data : Object.values(data));
      }
      setIsLoading(false);
    });
    return () => dbRef.off();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setNewImage(result.assets[0].uri);
  };

  const handleSaveBanner = async () => {
    if (!newImage || !newTitle) {
      return Alert.alert("Error", "Please select an image and enter a title");
    }
    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(newImage);
      const newBannerObj = {
        img: imageUrl,
        title: newTitle.trim(),
        subtitle: newSubtitle.trim(),
        createdAt: Date.now()
      };
      const updatedBanners = [...banners, newBannerObj];
      await database().ref('data/carousel').set(updatedBanners);
      
      // Reset
      setNewImage(null); setNewTitle(''); setNewSubtitle('');
      setShowAddModal(false);
      Alert.alert("Success", "Banner added successfully!");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeBanner = async (index) => {
    Alert.alert("Remove", "Delete this banner?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const updated = banners.filter((_, i) => i !== index);
        await database().ref('data/carousel').set(updated);
      }}
    ]);
  };

  if (isLoading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#F5B041" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>HOME CAROUSEL</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}><Ionicons name="add-circle" size={28} color="#F5B041" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionDesc}>Manage your promotional banners and taglines.</Text>
        {banners.map((item, index) => (
          <View key={index} style={styles.bannerCard}>
            <Image source={{ uri: item.img }} style={styles.bannerImage} />
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.bannerSub}>{item.subtitle}</Text>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeBanner(index)}>
              <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Add Banner Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Banner</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><Ionicons name="close" size={24} color="white" /></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.picker} onPress={pickImage}>
              {newImage ? <Image source={{ uri: newImage }} style={styles.pickedImg} /> : (
                <View style={{ alignItems: 'center' }}><Ionicons name="camera" size={40} color="#332A1D" /><Text style={styles.pickerText}>Select Banner Image (16:9)</Text></View>
              )}
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="Main Title (e.g. Luxurious Haar)" placeholderTextColor="#9C9281" value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={styles.input} placeholder="Subtitle (e.g. Royal Collection)" placeholderTextColor="#9C9281" value={newSubtitle} onChangeText={setNewSubtitle} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBanner} disabled={isUploading}>
              {isUploading ? <ActivityIndicator color="black" /> : <Text style={styles.saveBtnText}>UPLOAD BANNER</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#1F1A12' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  sectionDesc: { color: '#9C9281', fontSize: 14, marginBottom: 20 },
  bannerCard: { width: '100%', height: 250, borderRadius: 15, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#332A1D', backgroundColor: '#1F1A12' },
  bannerImage: { width: '100%', height: 180, resizeMode: 'cover' },
  bannerInfo: { padding: 12 },
  bannerTitle: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  bannerSub: { color: '#F5B041', fontSize: 11 },
  removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(239, 68, 68, 0.8)', padding: 8, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1F1A12', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, borderWidth: 1, borderColor: '#332A1D' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  picker: { width: '100%', height: 180, backgroundColor: '#110F0A', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#332A1D', overflow: 'hidden' },
  pickedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  pickerText: { color: '#9C9281', marginTop: 10, fontSize: 12 },
  input: { backgroundColor: '#110F0A', borderRadius: 10, padding: 15, color: 'white', marginBottom: 15, borderWidth: 1, borderColor: '#332A1D' },
  saveBtn: { backgroundColor: '#F5B041', paddingVertical: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});
