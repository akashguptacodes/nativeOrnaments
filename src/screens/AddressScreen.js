import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity, ScrollView, Linking } from 'react-native';

export default function AddressScreen() {
  const latitude = 25.314061;
  const longitude = 83.011670;
  const phoneNumber = "8765432109";
  const phoneNumber2 = "7052748889";

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const makePhoneCall = (number) => {
    const url = `tel:${number}`;
    Linking.openURL(url).catch(err => console.error("Couldn't open dial pad", err));
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../assets/image/background.png')} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.card}>
            <Text style={styles.title}>Address</Text>
            <TouchableOpacity onPress={openMaps}>
              <Image source={require('../assets/image/map.jpg')} style={styles.mapImage} />
            </TouchableOpacity>
            <Text style={styles.text}>
              📍 C.K.20/8 Magala Bhawan (Sarda ji Katra Dosa wale Ground floor Thatheri bazar Chowk Varanasi)
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Contact</Text>
            
            <Text style={styles.name}>Amit Verma</Text>
            <TouchableOpacity onPress={() => makePhoneCall(phoneNumber)} style={styles.phoneRow}>
              <Text style={styles.phoneIcon}>📞</Text>
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>
            </TouchableOpacity>

            <Text style={[styles.name, {marginTop: 15}]}>Harsh Verma</Text>
            <TouchableOpacity onPress={() => makePhoneCall(phoneNumber2)} style={styles.phoneRow}>
              <Text style={styles.phoneIcon}>📞</Text>
              <Text style={styles.phoneNumber}>{phoneNumber2}</Text>
            </TouchableOpacity>
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
  mapImage: { width: 280, height: 120, borderRadius: 10, borderWidth: 1, marginBottom: 15 },
  text: { fontSize: 16, textAlign: 'center', color: 'black' },
  name: { fontWeight: 'bold', fontSize: 20, marginBottom: 5 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  phoneIcon: { fontSize: 20, marginRight: 10 },
  phoneNumber: { fontSize: 18, fontWeight: 'bold', textDecorationLine: 'underline', color: 'black' },
});
