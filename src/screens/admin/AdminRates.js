import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../config/firebase';

export default function AdminRates({ navigation }) {
  const [rates, setRates] = useState({
    'नंबर Rate': '',
    'ब्रेड Rate': '',
    'RTGS Rate': '',
    'चांदी बटिया Rate': ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dbRef = database().ref('data/rates');
    dbRef.once('value').then(snapshot => {
      if (snapshot.exists()) {
        setRates(snapshot.val());
      }
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await database().ref('data/rates').update(rates);
      Alert.alert("Success", "Market rates updated successfully!");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#F5B041" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MANAGE RATES</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionDesc}>Update the live market rates shown on the home screen.</Text>

        <RateInput label="NUMBER RATE (per 10g)" value={rates['नंबर Rate']} onChangeText={(v) => setRates({...rates, 'नंबर Rate': v})} />
        <RateInput label="BREAD RATE (per 10g)" value={rates['ब्रेड Rate']} onChangeText={(v) => setRates({...rates, 'ब्रेड Rate': v})} />
        <RateInput label="RTGS RATE (per 10g)" value={rates['RTGS Rate']} onChangeText={(v) => setRates({...rates, 'RTGS Rate': v})} />
        <RateInput label="SILVER BATIYA (per kg)" value={rates['चांदी बटिया Rate']} onChangeText={(v) => setRates({...rates, 'चांदी बटिया Rate': v})} />

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="black" /> : <Text style={styles.saveBtnText}>UPDATE RATES</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const RateInput = ({ label, value, onChangeText }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Text style={styles.currency}>₹</Text>
      <TextInput
        style={styles.input}
        value={value ? value.toString() : ''}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor="#9C9281"
      />
      <Text style={styles.unit}>{label.includes('kg') ? '/kg' : '/10g'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#1F1A12' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { padding: 20 },
  sectionDesc: { color: '#9C9281', fontSize: 14, marginBottom: 30 },
  inputGroup: { marginBottom: 25 },
  label: { color: '#F5B041', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1A12', borderRadius: 10, borderWidth: 1, borderColor: '#332A1D', paddingHorizontal: 15 },
  currency: { color: '#9C9281', fontSize: 18, marginRight: 10 },
  input: { flex: 1, height: 55, color: 'white', fontSize: 18, fontWeight: 'bold' },
  unit: { color: '#9C9281', fontSize: 14, marginLeft: 10 },
  saveBtn: { backgroundColor: '#F5B041', paddingVertical: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: 'black', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
