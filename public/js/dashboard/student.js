// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAihSpLsBqzXZ0RwuD13Txh_qBxEil8kLY",
  authDomain: "campus-connect-portal.firebaseapp.com",
  projectId: "campus-connect-portal",
  storageBucket: "campus-connect-portal.firebasestorage.app",
  messagingSenderId: "790415624874",
  appId: "1:790415624874:web:b5d9adb44c880567631ed3",
  measurementId: "G-FPCS9NSCFD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Select DOM elements
const studentName = document.getElementById("student-name");
const studentID = document.getElementById("student-id");
const studentDept = document.getElementById("student-department");
const studentMajor = document.getElementById("student-major");

// Check user auth status
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;

    try {
      const docRef = doc(db, "students", uid); // assumes your collection is "students"
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        studentName.textContent = data.name || "N/A";
        studentID.textContent = data.iubId || "N/A";
        studentDept.textContent = data.department || "N/A";
        studentMajor.textContent = data.major || "N/A";
      } else {
        alert("Student data not found.");
      }
    } catch (error) {
      console.error("Error getting document:", error);
      alert("Failed to fetch data.");
    }
  } else {
    // Redirect to login if not authenticated
    window.location.href = "/login.html";
  }
});

// Logout
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "/login.html";
  });
};
