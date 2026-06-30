// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCe6cAmHVm9h8CE-98RbGnIM_ASvDIG9Qs",
  authDomain: "wasteguideai-a9566.firebaseapp.com",
  projectId: "wasteguideai-a9566",
  storageBucket: "wasteguideai-a9566.firebasestorage.app",
  messagingSenderId: "655105394312",
  appId: "1:655105394312:web:986cad697d8e4bfd87c13d",
  measurementId: "G-2Z5EX08TKK"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
