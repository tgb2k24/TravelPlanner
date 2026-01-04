import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDZxMfgN0kOZETLDnb9Yj8s2yHEOdxoOUk",
  authDomain: "travelplanner10-b837d.firebaseapp.com",
  projectId: "travelplanner10-b837d",
  storageBucket: "travelplanner10-b837d.firebasestorage.app",
  messagingSenderId: "1014371558302",
  appId: "1:1014371558302:web:0d70233e8b265cd513ac8f",
  measurementId: "G-QF7EX811K1"
};
// Google Sign-In Web Client ID
// Using Web client ID from google-services.json (client_type: 3)
export const GOOGLE_WEB_CLIENT_ID = "1014371558302-pu9tg0hal59frc7eqqfm8v06tid6slf5.apps.googleusercontent.com";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, auth, db };

