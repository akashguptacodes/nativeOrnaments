import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, ScrollView } from 'react-native';

export default function BankScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground source={require('../assets/image/background.png')} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.card}>
            <Text style={styles.title}>Payment Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>A/c No:</Text>
              <Text style={styles.value}>99908726913625</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Bank:</Text>
              <Text style={styles.value}>HDFC BANK LTD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>IFSC CODE:</Text>
              <Text style={styles.value}>HDFC0009136</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Area:</Text>
              <Text style={styles.value}>BHULANA VARANASI</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Image source={require('../assets/image/qr.jpg')} style={styles.qrImage} />
            <Text style={[styles.title, { marginTop: 10 }]}>Payment QR</Text>
          </View>

        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#272626' },
  background: { flex: 1, resizeMode: 'cover' },
  scrollContent: { padding: 20, alignItems: 'center' },
  card: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 5,
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowOffset: { width: 5, height: 5 },
    alignItems: 'center',
  },
  title: { fontWeight: 'bold', fontSize: 24, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 5 },
  label: { fontSize: 16, fontWeight: 'bold' },
  value: { fontSize: 16 },
  qrImage: { width: 250, height: 250, resizeMode: 'cover' },
});
