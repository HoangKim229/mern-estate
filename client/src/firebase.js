// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-estate-8f277.firebaseapp.com",
  projectId: "mern-estate-8f277",
  storageBucket: "mern-estate-8f277.appspot.com",
  messagingSenderId: "249392453828",
  appId: "1:249392453828:web:614d0907159e920e981191"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);