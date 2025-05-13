import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBurvPX5zajWNirsliPD2QIheRvxq7EXxc",
  authDomain: "bodega-54c10.firebaseapp.com",
  projectId: "bodega-54c10",
  storageBucket: "bodega-54c10.firebasestorage.app",
  messagingSenderId: "1007463717821",
  appId: "1:1007463717821:web:30a35ab812a7ff81dd50d4",
  measurementId: "G-CEF09511TH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };