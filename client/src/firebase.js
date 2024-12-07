import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-estate-8f277.firebaseapp.com",
  projectId: "mern-estate-8f277",
  storageBucket: "mern-estate-8f277.appspot.com",
  messagingSenderId: "249392453828",
  appId: "1:249392453828:web:614d0907159e920e981191"
};

export const app = initializeApp(firebaseConfig);