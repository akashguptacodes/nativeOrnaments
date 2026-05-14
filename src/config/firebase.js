import authModule, { onAuthStateChanged } from '@react-native-firebase/auth';
import databaseModule from '@react-native-firebase/database';
import firestoreModule from '@react-native-firebase/firestore';
import storageModule from '@react-native-firebase/storage';
import appModule from '@react-native-firebase/app';

// Functional instances
const auth = authModule;
const database = databaseModule;
const firestore = firestoreModule;
const storage = storageModule;
const app = appModule;

export { app, auth, database, firestore, storage, onAuthStateChanged };
