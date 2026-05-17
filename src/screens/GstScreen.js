import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ImageBackground, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function GstScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [gstRate, setGstRate] = useState('3'); // Default 3% for jewelry
  const [result, setResult] = useState(null);

  const calculateGst = () => {
    const amt = parseFloat(amount);
    const rate = parseFloat(gstRate);
    if (isNaN(amt) || isNaN(rate)) return;

    const gstAmount = (amt * rate) / 100;
    const totalAmount = amt + gstAmount;

    setResult({
      original: amt.toFixed(2),
      gst: gstAmount.toFixed(2),
      total: totalAmount.toFixed(2)
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GST CALCULATOR</Text>
        <View style={{ width: 24 }} />
      </View>

      <ImageBackground source={require('../assets/image/background.png')} style={styles.background}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.label}>NET AMOUNT (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Amount"
                placeholderTextColor="#9C9281"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.label}>GST RATE (%)</Text>
              <View style={styles.rateRow}>
                {['3', '5', '12', '18'].map(rate => (
                  <TouchableOpacity 
                    key={rate} 
                    style={[styles.rateBtn, gstRate === rate && styles.rateBtnActive]}
                    onPress={() => setGstRate(rate)}
                  >
                    <Text style={[styles.rateBtnText, gstRate === rate && styles.rateBtnTextActive]}>{rate}%</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.calcBtn} onPress={calculateGst}>
                <Text style={styles.calcBtnText}>CALCULATE</Text>
              </TouchableOpacity>

              {result && (
                <View style={styles.resultContainer}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Base Amount:</Text>
                    <Text style={styles.resultValue}>₹{result.original}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>GST ({gstRate}%):</Text>
                    <Text style={styles.resultValue}>+ ₹{result.gst}</Text>
                  </View>
                  <View style={[styles.resultRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalValue}>₹{result.total}</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, backgroundColor: '#110F0A' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  background: { flex: 1, resizeMode: 'cover' },
  scrollContent: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: 'rgba(31, 26, 18, 0.9)', padding: 25, borderRadius: 15, borderWidth: 1, borderColor: '#F5B041' },
  label: { color: '#F5B041', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: '#110F0A', borderRadius: 8, padding: 15, color: 'white', fontSize: 18, marginBottom: 20, borderWidth: 1, borderColor: '#332A1D' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  rateBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5, borderWidth: 1, borderColor: '#332A1D', width: '22%', alignItems: 'center' },
  rateBtnActive: { backgroundColor: '#F5B041', borderColor: '#F5B041' },
  rateBtnText: { color: '#9C9281', fontWeight: 'bold' },
  rateBtnTextActive: { color: 'black' },
  calcBtn: { backgroundColor: '#F5B041', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  calcBtnText: { color: 'black', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  resultContainer: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#332A1D', paddingTop: 20 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultLabel: { color: '#9C9281', fontSize: 14 },
  resultValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#332A1D' },
  totalLabel: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  totalValue: { color: '#F5B041', fontSize: 22, fontWeight: 'bold' },
});
