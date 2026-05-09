import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, update } from 'firebase/database';
import { collection, addDoc } from 'firebase/firestore';
import { database, auth, firestore } from '../config/firebase';

export default function ContactScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editFirmName, setEditFirmName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      return;
    }

    const userRef = ref(database, `Users/${uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);
        setName(data['Firm Name'] || '');
        setEmail(data['Email'] || '');
        
        // Initialize edit states
        setEditFirmName(data['Firm Name'] || '');
        setEditAddress(data['Address'] || '');
        setEditContact(data['Contact'] || '');
        setEditEmail(data['Email'] || '');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>MY PROFILE</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#F5B041" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Map Section - Real Interactive Map */}
          <View style={styles.mapContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ html: `
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameborder="0" 
                  style="border:0" 
                  src="https://www.google.com/maps/embed/v1/place?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(userData?.Address || 'India')}" 
                  allowfullscreen>
                </iframe>
              ` }}
              style={styles.mapImage}
            />
            {/* If they don't have an API key, we can use a simple Search URL in the WebView instead */}
            {!userData?.Address && (
               <View style={[styles.mapImage, { backgroundColor: '#1F1A12', justifyContent: 'center', alignItems: 'center' }]}>
                 <Ionicons name="map-outline" size={40} color="#9C9281" />
                 <Text style={{ color: '#9C9281', marginTop: 10 }}>No Address Provided</Text>
               </View>
            )}
            <View style={styles.mapOverlay}>
              <Ionicons name="person-circle-outline" size={30} color="#F5B041" style={{ marginRight: 15 }} />
              <View>
                <Text style={styles.overlayTitle}>LOGGED IN AS</Text>
                <Text style={styles.overlayText}>{userData?.['Firm Name'] || 'Loading...'}</Text>
              </View>
            </View>
          </View>

          {/* User Info Cards / Editing Mode */}
          <View style={styles.infoCard}>
            <Ionicons name="business-outline" size={20} color="#F5B041" style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>FIRM NAME</Text>
              {isEditing ? (
                <TextInput style={styles.editInput} value={editFirmName} onChangeText={setEditFirmName} placeholder="Enter Firm Name" placeholderTextColor="#9C9281" />
              ) : (
                <Text style={styles.infoText}>{userData?.['Firm Name'] || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={20} color="#F5B041" style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>REGISTERED ADDRESS</Text>
              {isEditing ? (
                <TextInput style={styles.editInput} value={editAddress} onChangeText={setEditAddress} placeholder="Enter Address" placeholderTextColor="#9C9281" />
              ) : (
                <Text style={styles.infoText}>{userData?.['Address'] || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="call-outline" size={20} color="#F5B041" style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>CONTACT NUMBER</Text>
              {isEditing ? (
                <TextInput style={styles.editInput} value={editContact} onChangeText={setEditContact} placeholder="Enter Contact Number" placeholderTextColor="#9C9281" keyboardType="phone-pad" />
              ) : (
                <Text style={styles.infoText}>{userData?.['Contact'] || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="mail-outline" size={20} color="#F5B041" style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>EMAIL ADDRESS</Text>
              {isEditing ? (
                <TextInput style={styles.editInput} value={editEmail} onChangeText={setEditEmail} placeholder="Enter Email" placeholderTextColor="#9C9281" keyboardType="email-address" />
              ) : (
                <Text style={styles.infoText}>{userData?.['Email'] || 'Not provided'}</Text>
              )}
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity 
              style={styles.saveProfileBtn}
              onPress={async () => {
                const uid = auth.currentUser?.uid;
                if(!uid) return;
                setIsSaving(true);
                try {
                  await update(ref(database, `Users/${uid}`), {
                    'Firm Name': editFirmName,
                    'Address': editAddress,
                    'Contact': editContact,
                    'Email': editEmail,
                  });
                  setIsEditing(false);
                  Alert.alert("Success", "Profile updated successfully!");
                } catch (e) {
                  Alert.alert("Error", e.message);
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? <ActivityIndicator color="black" /> : <Text style={styles.saveProfileBtnText}>SAVE PROFILE</Text>}
            </TouchableOpacity>
          )}

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formHeader}>Send an Inquiry</Text>
            <Text style={styles.formSubHeader}>Our jewelry experts are ready to assist you with your requests.</Text>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g. Alexander Pierce"
              placeholderTextColor="#9C9281"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="alexander@example.com"
              placeholderTextColor="#9C9281"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>YOUR MESSAGE</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us how we can help..."
              placeholderTextColor="#9C9281"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity 
              style={styles.sendBtn}
              onPress={async () => {
                if(!name || !email || !message) return Alert.alert("Inquiry", "Please fill all fields");
                try {
                  // Using Firestore for enquiries so the Trigger Email extension can detect it
                  await addDoc(collection(firestore, 'enquiries'), {
                    to: process.env.EXPO_PUBLIC_INQUIRY_RECEIVER_EMAIL, // The extension uses this field to send the mail
                    message: {
                      subject: `New Inquiry from ${name}`,
                      text: `Name: ${name}\nEmail: ${email}\n\nMessage: ${message}`,
                    },
                    name,
                    email,
                    timestamp: new Date()
                  });
                  Alert.alert("Inquiry", "Your inquiry has been sent successfully!");
                  setName(''); setMessage('');
                } catch(e) {
                  Alert.alert("Inquiry", "Error sending inquiry: " + e.message);
                  console.log(e);
                }
              }}
            >
              <Text style={styles.sendBtnText}>SEND MESSAGE</Text>
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
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  mapContainer: { width: '100%', height: 180, borderRadius: 10, overflow: 'hidden', marginVertical: 15 },
  mapImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mapOverlay: { position: 'absolute', bottom: 15, left: 15, right: 15, backgroundColor: 'rgba(31, 26, 18, 0.9)', padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  overlayTitle: { color: '#F5B041', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  overlayText: { color: 'white', fontSize: 12 },

  infoCard: { flexDirection: 'row', backgroundColor: '#1F1A12', borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#332A1D', alignItems: 'center' },
  infoIcon: { marginRight: 15 },
  infoTitle: { color: '#F5B041', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  infoText: { color: 'white', fontSize: 14 },
  editInput: { color: 'white', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#F5B041', paddingVertical: 2 },
  saveProfileBtn: { backgroundColor: '#F5B041', paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
  saveProfileBtnText: { color: 'black', fontWeight: 'bold', fontSize: 14 },

  formContainer: { backgroundColor: '#1F1A12', borderRadius: 10, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#332A1D' },
  formHeader: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  formSubHeader: { color: '#9C9281', fontSize: 12, marginBottom: 20 },
  
  inputLabel: { color: '#F5B041', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: '#110F0A', borderRadius: 5, padding: 15, color: 'white', fontSize: 14, marginBottom: 15, borderWidth: 1, borderColor: '#332A1D' },
  textArea: { height: 100 },

  sendBtn: { backgroundColor: '#F5B041', paddingVertical: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  sendBtnText: { color: '#110F0A', fontSize: 14, fontWeight: 'bold' },
});
