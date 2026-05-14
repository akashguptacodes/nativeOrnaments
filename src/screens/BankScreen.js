import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../config/firebase';

export default function BankScreen({ navigation }) {
  const [bank, setBank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bankRef = database().ref('data/contact/bank');
    bankRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        setBank(snapshot.val());
      }
      setIsLoading(false);
    });
    return () => bankRef.off();
  }, []);

  if (isLoading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#F5B041" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>BANK DETAILS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Our Registered Bank Account</Text>
        
        {bank ? (
          <View style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <Ionicons name="business" size={24} color="#F5B041" />
              <Text style={styles.bankName}>{bank.bankName || 'N/A'}</Text>
            </View>
            
            <DetailRow label="ACCOUNT NAME" value={bank.accountName} />
            <DetailRow label="ACCOUNT NUMBER" value={bank.accountNumber} />
            <DetailRow label="IFSC CODE" value={bank.ifsc} />
            <DetailRow label="BRANCH" value={bank.branch} />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Bank details not available.</Text>
          </View>
        )}

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#9C9281" />
          <Text style={styles.noteText}>Please share a screenshot of the transaction after successful payment.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || 'Not provided'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  subtitle: { color: '#9C9281', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  bankCard: { backgroundColor: '#1F1A12', padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#332A1D' },
  bankHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#332A1D', paddingBottom: 15, marginBottom: 15 },
  bankName: { color: '#F5B041', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  detailRow: { marginBottom: 15 },
  label: { color: '#9C9281', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  value: { color: 'white', fontSize: 16, fontWeight: '500' },
  noteContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  noteText: { color: '#9C9281', fontSize: 12, marginLeft: 10, fontStyle: 'italic', flex: 1 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9C9281' }
});
