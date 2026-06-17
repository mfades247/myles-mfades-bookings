import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKvghVeXneozH8qCqUTBIea5Q735PRw5k",
  authDomain: "june-17-bookings.firebaseapp.com",
  projectId: "june-17-bookings",
  storageBucket: "june-17-bookings.firebasestorage.app",
  messagingSenderId: "845888294438",
  appId: "1:845888294438:web:43cefd735d30d8778ca0e7",
  measurementId: "G-HEWKG977BW"
};

const app = initializeApp(firebaseConfig);

const dateCards = document.getElementById("dateCards");

dateCards.innerHTML = `
  <div class="date-card">
    June 17, 2026
  </div>
`;

console.log("MFades Booking App Loaded");
