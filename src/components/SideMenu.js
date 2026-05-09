import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

export default function SideMenu({ visible, onClose, navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (e) {
      console.log('Error logging out', e);
    }
  };

  const navigateTo = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.background} onPress={onClose} activeOpacity={1} />
        <View style={styles.menuContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>MENU</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.links}>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigateTo('HOME')}>
              <Ionicons name="home-outline" size={20} color="#F5B041" style={styles.icon} />
              <Text style={styles.linkText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigateTo('SHOP')}>
              <Ionicons name="bag-outline" size={20} color="#F5B041" style={styles.icon} />
              <Text style={styles.linkText}>Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => navigateTo('SAVED')}>
              <Ionicons name="heart-outline" size={20} color="#F5B041" style={styles.icon} />
              <Text style={styles.linkText}>Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => navigateTo('ACCOUNT')}>
              <Ionicons name="person-outline" size={20} color="#F5B041" style={styles.icon} />
              <Text style={styles.linkText}>Account</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.icon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  background: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  menuContainer: { position: 'absolute', top: 0, left: 0, width: width * 0.7, height: height, backgroundColor: '#110F0A', padding: 20, borderRightWidth: 1, borderColor: '#332A1D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  title: { color: '#F5B041', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  links: { flex: 1 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#1F1A12' },
  icon: { marginRight: 15 },
  linkText: { color: 'white', fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderColor: '#332A1D', marginBottom: 20 },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' }
});
