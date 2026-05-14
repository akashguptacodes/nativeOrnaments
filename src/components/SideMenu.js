import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';

const { width, height } = Dimensions.get('window');

export default function SideMenu({ visible, onClose, navigation }) {
  const handleLogout = async () => {
    try {
      await auth().signOut();
      onClose();
    } catch (e) {
      console.log('Error logging out', e);
    }
  };

  const navigateTo = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleSupport = () => {
    const phoneNumber = '9532565971';
    const message = "Hello Multiqo Team! 👋 I am using the Om Ornaments mobile app and would like some support regarding my experience. Looking forward to connecting with you! ✨";
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        Linking.openURL(webUrl);
      }
    });
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

            <TouchableOpacity style={styles.linkBtn} onPress={() => navigateTo('Contact')}>
              <Ionicons name="help-buoy-outline" size={20} color="#F5B041" style={styles.icon} />
              <Text style={styles.linkText}>Contact Us</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => navigateTo('ACCOUNT')}>
              <Ionicons name="person-outline" size={20} color="#F5B041" style={styles.icon} />
              <Text style={styles.linkText}>Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.linkBtn, { borderBottomWidth: 0 }]} onPress={handleSupport}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#F5B041" style={styles.icon} />
              <Text style={styles.linkText}>Support with Multiqo</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.icon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Designed and developed by</Text>
            <Text style={styles.footerBrand}>Multiqo</Text>
          </View>
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
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  footer: { alignItems: 'center', marginBottom: 20 },
  footerText: { color: '#9C9281', fontSize: 10, fontWeight: '300' },
  footerBrand: { color: '#F5B041', fontSize: 12, fontWeight: 'bold', marginTop: 2 }
});
