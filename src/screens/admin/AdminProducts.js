import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { database } from '../../config/firebase';
import { uploadToCloudinary } from '../../utils/cloudinary';

export default function AdminProducts({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const [selectedCat, setSelectedCat] = useState(null);
  const [productName, setProductName] = useState('');
  const [productWeight, setProductWeight] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // 🔄 Fetch categories directly from 'assetimage' keys
    const dbRef = database().ref('assetimage');
    dbRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const catList = Object.keys(data).map(key => ({ id: key, name: key }));
        setCategories(catList);
      }
    });
    return () => dbRef.off();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      // Create an empty entry in 'assetimage' to initialize the category
      // We use a dummy child or just an empty object if possible, but Firebase 
      // usually removes empty nodes. We'll add a 'init': true flag.
      await database().ref(`assetimage/${newCatName.trim()}`).update({ _initialized: true });
      setNewCatName('');
      setShowAddCat(false);
      Alert.alert("Success", "Category created in assetimage!");
    } catch (e) { Alert.alert("Error", e.message); }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setProductImage(result.assets[0].uri);
  };

  const handleAddProduct = async () => {
    if (!selectedCat || !productName || !productWeight || !productImage) {
      return Alert.alert("Error", "Please fill all fields and select an image");
    }
    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(productImage);
      
      // 🚀 Save product directly under 'assetimage/[CategoryName]'
      await database().ref(`assetimage/${selectedCat.name}`).push({
        name: productName.trim(),
        weight: productWeight.trim(),
        image: imageUrl,
        createdAt: Date.now()
      });

      setProductName(''); setProductWeight(''); setProductImage(null);
      Alert.alert("Success", "Product added to assetimage!");
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setIsUploading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>MANAGE ASSETIMAGE</Text>
        <TouchableOpacity style={styles.addCatBtn} onPress={() => setShowAddCat(true)}>
          <Text style={styles.addCatBtnText}>ADD CATEGORY</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>1. SELECT CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catBtn, selectedCat?.id === cat.id && styles.catBtnActive]}
                onPress={() => setSelectedCat(cat)}
              >
                <Text style={[styles.catBtnText, selectedCat?.id === cat.id && styles.catBtnTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>2. PRODUCT DETAILS</Text>
          <View style={styles.formCard}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {productImage ? <Image source={{ uri: productImage }} style={styles.pickedImage} /> : (
                <View style={styles.pickerPlaceholder}><Ionicons name="camera" size={40} color="#332A1D" /><Text style={styles.pickerText}>Upload Image</Text></View>
              )}
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Product Name" placeholderTextColor="#9C9281" value={productName} onChangeText={setProductName} />
            <View style={styles.weightRow}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Weight" placeholderTextColor="#9C9281" keyboardType="numeric" value={productWeight} onChangeText={setProductWeight} />
              <View style={styles.weightUnit}><Text style={styles.weightUnitText}>GRAMS</Text></View>
            </View>
            <TouchableOpacity style={[styles.submitBtn, isUploading && { opacity: 0.7 }]} onPress={handleAddProduct} disabled={isUploading}>
              {isUploading ? <ActivityIndicator color="black" /> : <Text style={styles.submitBtnText}>ADD TO {selectedCat?.name || 'CATEGORY'}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showAddCat} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Category</Text>
                <TextInput style={styles.modalInput} placeholder="e.g. Bali" placeholderTextColor="#9C9281" value={newCatName} onChangeText={setNewCatName} autoFocus />
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#332A1D' }]} onPress={() => setShowAddCat(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F5B041' }]} onPress={handleAddCategory}><Text style={[styles.modalBtnText, { color: 'black' }]}>Add</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#1F1A12' },
  headerTitle: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  addCatBtn: { backgroundColor: '#F5B041', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addCatBtnText: { color: 'black', fontSize: 10, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  sectionTitle: { color: '#9C9281', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
  catScroll: { flexDirection: 'row', marginBottom: 10 },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1F1A12', marginRight: 10, borderWidth: 1, borderColor: '#332A1D' },
  catBtnActive: { backgroundColor: '#F5B041', borderColor: '#F5B041' },
  catBtnText: { color: 'white', fontSize: 14 },
  catBtnTextActive: { color: 'black', fontWeight: 'bold' },
  formCard: { backgroundColor: '#1F1A12', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#332A1D' },
  imagePicker: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#110F0A', borderStyle: 'dashed', borderWidth: 2, borderColor: '#332A1D', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  pickerPlaceholder: { alignItems: 'center' },
  pickerText: { color: '#9C9281', marginTop: 10, fontSize: 12 },
  input: { backgroundColor: '#110F0A', borderRadius: 8, padding: 15, color: 'white', fontSize: 14, marginBottom: 15, borderWidth: 1, borderColor: '#332A1D' },
  weightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  weightUnit: { backgroundColor: '#332A1D', height: 50, paddingHorizontal: 15, justifyContent: 'center', borderTopRightRadius: 8, borderBottomRightRadius: 8, marginLeft: -5 },
  weightUnitText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#F5B041', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: 'black', fontWeight: 'bold', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  modalContent: { backgroundColor: '#1F1A12', borderRadius: 15, padding: 25, width: '100%', borderWidth: 1, borderColor: '#332A1D' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  modalInput: { backgroundColor: '#110F0A', borderRadius: 8, padding: 15, color: 'white', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginLeft: 10 },
  modalBtnText: { color: 'white', fontWeight: 'bold' },
});
