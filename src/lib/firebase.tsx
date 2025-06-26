// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSsUVgQ1X0pJwzusNhX2ySkAx8SpjPlqw",
  authDomain: "baigunrealty-tor.firebaseapp.com",
  projectId: "baigunrealty-tor",
  storageBucket: "baigunrealty-tor.firebasestorage.app",
  messagingSenderId: "540254959086",
  appId: "1:540254959086:web:a44536fbf688e636a20aff",
  measurementId: "G-4X78T2WQX2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
