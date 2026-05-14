import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { firestore, database } from '../config/firebase';

const { width } = Dimensions.get('window');

export default function ContactScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [contactData, setContactData] = useState({
    address: "C.K.20/8 Magala Bhawan Thatheri Bazar Chowk Varanasi",
    phone: "8726913625",
    email: "omornament2@gmail.com"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const contactRef = database().ref('data/contact');
    contactRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setContactData({
          address: data.address || contactData.address,
          phone: data.phone || contactData.phone,
          email: data.email || contactData.email
        });
      }
      setIsLoading(false);
    });
    return () => contactRef.off();
  }, []);

  const handleSendInquiry = async () => {
    if(!name || !email || !message) return Alert.alert("Inquiry", "Please fill all fields");
    setIsSending(true);
    try {
      await firestore().collection('enquiries').add({
        to: contactData.email,
        message: {
          subject: `New Inquiry from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage: ${message}`,
        },
        name,
        email,
        timestamp: firestore.FieldValue.serverTimestamp()
      });
      Alert.alert("Success", "Your inquiry has been sent successfully!");
      setName(''); setMessage(''); setEmail('');
    } catch(e) {
      Alert.alert("Error", "Failed to send inquiry: " + e.message);
    } finally {
      setIsSending(false);
    }
  };

  const openDialer = () => {
    Linking.openURL(`tel:+91${contactData.phone}`);
  };

  const openWhatsApp = () => {
    const url = `whatsapp://send?phone=+91${contactData.phone}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        return Linking.openURL(`https://wa.me/91${contactData.phone}`);
      }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F5B041" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>CONTACT US</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Map Section */}
          <View style={styles.mapContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ html: `
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameborder="0" 
                  style="border:0" 
                  src="https://www.google.com/maps/embed/v1/place?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(contactData.address)}" 
                  allowfullscreen>
                </iframe>
              ` }}
              style={styles.mapImage}
            />
            <View style={styles.mapOverlay}>
              <Ionicons name="location" size={24} color="#F5B041" style={{ marginRight: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.overlayTitle}>OFFICE ADDRESS</Text>
                <Text style={styles.overlayText} numberOfLines={2}>{contactData.address}</Text>
              </View>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('Gst')}>
              <Ionicons name="calculator-outline" size={28} color="#F5B041" />
              <Text style={styles.actionText}>GST Calc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('Bank')}>
              <Ionicons name="business-outline" size={28} color="#F5B041" />
              <Text style={styles.actionText}>Bank</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBox} onPress={openDialer}>
              <Ionicons name="call-outline" size={28} color="#F5B041" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBox} onPress={openWhatsApp}>
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.contactInfoBox}>
            <TouchableOpacity style={styles.infoRow} onPress={openDialer}>
              <Ionicons name="call" size={20} color="#F5B041" />
              <Text style={styles.infoText}>+91 {contactData.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(`mailto:${contactData.email}`)}>
              <Ionicons name="mail" size={20} color="#F5B041" />
              <Text style={styles.infoText}>{contactData.email}</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formHeader}>Send an Inquiry</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#9C9281" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9C9281" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Message" placeholderTextColor="#9C9281" multiline numberOfLines={4} value={message} onChangeText={setMessage} />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendInquiry} disabled={isSending}>
              {isSending ? <ActivityIndicator color="black" /> : <Text style={styles.sendBtnText}>SEND MESSAGE</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#110F0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  mapContainer: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginVertical: 15, borderWidth: 1, borderColor: '#332A1D' },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(31, 26, 18, 0.9)', padding: 15, flexDirection: 'row', alignItems: 'center' },
  overlayTitle: { color: '#F5B041', fontSize: 10, fontWeight: 'bold' },
  overlayText: { color: 'white', fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  actionBox: { width: (width - 70) / 4, backgroundColor: '#1F1A12', borderRadius: 12, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#332A1D' },
  actionText: { color: 'white', fontSize: 9, fontWeight: 'bold', marginTop: 8 },
  contactInfoBox: { backgroundColor: '#1F1A12', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#332A1D' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { color: 'white', fontSize: 14, marginLeft: 15 },
  formContainer: { backgroundColor: '#1F1A12', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#332A1D' },
  formHeader: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#110F0A', borderRadius: 8, padding: 15, color: 'white', fontSize: 14, marginBottom: 15, borderWidth: 1, borderColor: '#332A1D' },
  textArea: { height: 100, textAlignVertical: 'top' },
  sendBtn: { backgroundColor: '#F5B041', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  sendBtnText: { color: 'black', fontWeight: 'bold' },
});
