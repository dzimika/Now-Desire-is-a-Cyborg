import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBDtYeU12H_E-STSr5Q0F4JjNL3KvrA9LI",
    authDomain: "desired-project.firebaseapp.com",
    projectId: "desired-project",
    storageBucket: "desired-project.appspot.com",
    messagingSenderId: "1066029117859",
    appId: "1:1066029117859:web:d96e797a0fcde37017aa16"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
    persistence : getReactNativePersistence(AsyncStorage)
});

export { app, db, auth };
