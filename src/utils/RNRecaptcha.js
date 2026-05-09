import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Clean, production-ready React Native WebView reCAPTCHA flow.
 * Uses Firebase Modular SDK (v10) with inMemoryPersistence to prevent sessionStorage errors.
 */
function buildRecaptchaHtml(firebaseConfig) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #110F0A;
      font-family: sans-serif;
    }
    .loading {
      color: #9C9281;
      font-size: 16px;
      text-align: center;
    }
    #recaptcha-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>
  <p class="loading" id="status">Verifying...</p>
  
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAuth, RecaptchaVerifier, inMemoryPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

    try {
      const firebaseConfig = ${JSON.stringify(firebaseConfig)};
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);

      // Prevent sessionStorage errors completely
      await setPersistence(auth, inMemoryPersistence);

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (token) => {
          document.getElementById('status').innerText = 'Verified!';
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', token: token }));
        },
        'expired-callback': () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'reCAPTCHA expired. Please try again.' }));
        }
      });

      await window.recaptchaVerifier.render();
      
      // Manually trigger verify for invisible reCAPTCHA
      window.recaptchaVerifier.verify().catch(function(err) {
        document.getElementById('status').innerText = 'Please complete the verification';
      });

    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.message || 'Failed to initialize reCAPTCHA' }));
    }
  </script>
</body>
</html>`;
}

export const RNRecaptcha = forwardRef(({ firebaseConfig, baseUrl = 'https://om-ornament.firebaseapp.com' }, ref) => {
  const [visible, setVisible] = useState(false);
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      return new Promise((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;
        setVisible(true);
      });
    },
    close: () => {
      setVisible(false);
    }
  }));

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'token') {
        setVisible(false);
        resolveRef.current?.(data.token);
      } else if (data.type === 'error') {
        setVisible(false);
        rejectRef.current?.(new Error(data.error));
      }
    } catch (e) {
      // ignore parse error
    }
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    rejectRef.current?.(new Error('reCAPTCHA verification cancelled by user.'));
  }, []);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Security Check</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: buildRecaptchaHtml(firebaseConfig), baseUrl }}
            onMessage={handleMessage}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            bounces={false}
          />
        </View>
      </View>
    </Modal>
  );
});

RNRecaptcha.displayName = 'RNRecaptcha';

/**
 * Standard Firebase v9 ApplicationVerifier implementation.
 * Guarantees a Promise-based verify() method to prevent 'undefined is not a function' error.
 */
export class FirebaseApplicationVerifier {
  constructor(token) {
    this.type = 'recaptcha';
    this._token = token;
  }

  verify() {
    return Promise.resolve(this._token);
  }

  getResponse() {
    return Promise.resolve(this._token);
  }

  render() {
    return Promise.resolve(this._token);
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    height: 400,
    backgroundColor: '#1F1A12',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#110F0A',
  },
  headerText: {
    color: '#F5B041',
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#9C9281',
    fontSize: 18,
  },
  webview: {
    flex: 1,
    backgroundColor: '#110F0A',
  },
});
