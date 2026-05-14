import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { database, auth } from '../config/firebase';

export default function ProfileScreen({ navigation }) {
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
    const uid = auth().currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      return;
    }

    const userRef = database().ref(`Users/${uid}`);
    const onUserValue = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);
        
        // Initialize edit states
        setEditFirmName(data['Firm Name'] || '');
        setEditAddress(data['Address'] || '');
        setEditContact(data['Contact'] || '');
        setEditEmail(data['Email'] || '');
      }
      setIsLoading(false);
    };
    userRef.on('value', onUserValue);

    return () => userRef.off('value', onUserValue);
  }, []);

  const handleSaveProfile = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    setIsSaving(true);
    try {
      await database().ref(`Users/${uid}`).update({
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
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MY PROFILE</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#F5B041" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.profileHeader}>
            <Ionicons name="person-circle-outline" size={80} color="#F5B041" />
            <Text style={styles.profileName}>{userData?.['Firm Name'] || 'Jewelry Partner'}</Text>
            <Text style={styles.profileSubtitle}>Registered Member</Text>
          </View>

          {/* User Info Cards */}
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
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="black" /> : <Text style={styles.saveProfileBtnText}>SAVE PROFILE</Text>}
            </TouchableOpacity>
          )}

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
  profileHeader: { alignItems: 'center', marginVertical: 30 },
  profileName: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  profileSubtitle: { color: '#F5B041', fontSize: 12, letterSpacing: 1, marginTop: 5 },
  infoCard: { flexDirection: 'row', backgroundColor: '#1F1A12', borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#332A1D', alignItems: 'center' },
  infoIcon: { marginRight: 15 },
  infoTitle: { color: '#F5B041', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  infoText: { color: 'white', fontSize: 14 },
  editInput: { color: 'white', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#F5B041', paddingVertical: 2 },
  saveProfileBtn: { backgroundColor: '#F5B041', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveProfileBtnText: { color: 'black', fontWeight: 'bold', fontSize: 14 },
});
