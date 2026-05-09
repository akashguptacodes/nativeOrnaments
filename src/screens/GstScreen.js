import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ImageBackground, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GstScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [customGst, setCustomGst] = useState('');
  const [gstPercentage, setGstPercentage] = useState(18);

  const calculateResults = () => {
    const amt = parseFloat(amount) || 0;
    const rate = customGst !== '' ? parseFloat(customGst) || gstPercentage : gstPercentage;
    const gstAmt = (amt * rate) / 100;
    const totalAmt = amt + gstAmt;
    return { gstAmt, totalAmt };
  };

  const { gstAmt, totalAmt } = calculateResults();

  const rates = [5, 12, 18, 28];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#272626' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{color: 'white', fontSize: 24}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GST Calculator</Text>
      </View>

      <ImageBackground source={require('../assets/image/background.png')} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.card}>
            <Text style={styles.title}>Enter Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="gray"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Select GST Rate</Text>
            <View style={styles.chipsContainer}>
              {rates.map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.chip, gstPercentage === rate && customGst === '' ? styles.chipSelected : null]}
                  onPress={() => {
                    setGstPercentage(rate);
                    setCustomGst('');
                  }}
                >
                  <Text style={[styles.chipText, gstPercentage === rate && customGst === '' ? styles.chipTextSelected : null]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Custom GST (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Custom GST"
              placeholderTextColor="gray"
              keyboardType="numeric"
              value={customGst}
              onChangeText={setCustomGst}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Calculation Result</Text>
            <Text style={styles.resultText}>GST Amount: ₹{gstAmt.toFixed(2)}</Text>
            <Text style={styles.totalText}>Total Amount: ₹{totalAmt.toFixed(2)}</Text>
          </View>

        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 60, backgroundColor: 'black', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  background: { flex: 1, resizeMode: 'cover' },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 5,
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowOffset: { width: 5, height: 5 },
  },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: 'black',
  },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  chipText: { fontSize: 16, color: 'black' },
  chipTextSelected: { color: 'white' },
  resultText: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  totalText: { fontSize: 18, fontWeight: 'bold', color: 'green' },
});
