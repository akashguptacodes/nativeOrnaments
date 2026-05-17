import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../config/firebase';

export default function AdminContact({ navigation }) {
  const [contact, setContact] = useState({
    address: '',
    phone: '',
    email: '',
    bank: {
      accountName: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      bankName: ''
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dbRef = database().ref('data/contact');
    dbRef.once('value').then(snapshot => {
      if (snapshot.exists()) setContact(snapshot.val());
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await database().ref('data/contact').set(contact);
      Alert.alert("Success", "Business information updated!");
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#F5B041" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>BUSINESS & BANK</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>GENERAL CONTACT</Text>
          <View style={styles.formCard}>
            <AdminInput label="OFFICE ADDRESS" value={contact.address} onChangeText={(v) => setContact({...contact, address: v})} />
            <AdminInput label="BUSINESS PHONE" value={contact.phone} onChangeText={(v) => setContact({...contact, phone: v})} />
            <AdminInput label="BUSINESS EMAIL" value={contact.email} onChangeText={(v) => setContact({...contact, email: v})} />
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 30 }]}>BANKING DETAILS</Text>
          <View style={styles.formCard}>
            <AdminInput label="ACCOUNT HOLDER NAME" value={contact.bank.accountName} onChangeText={(v) => setContact({...contact, bank: {...contact.bank, accountName: v}})} />
            <AdminInput label="ACCOUNT NUMBER" value={contact.bank.accountNumber} onChangeText={(v) => setContact({...contact, bank: {...contact.bank, accountNumber: v}})} />
            <AdminInput label="IFSC CODE" value={contact.bank.ifsc} onChangeText={(v) => setContact({...contact, bank: {...contact.bank, ifsc: v}})} />
            <AdminInput label="BANK NAME" value={contact.bank.bankName} onChangeText={(v) => setContact({...contact, bank: {...contact.bank, bankName: v}})} />
            <AdminInput label="BRANCH" value={contact.bank.branch} onChangeText={(v) => setContact({...contact, bank: {...contact.bank, branch: v}})} />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="black" /> : <Text style={styles.saveBtnText}>SAVE ALL DETAILS</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const AdminInput = ({ label, value, onChangeText }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholderTextColor="#9C9281" />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#1F1A12' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  sectionHeader: { color: '#F5B041', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  formCard: { backgroundColor: '#1F1A12', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#332A1D' },
  inputGroup: { marginBottom: 15 },
  label: { color: '#9C9281', fontSize: 10, marginBottom: 5 },
  input: { backgroundColor: '#110F0A', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, borderWidth: 1, borderColor: '#332A1D' },
  saveBtn: { backgroundColor: '#F5B041', paddingVertical: 18, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  saveBtnText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
});
